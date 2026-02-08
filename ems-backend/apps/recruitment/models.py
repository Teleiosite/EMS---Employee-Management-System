from django.db import models


class JobPosting(models.Model):
    title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    description = models.TextField()
    is_active = models.BooleanField(default=True)


class Candidate(models.Model):
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    job = models.ForeignKey(JobPosting, on_delete=models.SET_NULL, null=True, related_name='candidates')
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
