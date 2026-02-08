from rest_framework import viewsets
from .models import PayrollRun
from .serializers import PayrollRunSerializer


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
