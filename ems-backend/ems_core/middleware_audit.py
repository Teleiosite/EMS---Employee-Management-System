import json
import logging
from django.utils.deprecation import MiddlewareMixin
from apps.core.models import AuditLog
from apps.core.tenancy import resolve_tenant

logger = logging.getLogger(__name__)

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log all data mutations (POST, PUT, PATCH, DELETE).
    Captured metadata includes the user, tenant, resource URL, and IP address.
    """
    def process_response(self, request, response):
        # We only log data-modifying requests that were successful (2xx)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and 200 <= response.status_code < 300:
            user = getattr(request, 'user', None)
            if not user or not user.is_authenticated:
                return response

            tenant = resolve_tenant(request)
            
            # Identify the resource and its ID from the URL path
            path_parts = request.path.strip('/').split('/')
            resource = path_parts[-2] if len(path_parts) >= 2 else request.path

            # Extract resource_id — supports numeric IDs and UUIDs
            last_part = path_parts[-1] if path_parts else ''
            resource_id = last_part if (last_part and last_part not in ['/', '']) else 'bulk'

            # Capture action type
            action_map = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE'
            }
            action = action_map.get(request.method, 'UPDATE')

            # Get IP and UA securely (prevent X-Forwarded-For spoofing)
            ip_address = request.META.get('REMOTE_ADDR', '')
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Calculate changes - for now, just store the request body or meaningful payload
            # In a more advanced version, we'd use signals to diff models.
            try:
                if request.method != 'DELETE':
                    raw_data = json.loads(request.body) if request.body else {}
                    sensitive_fields = ['password', 'token', 'access_token', 'refresh_token', 'mfa_code', 'backup_codes']
                    changes = {k: v for k, v in raw_data.items() if k not in sensitive_fields}
                else:
                    changes = {"info": "Resource Deleted"}
            except Exception:
                changes = {"info": "Unable to parse request body"}

            try:
                AuditLog.objects.create(
                    tenant=tenant,
                    user=user,
                    action=action,
                    resource=resource.capitalize(),
                    resource_id=resource_id,
                    changes=changes,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.error(f"AuditLog write failed for {request.method} {request.path}: {e}")

        return response
