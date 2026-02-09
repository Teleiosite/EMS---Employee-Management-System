from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Admin/HR Views
    JobPostingViewSet,
    CandidateViewSet,
    # Applicant Views
    PublicJobListView,
    ApplicantApplicationListView,
    ApplicantApplicationDetailView,
    ApplicantApplyView,
    ApplicantProfileView,
    ApplicantResumeUploadView,
)

router = DefaultRouter()
router.register(r'jobs', JobPostingViewSet, basename='job')
router.register(r'candidates', CandidateViewSet, basename='candidate')

urlpatterns = [
    # Admin/HR routes (via router)
    path('', include(router.urls)),
    
    # Public job listings (for applicants)
    path('public/jobs/', PublicJobListView.as_view(), name='public-jobs'),
    
    # Applicant-specific routes
    path('applicant/applications/', ApplicantApplicationListView.as_view(), name='applicant-applications'),
    path('applicant/applications/<int:pk>/', ApplicantApplicationDetailView.as_view(), name='applicant-application-detail'),
    path('applicant/apply/', ApplicantApplyView.as_view(), name='applicant-apply'),
    path('applicant/profile/', ApplicantProfileView.as_view(), name='applicant-profile'),
    path('applicant/resume/', ApplicantResumeUploadView.as_view(), name='applicant-resume'),
]
