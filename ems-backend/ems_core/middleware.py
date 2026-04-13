from django.conf import settings
from django.http import JsonResponse


class IPWhitelistMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, 'IP_WHITELIST_ENABLED', False):
            return self.get_response(request)

        # SECURITY: Use REMOTE_ADDR only — this is set by Nginx after stripping
        # any client-supplied X-Forwarded-For values.  Trusting X-Forwarded-For
        # directly is spoofable by the client.
        ip = request.META.get('REMOTE_ADDR', '')

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
            
            # If tenant is suspended, block all non-superuser access
            if tenant and not tenant.is_active and not user.is_superuser:
                return JsonResponse({
                    'detail': 'Your organization account has been suspended. Please contact the platform administrator.',
                    'code': 'tenant_suspended'
                }, status=403)
            
            # Safety: If user is not a superuser but has no tenant, 
            # we should NOT let them fall into the global bucket unintentionally.
            if not user.is_superuser and not tenant:
                # We could log this as an invalid state
                pass
                
        request.tenant = tenant
        return self.get_response(request)
