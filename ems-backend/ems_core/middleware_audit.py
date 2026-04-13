import json
from django.utils.deprecation import MiddlewareMixin
from apps.core.models import AuditLog
from apps.core.tenancy import resolve_tenant

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
            
            # Identify the resource from the URL
            path_parts = request.path.strip('/').split('/')
            resource = path_parts[-2] if len(path_parts) >= 2 else request.path

            # Attempt to extract ID if it's a detail view
            resource_id = path_parts[-1] if len(path_parts) > 0 and path_parts[-1].isnumeric() else "New"

            # Capture action type
            action_map = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE'
            }
            action = action_map.get(request.method, 'UPDATE')

            # Get IP and UA
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Calculate changes - for now, just store the request body or meaningful payload
            # In a more advanced version, we'd use signals to diff models.
            try:
                if request.method != 'DELETE':
                    # Filter out sensitive fields
                    raw_data = json.loads(request.body) if request.body else {}
                    sensitive_fields = ['password', 'token', 'access_token', 'refresh_token']
                    changes = {k: v for k, v in raw_data.items() if k not in sensitive_fields}
                else:
                    changes = {"info": "Resource Deleted"}
            except:
                changes = {"info": "Unable to parse request body"}

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

        return response
