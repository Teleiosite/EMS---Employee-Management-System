from rest_framework import viewsets

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import PayrollRun, Payslip, TaxSlab
from .serializers import PayrollRunSerializer, PayslipSerializer, TaxSlabSerializer


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
    permission_classes = [IsAdminOrHRManager]


class TaxSlabViewSet(viewsets.ModelViewSet):
    queryset = TaxSlab.objects.all()
    serializer_class = TaxSlabSerializer
    permission_classes = [IsAdminOrHRManager]


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payslip.objects.select_related('employee', 'employee__user', 'payroll_run').all()
    serializer_class = PayslipSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(employee__user=user)

    def get_permissions(self):
        return [IsSelfOrAdminOrHR()]
