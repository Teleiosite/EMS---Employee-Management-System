from rest_framework import viewsets
from .models import Candidate, JobPosting
from .serializers import CandidateSerializer, JobPostingSerializer


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer


class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.select_related('job').all()
    serializer_class = CandidateSerializer
