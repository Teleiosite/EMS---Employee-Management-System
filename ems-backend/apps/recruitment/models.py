from django.db import models
from django.conf import settings


class JobPosting(models.Model):
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('DRAFT', 'Draft'),
    )
    
    title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=100, default='Remote')
    employment_type = models.CharField(max_length=50, default='Full-time')
    description = models.TextField()
    responsibilities = models.JSONField(default=list, blank=True)
    required_skills = models.JSONField(default=list, blank=True)
    minimum_experience = models.PositiveIntegerField(default=0)
    education_level = models.CharField(max_length=100, blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.department}"


class Candidate(models.Model):
    STATUS_CHOICES = (
        ('APPLIED', 'Application Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEWING', 'Interview Scheduled'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Not Selected'),
    )
    
    # Link to user account (for applicants who have accounts)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications'
    )
    
    # Basic Information
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    
    # Job Reference
    job = models.ForeignKey(
        JobPosting,
        on_delete=models.SET_NULL,
        null=True,
        related_name='candidates'
    )
    
    # Resume & Parsed Data
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    resume_file_name = models.CharField(max_length=255, blank=True)
    parsed_resume_data = models.JSONField(default=dict, blank=True)
    
    # AI Analysis (Hidden from Applicants)
    ai_fit_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="AI-calculated fit score (0-100)"
    )
    ai_analysis = models.JSONField(
        default=dict,
        blank=True,
        help_text="Detailed AI analysis results"
    )
    ai_skill_match = models.JSONField(
        default=list,
        blank=True,
        help_text="Skills matched against job requirements"
    )
    
    # Application Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='APPLIED',
        db_index=True
    )
    status_message = models.TextField(
        blank=True,
        help_text="Neutral message shown to applicant"
    )
    
    # HR Notes (Hidden from Applicants)
    hr_notes = models.TextField(blank=True)
    
    # Interview Details
    interview_scheduled_at = models.DateTimeField(null=True, blank=True)
    interview_location = models.CharField(max_length=255, blank=True)
    interview_notes = models.TextField(blank=True)
    
    # Timestamps
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['status', 'applied_at']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        job_title = self.job.title if self.job else "Unknown Position"
        return f"{self.full_name} - {job_title}"
    
    def get_applicant_status_message(self):
        """Returns a neutral, applicant-friendly status message"""
        messages = {
            'APPLIED': "Your application has been received and is waiting for review.",
            'UNDER_REVIEW': "Your application is currently being reviewed by our team.",
            'SHORTLISTED': "Great news! You've been shortlisted for the next stage.",
            'INTERVIEWING': "We'd like to meet you! Check your email for interview details.",
            'HIRED': "Congratulations! We're excited to have you join our team.",
            'REJECTED': "Thank you for your interest. We've decided to move forward with other candidates.",
        }
        return self.status_message or messages.get(self.status, "Application status updated.")


class ApplicantProfile(models.Model):
    """Extended profile for job applicants"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applicant_profile'
    )
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Professional Information
    headline = models.CharField(max_length=200, blank=True, help_text="e.g., 'Senior Software Engineer'")
    bio = models.TextField(blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    
    # Resume (Master copy reusable across applications)
    current_resume = models.FileField(upload_to='applicant_resumes/', blank=True, null=True)
    resume_parsed_data = models.JSONField(default=dict, blank=True)
    resume_uploaded_at = models.DateTimeField(null=True, blank=True)
    
    # Skills & Education (Editable by applicant)
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    
    # Profile Completeness
    profile_completed = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile: {self.user.email}"
    
    def calculate_completeness(self):
        """Calculate profile completeness percentage"""
        fields = [
            bool(self.phone),
            bool(self.headline),
            bool(self.bio),
            bool(self.current_resume),
            len(self.skills) > 0,
            len(self.education) > 0,
            len(self.experience) > 0,
        ]
        return int(sum(fields) / len(fields) * 100)
