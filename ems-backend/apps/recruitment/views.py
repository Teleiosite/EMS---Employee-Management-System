from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Q

from apps.core.permissions import IsAdminOrHRManager, IsApplicant, IsApplicantOwner
from apps.core.tenancy import resolve_tenant
from .models import Candidate, JobPosting, ApplicantProfile, AISettings, CandidateStatusHistory
from .serializers import (
    CandidateSerializer,
    CandidateListSerializer,
    CandidateStatusUpdateSerializer,
    JobPostingSerializer,
    JobPostingPublicSerializer,
    ApplicantCandidateSerializer,
    ApplicantApplicationSerializer,
    ApplicantProfileSerializer,
    AISettingsSerializer,
    PublicCandidateApplicationSerializer,
)
from .utils import parse_resume, analyze_candidate


# ---------------------------------------------------------------------------
# SECURITY: Resume file validation
# ---------------------------------------------------------------------------
_ALLOWED_RESUME_EXTENSIONS = {'.pdf'}
_MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _validate_resume_file(file):
    """
    Raise a ValidationError if the uploaded file is not a PDF or exceeds 5 MB.
    Call this before passing the file to parse_resume().
    """
    from rest_framework.exceptions import ValidationError
    import os

    if file is None:
        return

    ext = os.path.splitext(file.name)[-1].lower()
    if ext not in _ALLOWED_RESUME_EXTENSIONS:
        raise ValidationError(
            f"Only PDF files are accepted for resume upload. Received: '{ext or 'no extension'}'."
        )

    if file.size > _MAX_RESUME_SIZE_BYTES:
        max_mb = _MAX_RESUME_SIZE_BYTES // (1024 * 1024)
        raise ValidationError(
            f"Resume file exceeds the maximum allowed size of {max_mb} MB."
        )


# ============================================
# ADMIN/HR VIEWS - Full access to recruitment
# ============================================

class JobPostingViewSet(viewsets.ModelViewSet):
    """Admin/HR management of job postings"""
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [IsAdminOrHRManager]
    
    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return JobPosting.objects.none()
            
        queryset = super().get_queryset().filter(tenant=tenant)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))


class AISettingsView(generics.RetrieveUpdateAPIView):
    """Admin/HR management of AI Resume Parsing Settings. 
    Returns the singleton setting object."""
    serializer_class = AISettingsSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_object(self):
        tenant = resolve_tenant(self.request)
        return AISettings.get_settings(tenant)

    @action(detail=False, methods=['post'])
    def test_connection(self, request):
        """Verify the provided Gemini API key actually works."""
        api_key = request.data.get('gemini_api_key')
        if not api_key:
            return Response({'error': 'API Key is required for testing.'}, status=status.HTTP_400_BAD_REQUEST)

        # Simple reachability test using a dummy prompt
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": "Hello, respond with 'OK' if you can read this."}]}]
        }
        
        try:
            import requests
            response = requests.post(url, json=payload, timeout=10)
            if response.ok:
                return Response({'success': True, 'message': 'API Key verified successfully!'})
            else:
                return Response({
                    'success': False, 
                    'error': f"API rejected the request: {response.status_code}",
                    'details': response.text
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CandidateViewSet(viewsets.ModelViewSet):
    """Admin/HR management of candidates - includes AI analysis"""
    queryset = Candidate.objects.select_related('job', 'user').all()
    permission_classes = [IsAdminOrHRManager]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CandidateListSerializer
        if self.action in ['update_status', 'partial_update']:
            return CandidateStatusUpdateSerializer
        return CandidateSerializer
    
    def get_queryset(self):
        user = self.request.user
        tenant = resolve_tenant(self.request)
        if not user.is_superuser and not tenant:
            return Candidate.objects.none()

        queryset = super().get_queryset().filter(tenant=tenant)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by job
        job_id = self.request.query_params.get('job')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        
        # Order by fit score descending by default
        return queryset.order_by('-ai_fit_score', '-applied_at')

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update candidate status with optional message"""
        candidate = self.get_object()
        serializer = CandidateStatusUpdateSerializer(
            candidate,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        
        # Set reviewed timestamp
        candidate.reviewed_at = timezone.now()
        serializer.save()
        
        # Record history
        CandidateStatusHistory.objects.create(
            candidate=candidate,
            status=candidate.status,
            message=candidate.status_message or f"Status updated to {candidate.get_status_display()}"
        )
        
        return Response(CandidateSerializer(candidate).data)
    
    @action(detail=True, methods=['post'])
    def schedule_interview(self, request, pk=None):
        """Schedule interview for a candidate"""
        from django.utils.dateparse import parse_datetime
        from rest_framework.exceptions import ValidationError

        candidate = self.get_object()
        
        scheduled_at_str = request.data.get('scheduled_at')
        if scheduled_at_str:
            scheduled_at = parse_datetime(scheduled_at_str)
            if not scheduled_at:
                raise ValidationError({'scheduled_at': 'Invalid datetime format.'})
        else:
            scheduled_at = None

        candidate.status = 'INTERVIEWING'
        candidate.interview_scheduled_at = scheduled_at
        candidate.interview_location = request.data.get('location', '')
        candidate.interview_notes = request.data.get('notes', '')
        candidate.status_message = "We'd like to meet you! Check your email for interview details."
        candidate.save()
        
        # Record history
        CandidateStatusHistory.objects.create(
            candidate=candidate,
            status='INTERVIEWING',
            message=f"Interview scheduled for {candidate.interview_scheduled_at.strftime('%Y-%m-%d %H:%M')} at {candidate.interview_location}"
        )
        return Response(CandidateSerializer(candidate).data)
    
    @action(detail=True, methods=['post'])
    def hire(self, request, pk=None):
        """Mark candidate as hired"""
        candidate = self.get_object()
        candidate.status = 'HIRED'
        candidate.status_message = "Congratulations! We're excited to have you join our team."
        candidate.save()
        
        # Record history
        CandidateStatusHistory.objects.create(
            candidate=candidate,
            status='HIRED',
            message=candidate.status_message
        )
        return Response(CandidateSerializer(candidate).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a candidate"""
        candidate = self.get_object()
        candidate.status = 'REJECTED'
        candidate.status_message = request.data.get(
            'message',
            "Thank you for your interest. We've decided to move forward with other candidates."
        )
        candidate.hr_notes = request.data.get('notes', candidate.hr_notes)
        candidate.save()
        
        # Record history
        CandidateStatusHistory.objects.create(
            candidate=candidate,
            status='REJECTED',
            message=candidate.status_message
        )
        return Response(CandidateSerializer(candidate).data)

    @action(detail=True, methods=['post'])
    def parse_resume(self, request, pk=None):
        """Manually trigger resume parsing"""
        candidate = self.get_object()
        if not candidate.resume:
            return Response({'error': 'No resume file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
             parsed_data = parse_resume(candidate.resume, tenant=candidate.tenant)
             candidate.parsed_resume_data = parsed_data
             
             # Calculate Fit Score
             analysis_results = analyze_candidate(candidate, candidate.job)
             candidate.ai_fit_score = analysis_results['ai_fit_score']
             candidate.ai_analysis = analysis_results['ai_analysis']
             candidate.ai_skill_match = analysis_results['ai_skill_match']
             candidate.save()
             return Response(CandidateSerializer(candidate).data)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# APPLICANT VIEWS - Limited access
# ============================================

class PublicJobListView(generics.ListAPIView):
    """Public job listings - anyone can view open jobs"""
    serializer_class = JobPostingPublicSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        queryset = JobPosting.objects.filter(status='OPEN', is_active=True)
        tenant_slug = self.request.query_params.get('tenant')
        if tenant_slug:
            queryset = queryset.filter(tenant__slug=tenant_slug)
        return queryset


class PublicApplicationViewSet(generics.CreateAPIView):
    """Submit a job application without an account"""
    serializer_class = PublicCandidateApplicationSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        if not job_id:
            return Response({'error': 'Job ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job = JobPosting.objects.get(id=job_id)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        email = request.data.get('email', '').strip().lower()  # normalise – prevents case-duplicate bypass
        if Candidate.objects.filter(email__iexact=email, job_id=job_id).exists():
            return Response(
                {'error': 'An application with this email already exists for this position.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # SECURITY: Validate resume before saving to disk
        resume_file = request.FILES.get('resume')
        if resume_file:
            _validate_resume_file(resume_file)

        # Link candidate to the job's tenant
        candidate = serializer.save(tenant=job.tenant, status='APPLIED')
        
        if candidate.resume:
             try:
                 # Offload to background task
                 from .tasks import process_resume_parsing_task
                 process_resume_parsing_task.delay(candidate_id=candidate.id)
                 
             except Exception as e:
                 print(f"Error enqueuing resume parse task: {e}")
                 
        return Response(
            {'message': 'Application submitted successfully.', 'id': candidate.id},
            status=status.HTTP_201_CREATED
        )


class ApplicantApplicationListView(generics.ListAPIView):
    """Applicant's own applications - read only"""
    serializer_class = ApplicantCandidateSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        return Candidate.objects.filter(
            Q(user=user) | Q(email__iexact=user.email)
        ).select_related('job', 'tenant').distinct()


class ApplicantApplicationDetailView(generics.RetrieveAPIView):
    """Single application detail for applicant"""
    serializer_class = ApplicantCandidateSerializer
    permission_classes = [IsAuthenticated, IsApplicant, IsApplicantOwner]
    
    def get_queryset(self):
        user = self.request.user
        return Candidate.objects.filter(
            Q(user=user) | Q(email__iexact=user.email)
        ).select_related('job', 'tenant').distinct()


class ApplicantApplyView(generics.CreateAPIView):
    """Submit a job application"""
    serializer_class = ApplicantApplicationSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        if not job_id:
            return Response({'error': 'Job is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            job = JobPosting.objects.get(id=job_id)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check if already applied
        if Candidate.objects.filter(user=request.user, job_id=job_id, tenant=job.tenant).exists():
            return Response(
                {'error': 'You have already applied for this position.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # SECURITY: Validate resume before saving to disk
        resume_file = request.FILES.get('resume')
        if resume_file:
            _validate_resume_file(resume_file)

        candidate = serializer.save(tenant=job.tenant)
        
        # Trigger AI resume parsing (Background)
        if candidate.resume:
             try:
                 from .tasks import process_resume_parsing_task
                 process_resume_parsing_task.delay(candidate_id=candidate.id)
             except Exception as e:
                 print(f"Error enqueuing resume parse task: {e}")
        
        # Record initial history
        CandidateStatusHistory.objects.create(
            candidate=candidate,
            status='APPLIED',
            message="Application submitted successfully."
        )
        
        return Response(
            ApplicantCandidateSerializer(candidate).data,
            status=status.HTTP_201_CREATED
        )


class ApplicantProfileView(generics.RetrieveUpdateAPIView):
    """Applicant's profile management"""
    serializer_class = ApplicantProfileSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_object(self):
        # Get or create profile for the applicant
        profile, created = ApplicantProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # If resume uploaded, update timestamp
        if 'current_resume' in request.FILES:
            instance.resume_uploaded_at = timezone.now()
            instance.save()
            
            # Trigger AI parsing (Background)
            try:
                from .tasks import process_resume_parsing_task
                process_resume_parsing_task.delay(profile_id=instance.id)
            except Exception as e:
                 print(f"Error enqueuing profile resume parse task: {e}")
        
        self.perform_update(serializer)
        return Response(serializer.data)


class ApplicantResumeUploadView(generics.UpdateAPIView):
    """Upload/update resume for applicant profile"""
    serializer_class = ApplicantProfileSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        profile, created = ApplicantProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if 'current_resume' not in request.FILES:
            return Response(
                {'error': 'No resume file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.current_resume = request.FILES['current_resume']
        instance.resume_uploaded_at = timezone.now()
        instance.save()
        
        # Trigger AI parsing (Background)
        try:
            from .tasks import process_resume_parsing_task
            process_resume_parsing_task.delay(profile_id=instance.id)
        except Exception as e:
            return Response({'error': f"Failed to enqueue parsing: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(ApplicantProfileSerializer(instance).data)
