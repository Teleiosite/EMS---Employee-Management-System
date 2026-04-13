from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import (
    EmailTokenObtainPairSerializer,
    EmailVerificationSerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    TenantRegistrationSerializer,
)
from .utils import generate_mfa_secret, generate_secure_token, verify_totp_code
from django.contrib.auth import get_user_model

User = get_user_model()

# Imported for Host Command Center impersonation
from apps.core.views import IsSuperUser
from apps.core.models import Tenant
from ems_core.utils_email import send_email_in_background


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


def _set_auth_cookies(response, access_token: str, refresh_token: str = None):
    """Attach JWT tokens as httpOnly cookies to a response."""
    secure = getattr(settings, 'JWT_COOKIE_SECURE', True)
    samesite = getattr(settings, 'JWT_COOKIE_SAMESITE', 'Lax')
    access_max_age = getattr(settings, 'JWT_ACCESS_COOKIE_MAX_AGE', 60 * 30)       # 30 min
    refresh_max_age = getattr(settings, 'JWT_REFRESH_COOKIE_MAX_AGE', 60 * 60 * 24 * 7)  # 7 days

    response.set_cookie(
        key=getattr(settings, 'JWT_COOKIE_NAME', 'access_token'),
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/',
    )
    if refresh_token:
        response.set_cookie(
            key=getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token'),
            value=refresh_token,
            max_age=refresh_max_age,
            httponly=True,
            secure=secure,
            samesite=samesite,
            path='/api/auth/refresh/',  # scope refresh cookie to refresh endpoint only
        )


def _clear_auth_cookies(response):
    """Delete JWT cookies from the client."""
    response.delete_cookie(
        key=getattr(settings, 'JWT_COOKIE_NAME', 'access_token'),
        path='/',
    )
    response.delete_cookie(
        key=getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token'),
        path='/api/auth/refresh/',
    )


from rest_framework.throttling import ScopedRateThrottle

class LoginView(TokenObtainPairView):
    """Authenticate user and return JWT tokens as httpOnly cookies."""
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'auth'
    throttle_classes = TokenObtainPairView.throttle_classes + [ScopedRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            raise

        data = serializer.validated_data
        access = data.get('access', '')
        refresh = data.get('refresh', '')
        user_data = data.get('user', {})

        # Return ONLY user metadata — no tokens in the body
        response = Response({'user': user_data}, status=status.HTTP_200_OK)
        _set_auth_cookies(response, access_token=access, refresh_token=refresh)
        return response


class RefreshView(TokenRefreshView):
    """Issue a new access token from the refresh cookie."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_cookie_name = getattr(settings, 'JWT_REFRESH_COOKIE_NAME', 'refresh_token')
        refresh_token = request.COOKIES.get(refresh_cookie_name)

        if not refresh_token:
            return Response(
                {'detail': 'Refresh token cookie not found.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Inject the cookie value into request.data for the parent serializer
        request.data._mutable = True if hasattr(request.data, '_mutable') else None
        try:
            request.data['refresh'] = refresh_token
        except AttributeError:
            request.data = {'refresh': refresh_token}

        try:
            response = super().post(request, *args, **kwargs)
        except (TokenError, InvalidToken) as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        if response.status_code == 200:
            new_access = response.data.get('access', '')
            # Strip tokens from the body
            response.data = {'detail': 'Token refreshed.'}
            _set_auth_cookies(response, access_token=new_access)

        return response


class LogoutView(APIView):
    """Clear JWT cookies and invalidate the session."""
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        _clear_auth_cookies(response)
        return response


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email=serializer.validated_data['email']).first()
        if user:
            token = generate_secure_token()
            user.password_reset_token = token
            user.password_reset_expires = timezone.now() + timedelta(hours=1)
            user.save(update_fields=['password_reset_token', 'password_reset_expires'])
            
            origin = request.headers.get('origin', 'http://localhost:3000')
            reset_link = f"{origin}/#/reset-password?token={token}"
            
            send_email_in_background(
                subject='Password Reset Request - HireWix',
                message=f"Hello {user.first_name},\n\nYou requested a password reset. Click the safe link below to set a new password:\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nBest,\nThe HireWix Team",
                recipient_list=[user.email]
            )
        return Response({'detail': 'If the account exists, reset instructions were generated and emailed.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(password_reset_token=serializer.validated_data['token']).first()
        if not user or not user.password_reset_expires or user.password_reset_expires < timezone.now():
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['password'])
        user.password_reset_token = None
        user.password_reset_expires = None
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=['password', 'password_reset_token', 'password_reset_expires', 'failed_login_attempts', 'locked_until'])
        return Response({'detail': 'Password reset successful.'})


class EmailVerificationRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        token = generate_secure_token()
        user.email_verification_token = token
        user.save(update_fields=['email_verification_token'])
        
        origin = request.headers.get('origin', 'http://localhost:3000')
        validation_link = f"{origin}/#/verify-email?token={token}"
        
        send_email_in_background(
            subject='Verify Your Email - HireWix Portal',
            message=f"Hello {user.first_name},\n\nPlease verify your email address by clicking the link below:\n{validation_link}\n\nBest,\nThe HireWix Team",
            recipient_list=[user.email]
        )
        return Response({'detail': 'A verification link has been sent to your email address.'})


class EmailVerificationConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email_verification_token=serializer.validated_data['token']).first()
        if not user:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
        user.email_verified = True
        user.email_verification_token = None
        user.save(update_fields=['email_verified', 'email_verification_token'])
        return Response({'detail': 'Email verified successfully.'})


class MFASetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MFASetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'detail': 'Invalid password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.mfa_secret = generate_mfa_secret()
        user.save(update_fields=['mfa_secret'])
        return Response({'detail': 'MFA secret generated.', 'secret': user.mfa_secret})


class MFAVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not verify_totp_code(user.mfa_secret, serializer.validated_data['code']):
            return Response({'detail': 'Invalid MFA code.'}, status=status.HTTP_400_BAD_REQUEST)
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])
        return Response({'detail': 'MFA enabled successfully.'})



class TenantRegistrationView(generics.CreateAPIView):
    serializer_class = TenantRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # SECURITY: Honeypot trap to catch automated bots silently.
        # Real humans will not see this field. Bots will blindly fill it out.
        honeypot = request.data.get('company_website_url', '').strip()
        if honeypot:
            # Fake out the bot by returning a 201 Created instantly doing nothing
            return Response(
                {'detail': 'Registration successful. Check your email.'},
                status=status.HTTP_201_CREATED,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = serializer.save()

        return Response({
            'tenant_id': created['tenant'].id,
            'tenant_name': created['tenant'].name,
            'tenant_slug': created['tenant'].slug,
            'admin_user_id': created['user'].id,
            'admin_email': created['user'].email,
        }, status=status.HTTP_201_CREATED)



class ImpersonateTenantView(APIView):
    """
    Allows a SuperUser to impersonate the HR_MANAGER of a specific tenant.
    Mints new JWT cookies for the target HR user.
    """
    permission_classes = [IsSuperUser]

    def post(self, request):
        tenant_id = request.data.get('tenant_id')
        if not tenant_id:
            return Response({'detail': 'tenant_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Find the primary target for this tenant (ADMIN or HR_MANAGER)
        target_user = User.objects.filter(tenant=tenant, role='ADMIN', is_active=True).first()
        if not target_user:
            target_user = User.objects.filter(tenant=tenant, role='HR_MANAGER', is_active=True).first()
        
        if not target_user:
            return Response({'detail': 'No active Administrator or HR Manager found for this tenant.'}, status=status.HTTP_404_NOT_FOUND)

        # Generate tokens for the target user
        refresh = RefreshToken.for_user(target_user)
        
        # Prepare response with user metadata
        from .serializers import RegisterSerializer # Using simple metadata mapping
        user_metadata = {
            'id': str(target_user.id),
            'email': target_user.email,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'role': target_user.role,
        }
        
        response = Response({
            'user': user_metadata,
            'impersonating': True,
            'target_tenant': tenant.name
        }, status=status.HTTP_200_OK)

        # SECURITY: Set httpOnly cookies for the impersonated user
        _set_auth_cookies(response, access_token=str(refresh.access_token), refresh_token=str(refresh))
        
        return response

