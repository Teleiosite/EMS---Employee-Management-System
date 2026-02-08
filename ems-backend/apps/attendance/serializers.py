from rest_framework import serializers

from .models import AttendanceCorrectionRequest, AttendanceLog


class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = '__all__'


class AttendanceCorrectionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceCorrectionRequest
        fields = '__all__'

    def validate(self, attrs):
        requested_by = attrs.get('requested_by')
        attendance_log = attrs.get('attendance_log')
        if requested_by and attendance_log and requested_by.role not in {'ADMIN', 'HR_MANAGER'}:
            if attendance_log.employee.user != requested_by:
                raise serializers.ValidationError('Employees can only request corrections for their own attendance.')
        return attrs

    def update(self, instance, validated_data):
        status_value = validated_data.get('status')
        if status_value == 'APPROVED':
            instance.attendance_log.clock_in_timestamp = validated_data.get('requested_clock_in', instance.requested_clock_in)
            instance.attendance_log.clock_out_timestamp = validated_data.get('requested_clock_out', instance.requested_clock_out)
            instance.attendance_log.save(update_fields=['clock_in_timestamp', 'clock_out_timestamp'])
        return super().update(instance, validated_data)
