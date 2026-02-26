import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Briefcase, Award, CheckCircle, XCircle, FileText, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { Candidate } from '../../types';
import { useToast } from '../../context/ToastContext';

const CandidateDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await recruitmentApi.getCandidate(id);
      setCandidate(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch candidate:', err);
      setError('Failed to load candidate details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!candidate || !id) return;

    if (window.confirm(`Are you sure you want to mark this candidate as ${status}?`)) {
      setProcessing(true);
      try {
        const updated = await recruitmentApi.updateCandidateStatus(id, status);
        setCandidate(updated);
        showToast(`Candidate marked as ${status}`, status === 'SHORTLISTED' || status === 'HIRED' ? 'success' : 'info');
      } catch (err: any) {
        console.error('Failed to update status:', err);
        showToast('Failed to update candidate status.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  const parseResume = async () => {
    if (!candidate || !id) return;

    setProcessing(true);
    try {
      const updated = await recruitmentApi.parseResume(id);
      setCandidate(updated);
      showToast('Resume parsed successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to parse resume:', err);
      showToast('Failed to parse resume.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading candidate...
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-800">Error Loading Candidate</h3>
          <p className="text-red-600 mb-4">{error || 'Candidate not found.'}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const parsed = candidate.parsed_resume || { skills: [], experience: [], education: [] };

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
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600 font-bold text-3xl overflow-hidden">
              {candidate.resume_file_name && candidate.resume_file_name.endsWith('.jpg') ? (
                <img src={candidate.resume_file_name} alt={candidate.full_name} className="w-full h-full object-cover" />
              ) : (
                candidate.full_name.charAt(0)
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{candidate.full_name}</h1>
            <p className="text-gray-500 text-sm mb-4">{candidate.applied_role_name}</p>

            <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg mb-6 ${candidate.fit_score >= 80 ? 'bg-green-100 text-green-700' :
                candidate.fit_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
              {candidate.fit_score}% Fit Score
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <Mail className="w-4 h-4" /> {candidate.email}
              </div>
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <Phone className="w-4 h-4" /> {candidate.phone || 'N/A'}
              </div>
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <Calendar className="w-4 h-4" /> Applied: {new Date(candidate.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3 text-gray-600 text-sm">
                <FileText className="w-4 h-4" /> {candidate.resume_file_name || 'No Resume'}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleStatusChange('SHORTLISTED')}
                  disabled={processing || candidate.status === 'SHORTLISTED'}
                  className={`flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors ${processing || candidate.status === 'SHORTLISTED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle className="w-4 h-4" /> Shortlist
                </button>
                <button
                  onClick={() => handleStatusChange('REJECTED')}
                  disabled={processing || candidate.status === 'REJECTED'}
                  className={`flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium transition-colors ${processing || candidate.status === 'REJECTED' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
              <button
                onClick={parseResume}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Re-Run AI Analysis
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
              {parsed.skills && parsed.skills.length > 0 ? parsed.skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                  {skill}
                </span>
              )) : (
                <p className="text-gray-400 italic">No skills detected.</p>
              )}
            </div>
          </div>

          {candidate.ai_analysis && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" /> AI Analysis
              </h2>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm mb-1">Summary</h4>
                  <p className="text-purple-700 text-sm">{candidate.ai_analysis.summary || 'No summary available.'}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700 text-sm mb-2">Strengths</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {candidate.ai_analysis.strengths && candidate.ai_analysis.strengths.length > 0 ?
                        candidate.ai_analysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>) :
                        <li>None identified</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 text-sm mb-2">Missing Skills</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {candidate.ai_analysis.missing_skills && candidate.ai_analysis.missing_skills.length > 0 ?
                        candidate.ai_analysis.missing_skills.map((s: string, i: number) => <li key={i}>{s}</li>) :
                        <li>None identified</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-500" /> Experience
            </h2>
            <div className="space-y-6">
              {parsed.experience && parsed.experience.length > 0 ? parsed.experience.map((exp: any, idx: number) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-4 relative">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                  <h3 className="font-bold text-gray-900">{exp.title}</h3>
                  <p className="text-gray-600 font-medium">{exp.company}</p>
                  <p className="text-xs text-gray-500 mt-1">{exp.duration}</p>
                  {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                </div>
              )) : (
                <p className="text-gray-400 italic">No experience details parsed.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" /> Education
            </h2>
            <div className="space-y-4">
              {parsed.education && parsed.education.length > 0 ? parsed.education.map((edu: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div>
                    <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.school}</p>
                  </div>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">{edu.year}</span>
                </div>
              )) : (
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
