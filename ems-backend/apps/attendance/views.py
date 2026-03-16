import math
from datetime import date, datetime, timedelta

from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdminOrHRManager, IsSelfOrAdminOrHR
from apps.core.tenancy import resolve_tenant
from .models import AttendanceCorrectionRequest, AttendanceLog, AttendancePolicy
from .serializers import (
    AttendanceCorrectionRequestSerializer,
    AttendanceLogSerializer,
    AttendancePolicySerializer,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _haversine_metres(lat1, lon1, lat2, lon2):
    """Return distance in metres between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _check_ip(policy, client_ip):
    """
    Returns (blocked: bool, reason: str | None)
    """
    if policy.enforce_ip == 'off' or not policy.allowed_ips:
        return False, None
    allowed = [ip.strip() for ip in policy.allowed_ips if ip.strip()]
    if not allowed:
        return False, None
    if client_ip not in allowed:
        reason = f'Sign-in from unlisted IP {client_ip} (allowed: {", ".join(allowed)})'
        return policy.enforce_ip == 'block', reason
    return False, None


def _check_location(policy, latitude, longitude):
    """
    Returns (blocked: bool, reason: str | None, distance: float | None)
    """
    if policy.enforce_location == 'off':
        return False, None, None
    if not policy.office_latitude or not policy.office_longitude:
        return False, None, None
    if latitude is None or longitude is None:
        reason = 'GPS location not provided — required by attendance policy'
        return policy.enforce_location == 'block', reason, None
    distance = _haversine_metres(policy.office_latitude, policy.office_longitude, latitude, longitude)
    if distance > policy.office_radius_meters:
        reason = (
            f'Sign-in from {distance:.0f}m away from office '
            f'(allowed radius: {policy.office_radius_meters}m)'
        )
        return policy.enforce_location == 'block', reason, distance
    return False, None, distance


def _check_proxy(employee, today_ip, today_fingerprint, today_log):
    reasons = []
    recent = AttendanceLog.objects.filter(employee=employee).exclude(pk=today_log.pk).order_by('-date')[:10]
    known_ips = {r.clock_in_ip for r in recent if r.clock_in_ip}
    known_fps = {r.device_fingerprint for r in recent if r.device_fingerprint}

    ip_new = today_ip and today_ip not in known_ips and len(known_ips) > 0
    fp_new = today_fingerprint and today_fingerprint not in known_fps and len(known_fps) > 0

    if ip_new and fp_new:
        reasons.append('New device and IP not seen in last 10 logins — possible proxy attendance')

    if today_ip:
        cutoff = timezone.now() - timedelta(minutes=5)
        shared = AttendanceLog.objects.filter(
            clock_in_timestamp__gte=cutoff,
            clock_in_ip=today_ip,
        ).exclude(employee=employee).exists()
        if shared:
            reasons.append(f'Another employee clocked in from the same IP ({today_ip}) within 5 minutes')

    return reasons


# ─── Views ────────────────────────────────────────────────────────────────────

class ClockInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            employee = request.user.employee_profile
        except Exception:
            return Response({'detail': 'No employee profile found.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        now = timezone.now()
        current_time = now.time()

        existing = AttendanceLog.objects.filter(employee=employee, date=today).first()
        if existing and existing.clock_in_timestamp:
            return Response({'detail': 'Already clocked in today.'}, status=status.HTTP_400_BAD_REQUEST)

        policy = AttendancePolicy.get_active(tenant=resolve_tenant(request))

        # ── Time window check ─────────────────────────────────────────────────
        if policy:
            if current_time < policy.check_in_start:
                return Response(
                    {'detail': f'Check-in opens at {policy.check_in_start.strftime("%H:%M")}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if current_time > policy.absent_if_no_checkin_by:
                return Response(
                    {'detail': 'Check-in window closed. You are marked ABSENT for today.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            late_deadline = (
                datetime.combine(today, policy.check_in_end) + timedelta(minutes=policy.late_grace_minutes)
            ).time()
            attendance_status = 'LATE' if current_time > late_deadline else 'PRESENT'
        else:
            attendance_status = 'PRESENT'

        # ── Gather request data ───────────────────────────────────────────────
        ip = _get_client_ip(request)
        fingerprint = request.data.get('device_fingerprint', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        suspicious_reasons = []
        distance = None

        # ── IP allowlist check ────────────────────────────────────────────────
        if policy:
            ip_blocked, ip_reason = _check_ip(policy, ip)
            if ip_reason:
                if ip_blocked:
                    return Response(
                        {'detail': f'Sign-in blocked: {ip_reason}'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                suspicious_reasons.append(ip_reason)

            # ── GPS / location check ──────────────────────────────────────────
            loc_blocked, loc_reason, distance = _check_location(policy, latitude, longitude)
            if loc_reason:
                if loc_blocked:
                    return Response(
                        {'detail': f'Sign-in blocked: {loc_reason}'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                suspicious_reasons.append(loc_reason)

        # ── Save the log ──────────────────────────────────────────────────────
        log, _ = AttendanceLog.objects.get_or_create(employee=employee, date=today)
        log.clock_in_timestamp = now
        log.clock_in_ip = ip
        log.device_fingerprint = fingerprint
        log.status = attendance_status
        if latitude is not None:
            log.latitude = latitude
        if longitude is not None:
            log.longitude = longitude
        if distance is not None:
            log.distance_from_office = distance
        log.save()

        # ── Anti-proxy detection ──────────────────────────────────────────────
        proxy_reasons = _check_proxy(employee, ip, fingerprint, log)
        suspicious_reasons.extend(proxy_reasons)

        if suspicious_reasons:
            log.is_suspicious = True
            log.suspicious_reason = ' | '.join(suspicious_reasons)
            log.save(update_fields=['is_suspicious', 'suspicious_reason'])

        return Response({
            'detail': f'Clocked in successfully. Status: {attendance_status}',
            'status': attendance_status,
            'clock_in': now.isoformat(),
            'is_suspicious': log.is_suspicious,
            'distance_from_office': distance,
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

        log.clock_out_timestamp = now
        log.clock_out_ip = _get_client_ip(request)

        policy = AttendancePolicy.get_active(tenant=resolve_tenant(request))
        if policy and now.time() < policy.half_day_if_checkout_before:
            log.status = 'HALF_DAY'
        log.save()

        working_minutes = int((now - log.clock_in_timestamp).total_seconds() / 60)
        hours, mins = divmod(working_minutes, 60)
        return Response({
            'detail': f'Clocked out. You worked {hours}h {mins}m today.',
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

        policy = AttendancePolicy.get_active(tenant=resolve_tenant(request))
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
                'distance_from_office': log.distance_from_office,
            }

        return Response({
            'today': str(today),
            'window_open': window_open,
            'window_message': window_message,
            'log': log_data,
            'policy': AttendancePolicySerializer(policy).data if policy else None,
        })


class AttendancePolicyView(generics.RetrieveUpdateAPIView):
    serializer_class = AttendancePolicySerializer
    permission_classes = [IsAdminOrHRManager]

    def get_object(self):
        tenant = resolve_tenant(self.request)
        policy = AttendancePolicy.get_active(tenant=tenant)
        if not policy:
            policy = AttendancePolicy.objects.create(
                tenant=tenant,
                check_in_start='07:00', check_in_end='09:00',
                late_grace_minutes=15, absent_if_no_checkin_by='11:00',
                half_day_if_checkout_before='13:00',
                check_out_start='16:00', check_out_end='18:00',
                is_active=True,
            )
        return policy

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class SuspiciousAttendanceView(generics.ListAPIView):
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAdminOrHRManager]

    def get_queryset(self):
        return AttendanceLog.objects.filter(
            tenant=resolve_tenant(self.request),
            is_suspicious=True
        ).select_related('employee', 'employee__user').order_by('-date')


class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.select_related('employee', 'employee__user').all()
    serializer_class = AttendanceLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(tenant=resolve_tenant(self.request))
        filter_date = self.request.query_params.get('date')
        if filter_date:
            queryset = queryset.filter(date=filter_date)
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset.order_by('-date', '-clock_in_timestamp')
        return queryset.filter(employee__user=user).order_by('-date')

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]


class AttendanceCorrectionRequestViewSet(viewsets.ModelViewSet):
    queryset = AttendanceCorrectionRequest.objects.select_related(
        'attendance_log', 'requested_by', 'reviewer'
    ).all()
    serializer_class = AttendanceCorrectionRequestSerializer

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request), requested_by=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset().filter(tenant=resolve_tenant(self.request))
        user = self.request.user
        if user.role in {'ADMIN', 'HR_MANAGER'}:
            return queryset
        return queryset.filter(requested_by=user)

    def get_permissions(self):
        if self.action in {'update', 'partial_update', 'destroy'}:
            return [IsAdminOrHRManager()]
        return [IsSelfOrAdminOrHR()]
