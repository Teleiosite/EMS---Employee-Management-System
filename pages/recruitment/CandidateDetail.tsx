import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import recruitmentApi from '../../services/recruitmentApi';
import { Candidate } from '../../types';
import { useToast } from '../../context/ToastContext';

const CandidateDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (!id) return;
    recruitmentApi.getCandidate(id)
      .then(setCandidate)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load candidate', 'error'));
  }, [id, showToast]);

  if (!candidate) {
    return <div className="p-6">Loading candidate details...</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/recruitment/candidates')} className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
        <ArrowLeft className="w-4 h-4" /> Back to candidates
      </button>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">{candidate.full_name}</h1>
        <p className="text-gray-600">{candidate.email}</p>
        <p className="text-gray-600">Applied Role: {candidate.applied_role_name}</p>
        <p className="text-gray-600">Status: {candidate.status}</p>
        <p className="text-gray-600">Fit Score: {candidate.fit_score}%</p>
        <div>
          <h2 className="font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {candidate.skills.map((s) => <span key={s} className="px-2 py-1 bg-gray-100 rounded text-xs">{s}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
