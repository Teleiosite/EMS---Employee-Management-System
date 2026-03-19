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
    """Attach tenant on request from subdomain/user context and enforce isolation checks."""

    def __init__(self, get_response):
        self.get_response = get_response

    def _tenant_from_host(self, request):
        if not getattr(settings, 'TENANT_SUBDOMAIN_ENABLED', True):
            return None

        base_domain = (getattr(settings, 'TENANT_BASE_DOMAIN', '') or '').strip().lower()
        if not base_domain:
            return None

        host = request.get_host().split(':')[0].strip().lower()
        suffix = f'.{base_domain}'

        if not host.endswith(suffix):
            return None

        subdomain = host[:-len(suffix)].strip('.')
        if not subdomain:
            return None

        slug = subdomain.split('.')[0]
        reserved = set(getattr(settings, 'TENANT_RESERVED_SUBDOMAINS', []))
        if slug in reserved:
            return None

        from apps.core.models import Tenant
        return Tenant.objects.filter(slug=slug, is_active=True).first()

    def _tenant_from_query(self, request):
        slug = request.GET.get('tenant') if hasattr(request, 'GET') else None
        if not slug:
            return None

        from apps.core.models import Tenant
        return Tenant.objects.filter(slug=slug, is_active=True).first()

    def __call__(self, request):
        tenant = self._tenant_from_host(request) or self._tenant_from_query(request)

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            user_tenant = getattr(user, 'tenant', None)

            # If both tenant sources exist, they must match for non-superusers.
            if tenant and user_tenant and not user.is_superuser and tenant.id != user_tenant.id:
                return JsonResponse({'detail': 'Tenant mismatch for current user.'}, status=403)

            if not tenant:
                tenant = user_tenant

            if not user.is_superuser and not tenant:
                return JsonResponse({'detail': 'No tenant context found for current user.'}, status=403)

        request.tenant = tenant
        return self.get_response(request)
