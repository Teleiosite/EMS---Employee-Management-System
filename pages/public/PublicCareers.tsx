import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recruitmentApi } from '../../services/recruitmentApi';
import { JobRequirement } from '../../types';
import { Briefcase, MapPin, Clock, ArrowRight, Building } from 'lucide-react';

const PublicCareers: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        if (!tenantSlug) throw new Error("Missing company slug");
        const data = await recruitmentApi.getPublicJobs(tenantSlug);
        setJobs(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching public jobs:", err);
        setError(err.message || "Failed to load job postings. Please verify the URL.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-white shadow-sm py-12 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 capitalize tracking-tight">
            Careers at {tenantSlug}
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Join our team and help us build something amazing.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex-grow">
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-center">
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Open Roles</h3>
            <p className="mt-2 text-gray-500">We don't have any open positions right now. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{job.role_name}</h2>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Building className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {job.department}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {job.employment_type}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <Link
                        to={`/jobs/${job.id}/${tenantSlug}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View & Apply
                        <ArrowRight className="ml-2 -mr-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-gray-600 line-clamp-2">{job.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-white text-center py-6 text-gray-400 text-sm border-t">
        Powered by EMS Application System
      </footer>
    </div>
  );
};

export default PublicCareers;
