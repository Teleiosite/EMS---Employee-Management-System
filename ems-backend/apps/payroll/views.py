from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager
from .models import PayrollRun
from .serializers import PayrollRunSerializer


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAdminOrHRManager]
