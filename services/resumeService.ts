
import { Candidate, JobRequirement, ParsedResume } from '../types';
import { candidates, jobRequirements } from './mockData';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock function to simulate CVParserPro API
// In a real environment, you would use axios/fetch to POST to the endpoint
export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  await delay(2000); // Simulate API call time

  // NOTE: This is where the real integration would happen
  /*
  const formData = new FormData();
  formData.append('resume', file);
  
  const response = await fetch('https://api.cvparserpro.com/v1/parse', {
    method: 'POST',
    headers: { 'x-api-key': process.env.CVPARSERPRO_API_KEY },
    body: formData
  });
  return response.json();
  */

  // Mock Extraction Logic based on file name or random generation for demo
  const isDeveloper = file.name.toLowerCase().includes('dev') || file.name.toLowerCase().includes('tech');
  const isMarketing = file.name.toLowerCase().includes('market');
  const isDesigner = file.name.toLowerCase().includes('design');

  let skills: string[] = [];
  let expYears = 0;

  if (isDeveloper) {
    skills = ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Git'];
    expYears = Math.floor(Math.random() * 5) + 2;
  } else if (isMarketing) {
    skills = ['SEO', 'Content Strategy', 'Social Media', 'Google Ads'];
    expYears = Math.floor(Math.random() * 4) + 1;
  } else if (isDesigner) {
    skills = ['Figma', 'Adobe XD', 'Sketch', 'UI/UX'];
    expYears = Math.floor(Math.random() * 6) + 1;
  } else {
    // Generic fallback
    skills = ['Communication', 'Microsoft Office', 'Teamwork'];
    expYears = Math.floor(Math.random() * 10);
  }

  return {
    name: 'Parsed Candidate ' + Math.floor(Math.random() * 1000),
    email: `candidate${Date.now()}@example.com`,
    phone: '+1 (555) ' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
    skills: skills,
    education: [
      {
        degree: 'Bachelor of Science',
        school: 'University of Mock Data',
        year: '2020'
      }
    ],
    experience: [
      {
        title: isDeveloper ? 'Software Engineer' : isMarketing ? 'Marketing Associate' : 'Professional',
        company: 'Tech Corp',
        duration: `${expYears} years`,
        description: 'Worked on various projects and delivered high quality results.'
      }
    ],
    summary: 'Motivated professional with a strong background in ' + skills[0] + '.'
  };
};

export const calculateFitScore = (candidateSkills: string[], candidateExp: number, job: JobRequirement): number => {
  // 1. Skill Match (70% weight)
  const jobSkillsLower = job.required_skills.map(s => s.toLowerCase());
  const candSkillsLower = candidateSkills.map(s => s.toLowerCase());
  
  const matchedSkills = jobSkillsLower.filter(s => candSkillsLower.some(cs => cs.includes(s) || s.includes(cs)));
  const skillScore = (matchedSkills.length / job.required_skills.length) * 100;

  // 2. Experience Match (30% weight)
  let expScore = 0;
  if (candidateExp >= job.minimum_years_experience) {
    expScore = 100;
  } else {
    expScore = (candidateExp / job.minimum_years_experience) * 100;
  }

  // Weighted Average
  const totalScore = (skillScore * 0.7) + (expScore * 0.3);
  return Math.round(Math.min(100, Math.max(0, totalScore)));
};

export const saveCandidate = async (file: File, parsedData: ParsedResume, jobId: string, userId?: string): Promise<Candidate> => {
  const job = jobRequirements.find(j => j.id === jobId);
  if (!job) throw new Error("Job not found");

  // Approximate years of experience from parsing logic simulation (mock data has it explicitly, parsed data might need heuristic)
  // For this mock, we'll extract a number from the first experience duration or default to 0
  const expStr = parsedData.experience[0]?.duration || "0";
  const expYears = parseInt(expStr) || 0;

  const score = calculateFitScore(parsedData.skills, expYears, job);

  const newCandidate: Candidate = {
    id: `c${Date.now()}`,
    userId: userId, // Link application to user if logged in
    full_name: parsedData.name,
    email: parsedData.email,
    phone: parsedData.phone,
    skills: parsedData.skills,
    years_of_experience: expYears,
    resume_file_name: file.name,
    parsed_resume: parsedData,
    applied_role_id: job.id,
    applied_role_name: job.role_name,
    fit_score: score,
    status: 'APPLIED',
    created_at: new Date().toISOString().split('T')[0]
  };

  // Save to mock DB
  candidates.unshift(newCandidate);
  
  return newCandidate;
};
