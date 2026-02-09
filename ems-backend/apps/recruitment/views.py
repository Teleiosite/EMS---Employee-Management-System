from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q

from apps.core.permissions import IsAdminOrHRManager, IsApplicant, IsApplicantOwner
from .models import Candidate, JobPosting, ApplicantProfile
from .serializers import (
    CandidateSerializer,
    CandidateListSerializer,
    CandidateStatusUpdateSerializer,
    JobPostingSerializer,
    JobPostingPublicSerializer,
    ApplicantCandidateSerializer,
    ApplicantApplicationSerializer,
    ApplicantProfileSerializer,
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
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


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
        queryset = super().get_queryset()
        
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
        return Response(CandidateSerializer(candidate).data)
    
    @action(detail=True, methods=['post'])
    def hire(self, request, pk=None):
        """Mark candidate as hired"""
        candidate = self.get_object()
        candidate.status = 'HIRED'
        candidate.status_message = "Congratulations! We're excited to have you join our team."
        candidate.save()
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
        return Response(CandidateSerializer(candidate).data)


# ============================================
# APPLICANT VIEWS - Limited access
# ============================================

class PublicJobListView(generics.ListAPIView):
    """Public job listings - anyone can view open jobs"""
    queryset = JobPosting.objects.filter(status='OPEN', is_active=True)
    serializer_class = JobPostingPublicSerializer
    permission_classes = [AllowAny]


class ApplicantApplicationListView(generics.ListAPIView):
    """Applicant's own applications - read only"""
    serializer_class = ApplicantCandidateSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    
    def get_queryset(self):
        return Candidate.objects.filter(user=self.request.user).select_related('job')


class ApplicantApplicationDetailView(generics.RetrieveAPIView):
    """Single application detail for applicant"""
    serializer_class = ApplicantCandidateSerializer
    permission_classes = [IsAuthenticated, IsApplicant, IsApplicantOwner]
    
    def get_queryset(self):
        return Candidate.objects.filter(user=self.request.user).select_related('job')


class ApplicantApplyView(generics.CreateAPIView):
    """Submit a job application"""
    serializer_class = ApplicantApplicationSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        
        # Check if already applied
        if Candidate.objects.filter(user=request.user, job_id=job_id).exists():
            return Response(
                {'error': 'You have already applied for this position.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save()
        
        # TODO: Trigger AI resume parsing here
        # parse_resume_task.delay(candidate.id)
        
        return Response(
            ApplicantCandidateSerializer(candidate).data,
            status=status.HTTP_201_CREATED
        )


class ApplicantProfileView(generics.RetrieveUpdateAPIView):
    """Applicant's profile management"""
    serializer_class = ApplicantProfileSerializer
    permission_classes = [IsAuthenticated, IsApplicant]
    parser_classes = [MultiPartParser, FormParser]
    
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
            # TODO: Trigger AI parsing
            # parse_profile_resume_task.delay(instance.id)
        
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
        
        # TODO: Trigger AI parsing
        # parse_profile_resume_task.delay(instance.id)
        
        return Response(ApplicantProfileSerializer(instance).data)
