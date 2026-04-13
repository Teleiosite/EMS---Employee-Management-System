import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building, Building2, Briefcase, MapPin, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { PublicJob } from '../services/applicantApi';

const PublicCareers: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Basic company info fallback based on slug
  const companyName = tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1).replace('-', ' ') : 'Our Company';

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get<PublicJob[]>(`/recruitment/public/jobs/?tenant=${tenantSlug || ''}`);
        const jobsData = Array.isArray(response) ? response : (response as any)?.results ?? [];
        setJobs(jobsData.filter((j: PublicJob) => j.status === 'OPEN'));
      } catch (err: any) {
        setError(err.message || 'Failed to load job listings.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [tenantSlug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Dynamic Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              {companyName} Careers
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Employee Login
            </Link>
            <Link to="/login" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm">
              Applicant Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Join the <span className="text-orange-400">{companyName}</span> Team
          </h1>
          <p className="text-lg text-gray-300">
            Discover opportunities to grow, innovate, and make an impact. We're looking for passionate individuals to help us build the future.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
          <p className="text-gray-500 mt-1">Found {jobs.length} open role{jobs.length === 1 ? '' : 's'}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            <p className="text-gray-500 font-medium">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Open Roles</h3>
            <p className="text-gray-500">We don't have any open positions at the moment, but check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {job.department}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {job.employment_type}</span>
                    </div>
                    
                    {/* Read More Accordion-style peek could go here, but linking to login for specific action is better */}
                    <p className="mt-4 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  
                  <div className="sm:text-right shrink-0">
                    <Link 
                      to={`/login`} 
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm group-hover:shadow-md group-hover:scale-105"
                    >
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {companyName} &bull; Powered by HireWix</p>
      </footer>
    </div>
  );
};

export default PublicCareers;
