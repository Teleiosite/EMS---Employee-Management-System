from django.conf import settings
from django.http import JsonResponse


class IPWhitelistMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, 'IP_WHITELIST_ENABLED', False):
            return self.get_response(request)

        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        ip = ip.split(',')[0].strip()
        if ip not in settings.IP_WHITELIST:
            return JsonResponse({'detail': 'IP address not allowed.'}, status=403)
        return self.get_response(request)


class TenantContextMiddleware:
    """Attach tenant on request for authenticated users."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant = None
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            tenant = getattr(user, 'tenant', None)
        request.tenant = tenant
        return self.get_response(request)
