from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.core.models import Tenant
from .utils import generate_mfa_secret, generate_secure_token, verify_totp_code

User = get_user_model()
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'tenant', 'is_active', 'email_verified', 'mfa_enabled')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role')

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
        request = self.context.get('request')
        tenant = request.user.tenant if request and request.user.is_authenticated else None
        user = User.objects.create_user(
            password=password,
            tenant=tenant,
            is_active=True,
            email_verification_token=token,
            email_verified=False,
            **validated_data,
        )

        # Trigger Welcome Email immediately after user creation
        from django.core.mail import send_mail
        from django.conf import settings
        
        if user.role == 'APPLICANT':
            subject = 'Welcome to the Careers Portal!'
            message = f"Hello {user.first_name},\n\nThank you for creating an account on our Careers Portal! You can now browse open roles and submit your applications seamlessly.\n\nYour login email is: {user.email}\nYour temporary password is: {password}\n\nPlease log in and complete your Applicant Profile to stand out.\n\nBest,\nTalent Acquisition Team"
        else:
            subject = 'Welcome to the EMS Portal!'
            message = f"Hello {user.first_name},\n\nWelcome to the Employee Management System! Your account has been successfully created by Human Resources.\n\nYour login email is: {user.email}\nYour temporary password is: {password}\n\nPlease log in and update your password as soon as possible.\n\nBest,\nHR Team"
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,  # Don't crash user creation if email fails
            )
        except Exception as e:
            # In a real app, log this error
            pass

        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['tenant_id'] = str(user.tenant_id) if user.tenant_id else None
        token['tenant_name'] = user.tenant.name if user.tenant_id else None
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

        if self.user.tenant and not self.user.tenant.is_active:
            raise serializers.ValidationError('Your company account is currently suspended.')

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


class TenantRegistrationSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=255)
    company_slug = serializers.SlugField(max_length=100)
    admin_email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_company_slug(self, value):
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Company slug is already taken.')
        return value

    def validate_admin_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        tenant = Tenant.objects.create(
            name=validated_data['company_name'],
            slug=validated_data['company_slug'],
            is_active=True,
        )
        user = User.objects.create_user(
            email=validated_data['admin_email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data.get('last_name', ''),
            role='ADMIN',
            is_staff=True,
            is_active=True,
            email_verified=True,
            tenant=tenant,
        )
        return {'tenant': tenant, 'user': user}
