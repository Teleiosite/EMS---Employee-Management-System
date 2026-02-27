from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from apps.recruitment.models import JobPosting, Candidate, ApplicantProfile

User = get_user_model()

class ResumeParsingTests(APITestCase):
    def setUp(self):
        # Create applicant user
        self.applicant_user = User.objects.create_user(
            email='applicant@example.com',
            password='password123',
            role='APPLICANT'
        )
        self.client.force_authenticate(user=self.applicant_user)
        
        # Create Job
        self.job = JobPosting.objects.create(
            title='Software Engineer',
            department='Engineering',
            required_skills=['Python', 'React'],
            minimum_experience=2
        )
        self.apply_url = reverse('applicant-apply')

    def test_resume_parsing_on_apply(self):
        """Applying with resume triggers parsing and AI analysis"""
        # Create a dummy PDF file
        resume_content = b'Dummy resume content'
        resume_file = SimpleUploadedFile("dev_resume.pdf", resume_content, content_type="application/pdf")
        
        data = {
            'job': self.job.id,
            'resume': resume_file
        }
        
        response = self.client.post(self.apply_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        candidate = Candidate.objects.get(user=self.applicant_user, job=self.job)
        self.assertTrue(candidate.parsed_resume_data)
        self.assertIn('skills', candidate.parsed_resume_data)
        self.assertTrue(candidate.ai_fit_score is not None)
        self.assertTrue(candidate.ai_analysis)

    def test_profile_resume_parsing(self):
        """Updating profile resume triggers parsing"""
        url = reverse('applicant-resume-upload')
        resume_file = SimpleUploadedFile("marketing_resume.pdf", b'Content', content_type="application/pdf")
        
        response = self.client.put(url, {'current_resume': resume_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        profile = ApplicantProfile.objects.get(user=self.applicant_user)
        self.assertTrue(profile.resume_parsed_data)
        # Check if skills were extracted from the "marketing" file name trigger in mock
        skills = profile.resume_parsed_data.get('skills', [])
        # In mock utils, 'marketing' triggers specific skills
        self.assertTrue(len(skills) > 0)
