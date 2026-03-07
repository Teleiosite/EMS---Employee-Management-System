import React from 'react';
import { Candidate } from '../../types';
import { Mail, Phone, Eye, Calendar, MoreVertical, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CandidateCardProps {
    candidate: Candidate;
    onStatusChange: (id: number, newStatus: Candidate['status']) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onStatusChange }) => {
    const navigate = useNavigate();

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 stroke-green-500';
        if (score >= 60) return 'text-yellow-600 stroke-yellow-500';
        return 'text-red-600 stroke-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-50 border-green-200';
        if (score >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const circumference = 2 * Math.PI * 18; // r=18
    const strokeDashoffset = circumference - (candidate.fit_score / 100) * circumference;

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 group relative`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg border border-gray-200 shrink-0">
                        {candidate.full_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 leading-tight line-clamp-1" title={candidate.full_name}>
                            {candidate.full_name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3" /> {candidate.applied_role_name}
                        </p>
                    </div>
                </div>

                {/* AI Score Ring */}
                <div className="relative flex items-center justify-center shrink-0 ml-2" title={`AI Fit Score: ${candidate.fit_score}%`}>
                    <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                            className="text-gray-100 stroke-current"
                            strokeWidth="4"
                            cx="20"
                            cy="20"
                            r="18"
                            fill="transparent"
                        ></circle>
                        <circle
                            className={`${getScoreColor(candidate.fit_score)} transition-all duration-1000 ease-out`}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            cx="20"
                            cy="20"
                            r="18"
                            fill="transparent"
                        ></circle>
                    </svg>
                    <span className={`absolute text-xs font-bold ${getScoreColor(candidate.fit_score).split(' ')[0]}`}>
                        {candidate.fit_score}
                    </span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate" title={candidate.email}>{candidate.email}</span>
                </div>
                {candidate.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{candidate.phone}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
                {candidate.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded text-[10px] font-medium truncate max-w-[80px]" title={skill}>
                        {skill}
                    </span>
                ))}
                {candidate.skills.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-400 rounded text-[10px] font-medium">
                        +{candidate.skills.length - 3}
                    </span>
                )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => navigate(`/admin/recruitment/candidates/${candidate.id}`)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1.5 rounded-md transition-colors w-full justify-center"
                >
                    <Eye className="w-3.5 h-3.5" /> View Full Profile
                </button>
            </div>
        </div>
    );
};

export default CandidateCard;
