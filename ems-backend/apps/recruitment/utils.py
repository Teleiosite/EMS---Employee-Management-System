import random
import time
from decimal import Decimal

def parse_resume(file):
    """
    Simulates parsing a resume file (PDF/DOCX) to extract structured data.
    In a real implementation, this would use a service like Textract, PyPDF2, or an AI API.
    """
    # Simulate processing delay
    time.sleep(1)
    
    filename = file.name.lower()
    
    # Mock extraction based on filename or random data
    is_developer = 'dev' in filename or 'tech' in filename
    is_marketing = 'market' in filename
    is_design = 'design' in filename
    
    if is_developer:
        skills = ['Python', 'Django', 'React', 'JavaScript', 'Docker', 'AWS']
        experience_years = random.randint(2, 8)
        headline = "Software Engineer"
    elif is_marketing:
        skills = ['SEO', 'Content Marketing', 'Google Analytics', 'Copywriting']
        experience_years = random.randint(1, 6)
        headline = "Marketing Specialist"
    elif is_design:
        skills = ['Figma', 'Adobe XD', 'UI/UX', 'Prototyping']
        experience_years = random.randint(3, 7)
        headline = "Product Designer"
    else:
        skills = ['Communication', 'Management', 'Microsoft Office']
        experience_years = random.randint(0, 5)
        headline = "Professional"

    return {
        'name': 'Parsed Candidate Name', # Ideally extracted from file
        'email': 'parsed@example.com',
        'phone': '+1-555-0123',
        'skills': skills,
        'experience_years': experience_years,
        'headline': headline,
        'education': [
            {'degree': 'Bachelor of Science', 'school': 'University of Tech', 'year': '2020'}
        ],
        'experience': [
            {'title': headline, 'company': 'Tech Corp', 'duration': f"{experience_years} years"}
        ],
        'summary': f"Experienced {headline} with {experience_years} years of experience in the industry."
    }


def calculate_fit_score(candidate_skills, job_skills, candidate_exp, job_min_exp):
    """
    Calculates a fit score between 0-100 based on skills and experience match.
    """
    if not job_skills:
        return Decimal('50.00') # Neutral score if no skills required

    # 1. Skill Match (70% weight)
    job_skills_lower = [s.lower() for s in job_skills]
    cand_skills_lower = [s.lower() for s in candidate_skills]
    
    matched_skills = [
        s for s in job_skills_lower 
        if any(cs in s or s in cs for cs in cand_skills_lower)
    ]
    
    skill_score = (len(matched_skills) / len(job_skills)) * 100
    
    # 2. Experience Match (30% weight)
    exp_score = 0
    if candidate_exp >= job_min_exp:
        exp_score = 100
    else:
        exp_score = (candidate_exp / max(1, job_min_exp)) * 100
        
    # Weighted Average
    total_score = (skill_score * 0.7) + (exp_score * 0.3)
    return Decimal(str(round(min(100, max(0, total_score)), 2)))


def analyze_candidate(candidate, job_posting):
    """
    Performs a full analysis of a candidate against a job posting.
    Returns the update dict for the candidate instance.
    """
    parsed_data = candidate.parsed_resume_data or {}
    cand_skills = parsed_data.get('skills', [])
    cand_exp = parsed_data.get('experience_years', 0)
    
    job_skills = job_posting.required_skills
    job_min_exp = job_posting.minimum_experience
    
    # Calculate Score
    fit_score = calculate_fit_score(cand_skills, job_skills, cand_exp, job_min_exp)
    
    # Generate Analysis
    analysis = {
        'strengths': [s for s in cand_skills if s.lower() in [js.lower() for js in job_skills]],
        'missing_skills': [s for s in job_skills if s.lower() not in [cs.lower() for cs in cand_skills]],
        'experience_check': 'Pass' if cand_exp >= job_min_exp else 'Below Requirement',
        'summary': f"Candidate has {cand_exp} years of experience vs {job_min_exp} required."
    }
    
    return {
        'ai_fit_score': fit_score,
        'ai_analysis': analysis,
        'ai_skill_match': analysis['strengths']
    }
