from rest_framework.permissions import BasePermission


class IsNoamHomeAdmin(BasePermission):
    """Allow Django staff and NoamHome back-office roles."""

    allowed_roles = {'moderator', 'superadmin'}

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.role in self.allowed_roles)
        )
