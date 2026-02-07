
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Download, Upload } from 'lucide-react';
import { candidates as initialCandidates, jobRequirements } from '../../services/mockData';
import { Candidate } from '../../types';

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Sort by fit score descending initially
    const sorted = [...initialCandidates].sort((a, b) => b.fit_score - a.fit_score);
    setCandidates(sorted);
  }, []);

  const filteredCandidates = candidates.filter(c => {
    const matchesRole = roleFilter === 'ALL' || c.applied_role_id === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Candidate Screening</h1>
          <p className="text-gray-500">AI-ranked candidates based on resume analysis.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/recruitment/upload')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Upload New Resume
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or skills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
          >
            <option value="ALL">All Roles</option>
            {jobRequirements.map(job => (
              <option key={job.id} value={job.id}>{job.role_name}</option>
            ))}
          </select>
          <select 
             value={statusFilter} 
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEWING">Interviewing</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Applied Role</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Top Skills</th>
                <th className="px-6 py-4 text-center">AI Fit Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.full_name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.applied_role_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.years_of_experience} Years</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{skill}</span>
                      ))}
                      {c.skills.length > 3 && <span className="text-xs text-gray-400">+{c.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(c.fit_score)}`}>
                      {c.fit_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'REJECTED' ? 'bg-red-50 text-red-800' :
                        'bg-gray-100 text-gray-800'
                     }`}>
                        {c.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/admin/recruitment/candidates/${c.id}`)}
                      className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center justify-end gap-1"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCandidates.length === 0 && (
                <tr>
                   <td colSpan={7} className="py-12 text-center text-gray-500">
                     No candidates found matching your filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;
