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
        return AISettings.get_settings()


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
        candidate = self.get_object()
        candidate.status = 'INTERVIEWING'
        candidate.interview_scheduled_at = request.data.get('scheduled_at')
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
             parsed_data = parse_resume(candidate.resume)
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

        email = request.data.get('email')
        if Candidate.objects.filter(email=email, job_id=job_id).exists():
            return Response(
                {'error': 'An application with this email already exists for this position.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Link candidate to the job's tenant
        candidate = serializer.save(tenant=job.tenant, status='APPLIED')
        
        if candidate.resume:
             try:
                 parsed_data = parse_resume(candidate.resume)
                 candidate.parsed_resume_data = parsed_data
                 
                 analysis_results = analyze_candidate(candidate, candidate.job)
                 candidate.ai_fit_score = analysis_results['ai_fit_score']
                 candidate.ai_analysis = analysis_results['ai_analysis']
                 candidate.ai_skill_match = analysis_results['ai_skill_match']
                 candidate.save()
             except Exception as e:
                 print(f"Error parsing resume via public endpoint: {e}")
                 
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
        
        # Check if already applied
        if Candidate.objects.filter(user=request.user, job_id=job_id, tenant=resolve_tenant(request)).exists():
            return Response(
                {'error': 'You have already applied for this position.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save(tenant=resolve_tenant(request))
        
        # Trigger AI resume parsing
        if candidate.resume:
             try:
                 parsed_data = parse_resume(candidate.resume)
                 candidate.parsed_resume_data = parsed_data
                 
                 # Calculate Fit Score
                 analysis_results = analyze_candidate(candidate, candidate.job)
                 candidate.ai_fit_score = analysis_results['ai_fit_score']
                 candidate.ai_analysis = analysis_results['ai_analysis']
                 candidate.ai_skill_match = analysis_results['ai_skill_match']
                 candidate.save()
             except Exception as e:
                 print(f"Error parsing resume: {e}")
        
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
            user=self.request.user,
            defaults={'tenant': resolve_tenant(self.request)}
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
            # Trigger AI parsing
            try:
                parsed_data = parse_resume(instance.current_resume)
                instance.resume_parsed_data = parsed_data
                
                # Update Applicant Profile fields based on resume
                instance.skills = parsed_data.get('skills', [])
                instance.education = parsed_data.get('education', [])
                instance.experience = parsed_data.get('experience', [])
                instance.years_of_experience = parsed_data.get('experience_years', 0)
                instance.headline = parsed_data.get('headline', '')
                instance.save()
            except Exception as e:
                 print(f"Error parsing profile resume: {e}")
        
        self.perform_update(serializer)
        return Response(serializer.data)


class ApplicantResumeUploadView(generics.UpdateAPIView):
    """Upload/update resume for applicant profile"""
    serializer_class = ApplicantProfileSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self):
        profile, created = ApplicantProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'tenant': resolve_tenant(self.request)}
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
        
        # Trigger AI parsing
        try:
            parsed_data = parse_resume(instance.current_resume)
            instance.resume_parsed_data = parsed_data
            
            # Update Applicant Profile fields based on resume
            instance.skills = parsed_data.get('skills', [])
            instance.education = parsed_data.get('education', [])
            instance.experience = parsed_data.get('experience', [])
            instance.years_of_experience = parsed_data.get('experience_years', 0)
            instance.headline = parsed_data.get('headline', '')
            instance.save()
        except Exception as e:
                print(f"Error parsing profile resume: {e}")
        
        return Response(ApplicantProfileSerializer(instance).data)
