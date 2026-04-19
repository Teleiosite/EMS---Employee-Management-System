from rest_framework.permissions import BasePermission


class IsAdminOrHRManager(BasePermission):
    """Only ADMIN or HR_MANAGER roles can access"""
    message = 'This action requires ADMIN or HR_MANAGER role.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER'}
        )


class IsEmployee(BasePermission):
    """Only EMPLOYEE role can access (staff members)"""
    message = 'This action is only available to employees.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'EMPLOYEE'
        )


class IsApplicant(BasePermission):
    """Only APPLICANT role can access"""
    message = 'This action is only available to applicants.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'APPLICANT'
        )


class IsStaffMember(BasePermission):
    """ADMIN, HR_MANAGER, or EMPLOYEE - excludes APPLICANT"""
    message = 'This action is only available to staff members.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER', 'EMPLOYEE'}
        )


class IsApplicantOwner(BasePermission):
    """Applicant can only access their own applications/profile"""
    message = 'You can only access your own applications.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        
        # For Candidate model
        if hasattr(obj, 'user') and obj.user:
            return obj.user == user
        
        # For ApplicantProfile model
        if hasattr(obj, 'user'):
            return obj.user == user
        
        return False


class IsSelfOrAdminOrHR(BasePermission):
    """User can access own resource, or ADMIN/HR can access any"""
    message = 'You can only access your own resource.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER'}:
            return True

        owner = getattr(obj, 'user', None)
        if owner is not None:
            return owner == user

        employee = getattr(obj, 'employee', None)
        employee_user = getattr(employee, 'user', None)
        return employee_user == user

class HasBusinessTier(BasePermission):
    """Only tenants on BUSINESS or ENTERPRISE tier can access, unless in trial"""
    message = 'This feature requires a Business or Enterprise subscription.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        tenant = getattr(user, 'tenant', None)
        if not tenant:
            return False
        
        # Superusers and Business/Enterprise tiers always have access
        if user.is_superuser or tenant.subscription_tier in {'BUSINESS', 'ENTERPRISE'}:
            return True
            
        # Starter/Free tiers allow access IF they have trial uses left
        usage = tenant.feature_usage or {}
        # We check the view's specific feature key (to be defined in the view)
        feature_key = getattr(view, 'feature_key', None)
        if feature_key and usage.get(feature_key, 0) < 10:
            return True
            
        return False


class HasEnterpriseTier(BasePermission):
    """Only tenants on ENTERPRISE tier can access, unless in trial"""
    message = 'This feature requires an Enterprise subscription.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        tenant = getattr(user, 'tenant', None)
        if not tenant:
            return False
        
        # Superusers and Enterprise tier always have access
        if user.is_superuser or tenant.subscription_tier == 'ENTERPRISE':
            return True
            
        # Business/Starter tiers allow access IF they have trial uses left
        usage = tenant.feature_usage or {}
        feature_key = getattr(view, 'feature_key', None)
        if feature_key and usage.get(feature_key, 0) < 10:
            return True
            
        return False

