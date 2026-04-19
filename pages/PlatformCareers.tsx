import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import PlatformNavbar from '../components/PlatformNavbar';

interface PublicJob {
  id: string;
  role_name: string;
  department: string;
  minimum_years_experience: number;
  required_skills: string[];
  status?: string;
  tenant?: { name: string };
}

const PlatformCareers: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/recruitment/public/jobs/');
        const results = Array.isArray(response) ? response : (response as any).results || [];
        setJobs(results.filter((j: any) => j.status === 'OPEN' || !j.status));
      } catch {
        // silent
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans pt-24">
      <PlatformNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Open Positions</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Careers at HireWix Companies</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Live job openings from organisations powered by HireWix. Create an applicant account to apply directly.
          </p>
        </div>

        <div className="space-y-4">
          {jobsLoading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Loading open positions…</p>
            </div>
          ) : jobs.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
             <Briefcase className="w-14 h-14 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-gray-900 mb-2">No Open Positions Right Now</h3>
             <p className="text-gray-500 text-sm">Check back later for new opportunities. New roles are posted regularly.</p>
           </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {job.tenant && <span className="text-sm font-bold text-gray-900">{job.tenant.name}</span>}
                    <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">{job.department}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2">{job.role_name}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Remote / Hybrid</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Full-time</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.minimum_years_experience}+ yrs exp</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.required_skills?.slice(0, 5).map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">{skill}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/login?redirect=/applicant/jobs')}
                  className="flex-shrink-0 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformCareers;
