from django.contrib import admin
from .models import JobPosting, Candidate

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'location', 'created_at', 'status')
    list_filter = ('department', 'status', 'location', 'employment_type')
    search_fields = ('title', 'department')
    ordering = ('-created_at',)

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'job', 'status', 'ai_fit_score', 'applied_at')
    list_filter = ('status', 'job')
    search_fields = ('full_name', 'email', 'job__title')
    ordering = ('-applied_at',)
