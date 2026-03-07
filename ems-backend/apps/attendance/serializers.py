from rest_framework import serializers
from .models import AttendanceCorrectionRequest, AttendanceLog, AttendancePolicy


class AttendancePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendancePolicy
        fields = '__all__'


class AttendanceLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceLog
        fields = '__all__'

    def get_employee_name(self, obj):
        try:
            u = obj.employee.user
            return f"{u.first_name} {u.last_name}".strip() or u.email
        except Exception:
            return 'Unknown'

    def get_employee_code(self, obj):
        try:
            return obj.employee.employee_id
        except Exception:
            return ''


class AttendanceCorrectionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceCorrectionRequest
        fields = '__all__'
