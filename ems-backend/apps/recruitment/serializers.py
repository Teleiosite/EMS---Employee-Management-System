from rest_framework import serializers
from .models import Candidate, JobPosting, ApplicantProfile, AISettings


class JobPostingSerializer(serializers.ModelSerializer):
    """Full job posting details for Admin/HR"""
    class Meta:
        model = JobPosting
        fields = '__all__'
        read_only_fields = ('tenant',)

    def create(self, validated_data):
        job = super().create(validated_data)
        
        # Dispatch background emails to all active employees if job is OPEN
        if job.status == 'OPEN':
            from django.contrib.auth import get_user_model
            from ems_core.utils_email import send_email_in_background
            
            User = get_user_model()
            employee_emails = list(User.objects.filter(is_active=True, role='EMPLOYEE').values_list('email', flat=True))
            
            if employee_emails:
                formatted_dept = job.department.name if job.department else 'General'
                subject = f"Internal Job Opening: {job.title} ({formatted_dept})"
                message = f"Hello Team,\n\nWe are excited to announce a new internal job opening!\n\nRole: {job.title}\nDepartment: {formatted_dept}\nLocation: {job.location}\nType: {job.employment_type}\n\nDescription:\n{job.description}\n\nLog in to the EMS Dashboard to apply or refer a candidate.\n\nBest,\nHR Management"
                
                send_email_in_background(
                    subject=subject,
                    message=message,
                    recipient_list=employee_emails
                )
        return job


class AISettingsSerializer(serializers.ModelSerializer):
    """Settings for AI Resume Parsing"""
    class Meta:
        model = AISettings
        fields = ['gemini_api_key', 'is_active', 'prompt_template']
        extra_kwargs = {
            'gemini_api_key': {'write_only': True} # Don't expose key on GET
        }


class JobPostingPublicSerializer(serializers.ModelSerializer):
    """Public job posting for applicants - limited fields"""
    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'department', 'location', 'employment_type',
            'description', 'responsibilities', 'required_skills',
            'minimum_experience', 'education_level', 'status', 'created_at'
        ]
        read_only_fields = fields


class CandidateSerializer(serializers.ModelSerializer):
    """Full candidate details for Admin/HR - includes AI analysis"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_department = serializers.CharField(source='job.department', read_only=True)
    
    class Meta:
        model = Candidate
        fields = '__all__'
        read_only_fields = ('tenant',)


class CandidateListSerializer(serializers.ModelSerializer):
    """Simplified candidate list for Admin/HR"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'full_name', 'email', 'phone', 'job_title',
            'ai_fit_score', 'status', 'applied_at'
        ]


class ApplicantCandidateSerializer(serializers.ModelSerializer):
    """Candidate view for applicants - NO AI scores or analysis"""
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_department = serializers.CharField(source='job.department', read_only=True)
    status_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = [
            'id', 'job', 'job_title', 'job_department',
            'status', 'status_message', 'applied_at',
            'interview_scheduled_at', 'interview_location'
        ]
        read_only_fields = fields
    
    def get_status_message(self, obj):
        return obj.get_applicant_status_message()


class ApplicantApplicationSerializer(serializers.ModelSerializer):
    """For applicants to submit applications"""
    class Meta:
        model = Candidate
        fields = ['job', 'resume']
    
    def create(self, validated_data):
        user = self.context['request'].user
        job = validated_data.get('job')
        
        # Set applicant info from user account
        validated_data['user'] = user
        validated_data['full_name'] = f"{user.first_name} {user.last_name}".strip() or user.email
        validated_data['email'] = user.email
        validated_data['status'] = 'APPLIED'
        validated_data['tenant'] = getattr(user, 'tenant', None)
        
        # Get phone from profile if exists
        if hasattr(user, 'applicant_profile') and user.applicant_profile:
            validated_data['phone'] = user.applicant_profile.phone
            # Copy resume file if not provided
            if not validated_data.get('resume') and user.applicant_profile.current_resume:
                validated_data['resume'] = user.applicant_profile.current_resume
                validated_data['resume_file_name'] = user.applicant_profile.current_resume.name
        
        return super().create(validated_data)


class PublicCandidateApplicationSerializer(serializers.ModelSerializer):
    """For public, unauthenticated applicants to submit applications"""
    class Meta:
        model = Candidate
        fields = ['job', 'full_name', 'email', 'phone', 'resume']
        
    def create(self, validated_data):
        validated_data['status'] = 'APPLIED'
        validated_data['tenant'] = getattr(validated_data['job'], 'tenant', None)
        return super().create(validated_data)


class ApplicantProfileSerializer(serializers.ModelSerializer):
    """Applicant's own profile - editable"""
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    profile_completeness = serializers.SerializerMethodField()
    
    class Meta:
        model = ApplicantProfile
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'phone', 'address', 'city', 'country',
            'headline', 'bio', 'years_of_experience',
            'current_resume', 'resume_parsed_data', 'resume_uploaded_at',
            'skills', 'education', 'experience',
            'profile_completed', 'profile_completeness',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant', 'email', 'first_name', 'last_name',
            'resume_parsed_data', 'resume_uploaded_at',
            'profile_completed', 'profile_completeness',
            'created_at', 'updated_at'
        ]
    
    def get_profile_completeness(self, obj):
        return obj.calculate_completeness()


class CandidateStatusUpdateSerializer(serializers.ModelSerializer):
    """For HR to update candidate status"""
    class Meta:
        model = Candidate
        fields = [
            'status', 'status_message', 'hr_notes',
            'interview_scheduled_at', 'interview_location', 'interview_notes'
        ]

    def update(self, instance, validated_data):
        previous_status = instance.status
        updated_instance = super().update(instance, validated_data)
        
        # Dispatch background email to candidate when status changes
        if previous_status != updated_instance.status:
            from ems_core.utils_email import send_email_in_background
            
            job_title = updated_instance.job.title if updated_instance.job else 'a position'
            subject = f"Application Update: {job_title}"
            
            message = f"Hello {updated_instance.full_name},\n\nYour application status for the '{job_title}' position has been updated to: **{updated_instance.status}**.\n\n"
            
            if updated_instance.status == 'INTERVIEWING' and updated_instance.interview_scheduled_at:
                message += f"Interview Scheduled: {updated_instance.interview_scheduled_at.strftime('%Y-%m-%d %H:%M')}\n"
                if updated_instance.interview_location:
                    message += f"Location/Link: {updated_instance.interview_location}\n"
                if updated_instance.interview_notes:
                    message += f"\nNote from HR:\n{updated_instance.interview_notes}\n"
            
            if updated_instance.status_message:
                message += f"\nMessage:\n{updated_instance.status_message}\n"
                
            message += "\nThank you for your interest in joining our team!\n\nBest,\nTalent Acquisition Team"
            
            if updated_instance.email:
                send_email_in_background(
                    subject=subject,
                    message=message,
                    recipient_list=[updated_instance.email]
                )
                
        return updated_instance
