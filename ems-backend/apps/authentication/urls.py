from django.urls import path
from .views import (
    EmailVerificationConfirmView,
    EmailVerificationRequestView,
    LoginView,
    LogoutView,
    MFASetupView,
    MFAVerifyView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    RegisterView,
    TenantRegistrationView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('tenant-register/', TenantRegistrationView.as_view(), name='tenant-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshView.as_view(), name='refresh'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('email-verification/request/', EmailVerificationRequestView.as_view(), name='email-verification-request'),
    path('email-verification/confirm/', EmailVerificationConfirmView.as_view(), name='email-verification-confirm'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
]
