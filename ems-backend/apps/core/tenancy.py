from typing import Optional


def resolve_tenant(request) -> Optional[object]:
    """Resolve tenant from request context, falling back to authenticated user's tenant."""
    tenant = getattr(request, 'tenant', None)
    if tenant is not None:
        return tenant

    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        return getattr(user, 'tenant', None)

    return None

