from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    EmailTokenObtainPairSerializer,
    EmailVerificationSerializer,
    MFASetupSerializer,
    MFAVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)
from .utils import generate_mfa_secret, generate_secure_token, verify_totp_code
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email=serializer.validated_data['email']).first()
        if user:
            user.password_reset_token = generate_secure_token()
            user.password_reset_expires = timezone.now() + timedelta(hours=1)
            user.save(update_fields=['password_reset_token', 'password_reset_expires'])
        return Response({'detail': 'If the account exists, reset instructions were generated.'})


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
        user.email_verification_token = generate_secure_token()
        user.save(update_fields=['email_verification_token'])
        return Response({'detail': 'Verification token generated.', 'token': user.email_verification_token})


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
