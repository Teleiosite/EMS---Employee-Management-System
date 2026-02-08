from rest_framework.permissions import BasePermission


class IsAdminOrHRManager(BasePermission):
    message = 'This action requires ADMIN or HR_MANAGER role.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) in {'ADMIN', 'HR_MANAGER'}
        )


class IsSelfOrAdminOrHR(BasePermission):
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
