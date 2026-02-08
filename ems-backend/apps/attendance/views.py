from rest_framework import viewsets
from .models import AttendanceLog
from .serializers import AttendanceLogSerializer


class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.select_related('employee').all()
    serializer_class = AttendanceLogSerializer
