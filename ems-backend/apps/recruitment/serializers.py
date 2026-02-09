from rest_framework import serializers
from .models import Candidate, JobPosting, ApplicantProfile


class JobPostingSerializer(serializers.ModelSerializer):
    """Full job posting details for Admin/HR"""
    class Meta:
        model = JobPosting
        fields = '__all__'


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
        
        # Get phone from profile if exists
        if hasattr(user, 'applicant_profile') and user.applicant_profile:
            validated_data['phone'] = user.applicant_profile.phone
            # Copy resume file if not provided
            if not validated_data.get('resume') and user.applicant_profile.current_resume:
                validated_data['resume'] = user.applicant_profile.current_resume
                validated_data['resume_file_name'] = user.applicant_profile.current_resume.name
        
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
            'id', 'email', 'first_name', 'last_name',
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
