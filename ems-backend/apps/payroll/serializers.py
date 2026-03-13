from rest_framework import serializers

from .models import PayrollRun, Payslip, TaxSlab


class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = '__all__'
        read_only_fields = ('tenant',)
        read_only_fields = ('tenant',)
        read_only_fields = ('tenant',)


class TaxSlabSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxSlab
        fields = '__all__'


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_designation = serializers.SerializerMethodField()
    payroll_month = serializers.SerializerMethodField()
    payroll_status = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = '__all__'

    def get_employee_name(self, obj):
        if obj.employee and obj.employee.user:
            return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip()
        return 'Unknown'

    def get_employee_designation(self, obj):
        if obj.employee and obj.employee.designation:
            return obj.employee.designation.title
        return 'N/A'

    def get_payroll_month(self, obj):
        if obj.payroll_run and obj.payroll_run.month:
            return obj.payroll_run.month.isoformat()
        return None

    def get_payroll_status(self, obj):
        if obj.payroll_run:
            return obj.payroll_run.status
        return None
