
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Briefcase, Award, CheckCircle, XCircle, FileText, ArrowLeft } from 'lucide-react';
import { candidates } from '../../services/mockData';
import { Candidate } from '../../types';
import { useToast } from '../../context/ToastContext';

const CandidateDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (id) {
      const found = candidates.find(c => c.id === id);
      if (found) setCandidate(found);
    }
  }, [id]);

  if (!candidate) return <div className="p-6">Loading candidate...</div>;

  const handleStatusChange = (status: 'SHORTLISTED' | 'REJECTED') => {
    if(window.confirm(`Are you sure you want to mark this candidate as ${status}?`)) {
        // Update mock data reference
        candidate.status = status;
        setCandidate({...candidate}); // Trigger re-render
        showToast(`Candidate marked as ${status}`, status === 'SHORTLISTED' ? 'success' : 'info');
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
           {/* Profile Card */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 font-bold text-3xl">
                {candidate.full_name.charAt(0)}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{candidate.full_name}</h1>
              <p className="text-gray-500 text-sm mb-4">{candidate.applied_role_name}</p>
              
              <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg mb-6 ${
                  candidate.fit_score >= 80 ? 'bg-green-100 text-green-700' : 
                  candidate.fit_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {candidate.fit_score}% Fit Score
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Mail className="w-4 h-4" /> {candidate.email}
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Phone className="w-4 h-4" /> {candidate.phone}
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4" /> Applied: {candidate.created_at}
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <FileText className="w-4 h-4" /> {candidate.resume_file_name}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleStatusChange('SHORTLISTED')}
                   className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                   <CheckCircle className="w-4 h-4" /> Shortlist
                 </button>
                 <button 
                   onClick={() => handleStatusChange('REJECTED')}
                   className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium transition-colors"
                 >
                   <XCircle className="w-4 h-4" /> Reject
                 </button>
              </div>
           </div>
        </div>

        {/* Parsed Resume Details */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" /> Detected Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {candidate.parsed_resume.skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" /> Experience
              </h2>
              <div className="space-y-6">
                 {candidate.parsed_resume.experience.map((exp, idx) => (
                   <div key={idx} className="border-l-2 border-gray-200 pl-4 relative">
                     <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                     <h3 className="font-bold text-gray-900">{exp.title}</h3>
                     <p className="text-gray-600 font-medium">{exp.company}</p>
                     <p className="text-xs text-gray-500 mt-1">{exp.duration}</p>
                     {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                   </div>
                 ))}
                 {candidate.parsed_resume.experience.length === 0 && (
                   <p className="text-gray-400 italic">No experience details parsed.</p>
                 )}
              </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" /> Education
              </h2>
              <div className="space-y-4">
                 {candidate.parsed_resume.education.map((edu, idx) => (
                   <div key={idx} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                     <div>
                       <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                       <p className="text-gray-600">{edu.school}</p>
                     </div>
                     <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">{edu.year}</span>
                   </div>
                 ))}
                 {candidate.parsed_resume.education.length === 0 && (
                   <p className="text-gray-400 italic">No education details parsed.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
