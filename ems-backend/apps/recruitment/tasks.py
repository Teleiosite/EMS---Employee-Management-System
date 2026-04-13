from celery import shared_task
import logging
from .models import Candidate, ApplicantProfile, JobPosting
from .utils import parse_resume, analyze_candidate

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_resume_parsing_task(self, candidate_id=None, profile_id=None, job_id=None):
    """
    Background task to parse a resume and update the candidate or profile.
    """
    try:
        if candidate_id:
            candidate = Candidate.objects.get(id=candidate_id)
            if not candidate.resume:
                return "No resume file found for candidate"
            
            # 1. Parse Resume
            parsed_data = parse_resume(candidate.resume, tenant=candidate.tenant)
            candidate.parsed_resume_data = parsed_data
            
            # 2. Analyze against Job
            if candidate.job:
                analysis_results = analyze_candidate(candidate, candidate.job)
                candidate.ai_fit_score = analysis_results['ai_fit_score']
                candidate.ai_analysis = analysis_results['ai_analysis']
                candidate.ai_skill_match = analysis_results['ai_skill_match']
            
            candidate.save()
            return f"Processed candidate {candidate_id} resume"

        elif profile_id:
            profile = ApplicantProfile.objects.get(id=profile_id)
            if not profile.current_resume:
                return "No resume file found for profile"
                
            # Parse Resume
            parsed_data = parse_resume(profile.current_resume, tenant=profile.tenant)
            profile.resume_parsed_data = parsed_data
            
            # Update Profile fields
            profile.skills = parsed_data.get('skills', [])
            profile.education = parsed_data.get('education', [])
            profile.experience = parsed_data.get('experience', [])
            profile.years_of_experience = parsed_data.get('experience_years', 0)
            profile.headline = parsed_data.get('headline', '')
            profile.save()
            
            return f"Processed profile {profile_id} resume"

    except Exception as exc:
        logger.error(f"Resume processing failed: {exc}")
        if hasattr(self, 'retry'):
            raise self.retry(exc=exc)
        raise
