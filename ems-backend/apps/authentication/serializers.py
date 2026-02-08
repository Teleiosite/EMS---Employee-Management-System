from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .utils import generate_mfa_secret, generate_secure_token, verify_totp_code

User = get_user_model()
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'email_verified', 'mfa_enabled')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name', 'role')

    def validate_role(self, value):
        request = self.context.get('request')
        if value != 'APPLICANT':
            if not request or not request.user.is_authenticated or request.user.role not in {'ADMIN', 'HR_MANAGER'}:
                raise serializers.ValidationError('Only ADMIN/HR can create non-applicant users.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        token = generate_secure_token()
        user = User.objects.create_user(
            password=password,
            is_active=True,
            email_verification_token=token,
            email_verified=False,
            **validated_data,
        )
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        return token

    def validate(self, attrs):
        request = self.context.get('request')
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0') if request else '0.0.0.0'
        agent = request.META.get('HTTP_USER_AGENT', '') if request else ''

        email = attrs.get(self.username_field)
        password = attrs.get('password')
        user = User.objects.filter(email=email).first()

        if user and user.locked_until and user.locked_until > timezone.now():
            from .models import LoginAttempt
            LoginAttempt.objects.create(user=user, email=email, ip_address=ip, user_agent=agent, status='LOCKED')
            raise serializers.ValidationError('Account is temporarily locked due to repeated failed logins.')

        auth_user = authenticate(request=request, email=email, password=password)
        if not auth_user:
            from .models import LoginAttempt
            LoginAttempt.objects.create(user=user, email=email, ip_address=ip, user_agent=agent, status='FAILED')
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                    user.locked_until = timezone.now() + timedelta(minutes=LOCKOUT_MINUTES)
                user.save(update_fields=['failed_login_attempts', 'locked_until'])
            raise serializers.ValidationError('Invalid credentials.')

        if auth_user.mfa_enabled:
            code = self.initial_data.get('mfa_code')
            if not code or not verify_totp_code(auth_user.mfa_secret, code):
                from .models import LoginAttempt
                LoginAttempt.objects.create(user=auth_user, email=email, ip_address=ip, user_agent=agent, status='MFA_PENDING')
                raise serializers.ValidationError('MFA code is required or invalid.')

        attrs[self.username_field] = email
        data = super().validate(attrs)
        auth_user.failed_login_attempts = 0
        auth_user.locked_until = None
        auth_user.last_login_ip = ip
        auth_user.save(update_fields=['failed_login_attempts', 'locked_until', 'last_login_ip', 'last_login'])

        from .models import LoginAttempt
        LoginAttempt.objects.create(user=auth_user, email=email, ip_address=ip, user_agent=agent, status='SUCCESS')

        if not self.user.is_active:
            raise serializers.ValidationError('Account is inactive.')

        data['user'] = UserSerializer(self.user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)

    def validate_password(self, value):
        validate_password(value)
        return value


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class MFASetupSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)


class MFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=6)
