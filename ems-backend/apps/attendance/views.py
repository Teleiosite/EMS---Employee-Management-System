import hashlib
from datetime import date, datetime, timedelta

from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from .models import AttendanceCorrectionRequest, AttendanceLog, AttendancePolicy
from .serializers import (
    AttendanceCorrectionRequestSerializer,
    AttendanceLogSerializer,
    AttendancePolicySerializer,
)


def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _check_proxy(employee, today_ip, today_fingerprint, today_log):
    """
    Compare today's IP + fingerprint against employee's last 5 logs.
    Flag if BOTH are completely new (never seen before).
    Also flag if another employee used the same IP within 5 minutes.
    """
    reasons = []

    recent = AttendanceLog.objects.filter(
        employee=employee,
    ).exclude(pk=today_log.pk).order_by('-date')[:10]

    known_ips = {r.clock_in_ip for r in recent if r.clock_in_ip}
    known_fps = {r.device_fingerprint for r in recent if r.device_fingerprint}

    ip_new = today_ip and today_ip not in known_ips and len(known_ips) > 0
    fp_new = today_fingerprint and today_fingerprint not in known_fps and len(known_fps) > 0

    if ip_new and fp_new:
        reasons.append('Unrecognised IP address and new device fingerprint — possible proxy attendance')

    # Same-IP rapid clock-in check (within 5 minutes, different employee)
    if today_ip:
        cutoff = timezone.now() - timedelta(minutes=5)
        shared_ip = AttendanceLog.objects.filter(
            clock_in_timestamp__gte=cutoff,
            clock_in_ip=today_ip,
        ).exclude(employee=employee).exists()
        if shared_ip:
            reasons.append(f'Another employee clocked in from the same IP ({today_ip}) within the last 5 minutes')

    return reasons


class ClockInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({'detail': 'No employee profile found for this user.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        now = timezone.now()
        current_time = now.time()

        # Check for existing log
        existing = AttendanceLog.objects.filter(employee=employee, date=today).first()
        if existing and existing.clock_in_timestamp:
            return Response({'detail': 'Already clocked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        policy = AttendancePolicy.get_active()
        if policy:
            if current_time < policy.check_in_start:
                return Response(
                    {'detail': f'Check-in window not open yet. Opens at {policy.check_in_start.strftime("%H:%M")}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if current_time > policy.absent_if_no_checkin_by:
                return Response(
                    {'detail': f'Check-in closed. You are marked ABSENT for today.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Determine status
            late_deadline = (
                datetime.combine(today, policy.check_in_end) + timedelta(minutes=policy.late_grace_minutes)
            ).time()
            attendance_status = 'LATE' if current_time > late_deadline else 'PRESENT'
        else:
            attendance_status = 'PRESENT'

        ip = _get_client_ip(request)
        fingerprint = request.data.get('device_fingerprint', '')

        log, _ = AttendanceLog.objects.get_or_create(employee=employee, date=today)
        log.clock_in_timestamp = now
        log.clock_in_ip = ip
        log.device_fingerprint = fingerprint
        log.status = attendance_status
        log.save()

        # Anti-proxy detection
        proxy_reasons = _check_proxy(employee, ip, fingerprint, log)
        if proxy_reasons:
            log.is_suspicious = True
            log.suspicious_reason = ' | '.join(proxy_reasons)
            log.save(update_fields=['is_suspicious', 'suspicious_reason'])

        return Response({
            'detail': f'Clocked in successfully. Status: {attendance_status}',
            'status': attendance_status,
            'clock_in': now.isoformat(),
            'is_suspicious': log.is_suspicious,
        })


class ClockOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        now = timezone.now()

        log = AttendanceLog.objects.filter(employee=employee, date=today).first()
        if not log or not log.clock_in_timestamp:
            return Response({'detail': 'You have not clocked in today.'}, status=status.HTTP_400_BAD_REQUEST)
        if log.clock_out_timestamp:
            return Response({'detail': 'Already clocked out today.'}, status=status.HTTP_400_BAD_REQUEST)

        ip = _get_client_ip(request)
        log.clock_out_timestamp = now
        log.clock_out_ip = ip

        policy = AttendancePolicy.get_active()
        if policy and now.time() < policy.half_day_if_checkout_before:
            log.status = 'HALF_DAY'

        log.save()

        working_minutes = int((now - log.clock_in_timestamp).total_seconds() / 60)
        hours, mins = divmod(working_minutes, 60)

        return Response({
            'detail': f'Clocked out successfully. You worked {hours}h {mins}m today.',
            'status': log.status,
            'clock_out': now.isoformat(),
            'working_minutes': working_minutes,
        })


class AttendanceStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        now_time = timezone.now().time()
        log = AttendanceLog.objects.filter(employee=employee, date=today).first()

        policy = AttendancePolicy.get_active()
        window_open = False
        window_message = 'No attendance policy configured.'
        if policy:
            if now_time < policy.check_in_start:
                window_message = f'Check-in opens at {policy.check_in_start.strftime("%H:%M")}'
            elif now_time > policy.absent_if_no_checkin_by:
                window_message = 'Check-in window closed for today'
            else:
                window_open = True
                window_message = f'Check-in window open until {policy.absent_if_no_checkin_by.strftime("%H:%M")}'

        log_data = None
        if log:
            log_data = {
                'id': log.id,
                'status': log.status,
                'clock_in': log.clock_in_timestamp.isoformat() if log.clock_in_timestamp else None,
                'clock_out': log.clock_out_timestamp.isoformat() if log.clock_out_timestamp else None,
            }

        return Response({
            'today': str(today),
            'window_open': window_open,
            'window_message': window_message,
            'log': log_data,
            'policy': AttendancePolicySerializer(policy).data if policy else None,
        })


class AttendancePolicyView(generics.RetrieveUpdateAPIView):
    """GET or PUT the active attendance policy. Admin/HR only."""
    serializer_class = AttendancePolicySerializer
    permission_classes = [IsAdminOrHRManager]

    def get_object(self):
        policy = AttendancePolicy.get_active()
        if not policy:
            # Create a sensible default
            policy = AttendancePolicy.objects.create(
                check_in_start='07:00',
                check_in_end='09:00',
                late_grace_minutes=15,
                absent_if_no_checkin_by='11:00',
                half_day_if_checkout_before='13:00',
                check_out_start='16:00',
                check_out_end='18:00',
                is_active=True,
            )
        return policy

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class SuspiciousAttendanceView(generics.ListAPIView):
    """List all suspicious attendance logs. Admin/HR only."""
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        return AttendanceLog.objects.filter(
            is_suspicious=True
        ).select_related('employee', 'employee__user').order_by('-date')


class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.select_related('employee', 'employee__user').all()
    serializer_class = AttendanceLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Support ?date=YYYY-MM-DD filter
        filter_date = self.request.query_params.get('date')
        if filter_date:
            queryset = queryset.filter(date=filter_date)
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset.order_by('-date', '-clock_in_timestamp')
        return queryset.filter(employee__user=user).order_by('-date')

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]


class AttendanceCorrectionRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceCorrectionRequest.objects.select_related('attendance_log', 'requested_by', 'reviewer').all()
    serializer_class = AttendanceCorrectionRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(requested_by=user)

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
