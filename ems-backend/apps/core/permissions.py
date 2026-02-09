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

