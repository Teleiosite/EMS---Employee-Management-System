import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Loader2, Users } from 'lucide-react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { Candidate, JobRequirement } from '../../types';
import CandidateCard from '../../components/recruitment/CandidateCard';
import { useToast } from '../../context/ToastContext';

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [candidatesData, jobsData] = await Promise.all([
        recruitmentApi.listCandidates(),
        recruitmentApi.listJobs()
      ]);
      // Sort by fit score descending
      const sorted = [...candidatesData].sort((a, b) => b.fit_score - a.fit_score);
      setCandidates(sorted);
      setJobs(jobsData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (candidateId: number, newStatus: string) => {
    try {
      await recruitmentApi.updateCandidateStatus(candidateId, newStatus as any);
      // Optimistic update
      setCandidates(prev => prev.map(c =>
        c.id === candidateId ? { ...c, status: newStatus as any } : c
      ));
      showToast(`Candidate moved to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
      // Refresh generic data on failure
      fetchData();
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesRole = roleFilter === 'ALL' || c.applied_role_id?.toString() === roleFilter.toString() || c.job?.toString() === roleFilter.toString();
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const columns = [
    { id: 'APPLIED', title: 'New Applications', color: 'bg-gray-100 border-gray-200' },
    { id: 'SHORTLISTED', title: 'Shortlisted', color: 'bg-blue-50 border-blue-100' },
    { id: 'INTERVIEWING', title: 'Interviewing', color: 'bg-purple-50 border-purple-100' },
    { id: 'HIRED', title: 'Hired', color: 'bg-green-50 border-green-100' },
    { id: 'REJECTED', title: 'Rejected', color: 'bg-red-50 border-red-100' }
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Candidate Dashboard</h1>
          <p className="text-gray-500">Manage recruitment pipeline and AI-screened talent.</p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={() => navigate('/admin/recruitment/upload')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Upload New Resume
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidates or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Roles
            </button>
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => setRoleFilter(job.id.toString())}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${roleFilter === job.id.toString() ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {job.role_name || job.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading recruitment pipeline...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
          <div className="flex gap-6 h-full min-w-max">
            {columns.map(column => {
              const columnCandidates = filteredCandidates.filter(c => c.status === column.id);
              return (
                <div key={column.id} className="w-80 flex flex-col h-full">
                  <div className={`shrink-0 mb-3 px-4 py-3 rounded-t-xl border-t-4 flex items-center justify-between ${column.color}`}>
                    <h3 className="font-bold text-gray-800 text-sm tracking-wide">{column.title}</h3>
                    <span className="bg-white/60 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                      {columnCandidates.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-8">
                    {columnCandidates.length === 0 ? (
                      <div className="bg-gray-50/50 rounded-lg p-6 text-center border border-dashed border-gray-200 mt-2">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">No candidates in this stage</p>
                      </div>
                    ) : (
                      columnCandidates.map(candidate => (
                        <div key={candidate.id} className="relative group cursor-grab active:cursor-grabbing">
                          <CandidateCard
                            candidate={candidate}
                            onStatusChange={handleStatusChange}
                          />

                          {/* Quick Move Overlay Options on Hover */}
                          <div className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                            {column.id !== 'SHORTLISTED' && column.id === 'APPLIED' && (
                              <button onClick={() => handleStatusChange(candidate.id, 'SHORTLISTED')} className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform" title="Move to Shortlisted">→</button>
                            )}
                            {column.id !== 'INTERVIEWING' && column.id === 'SHORTLISTED' && (
                              <button onClick={() => handleStatusChange(candidate.id, 'INTERVIEWING')} className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform" title="Move to Interviewing">→</button>
                            )}
                            {(column.id === 'INTERVIEWING' || column.id === 'SHORTLISTED') && (
                              <>
                                <button onClick={() => handleStatusChange(candidate.id, 'HIRED')} className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform" title="Hire">✓</button>
                                <button onClick={() => handleStatusChange(candidate.id, 'REJECTED')} className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform" title="Reject">✕</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateList;
