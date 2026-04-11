"""
Cookie-based JWT Authentication
---------------------------------
Reads the JWT access token from an httpOnly cookie named 'access_token'
instead of the Authorization header.  All other JWT validation logic
(signature, expiry, user lookup) is inherited from djangorestframework-simplejwt.
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticates requests by reading the JWT from the 'access_token'
    httpOnly cookie.  Falls back to the Authorization header so that
    the Django Admin and API browsable UI still work with Bearer tokens.
    """

    def authenticate(self, request):
        cookie_name = getattr(settings, 'JWT_COOKIE_NAME', 'access_token')

        # 1. Try cookie first
        raw_token = request.COOKIES.get(cookie_name)

        # 2. Fall back to Authorization header (keeps Django Admin / Swagger working)
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            return None

        return self.get_user(validated_token), validated_token
