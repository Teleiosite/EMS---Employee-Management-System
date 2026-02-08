
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Briefcase, MapPin } from 'lucide-react';
import { jobRequirements } from '../../services/mockData';
import { JobRequirement } from '../../types';
import { useToast } from '../../context/ToastContext';

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setJobs([...jobRequirements]);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      // Update local state
      setJobs(prev => prev.filter(job => job.id !== id));
      
      // Update mock data
      const index = jobRequirements.findIndex(j => j.id === id);
      if (index > -1) {
        jobRequirements.splice(index, 1);
      }
      showToast('Job posting deleted.', 'info');
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Postings</h1>
          <p className="text-gray-500">Manage open positions visible on the Applicant Board.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/recruitment/jobs/new')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-4">
            {filteredJobs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No job postings found.</p>
                </div>
            ) : (
                filteredJobs.map(job => (
                    <div key={job.id} className="border border-gray-100 rounded-lg p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg">{job.role_name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {job.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.department}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Remote/Hybrid</span>
                                <span>Exp: {job.minimum_years_experience}+ years</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {job.required_skills.slice(0, 5).map(skill => (
                                    <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => navigate(`/admin/recruitment/jobs/edit/${job.id}`)}
                                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleDelete(job.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default JobList;
