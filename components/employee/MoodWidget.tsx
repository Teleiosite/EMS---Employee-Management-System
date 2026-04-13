import React, { useState, useEffect } from 'react';
import { 
    Smile, 
    Frown, 
    Meh as MehIcon, 
    Heart, 
    ThumbsDown,
    CheckCircle2,
    Calendar,
    Sparkles
} from 'lucide-react';
import { analyticsApi, PulseSurvey } from '../../services/analyticsApi';

const MoodWidget: React.FC = () => {
    const [survey, setSurvey] = useState<PulseSurvey | null>(null);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkVoted = localStorage.getItem(`voted_${new Date().toDateString()}`);
        if (checkVoted) {
            setVoted(true);
        }
        fetchActiveSurvey();
    }, []);

    const fetchActiveSurvey = async () => {
        try {
            const data = await analyticsApi.getActiveSurvey();
            setSurvey(data);
        } catch (error) {
            console.error('No active survey found');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (sentiment: number) => {
        if (!survey || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await analyticsApi.submitResponse(survey.id, sentiment);
            localStorage.setItem(`voted_${new Date().toDateString()}`, 'true');
            setVoted(true);
        } catch (error) {
            console.error('Failed to submit mood:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return null;
    if (!survey || !survey.is_active) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-orange-500 px-6 py-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Daily Pulse</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full text-[10px] font-bold">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
            </div>

            <div className="p-6">
                {!voted ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-800 leading-tight">
                            {survey.question}
                        </h3>
                        <div className="flex justify-between items-center gap-2">
                            <MoodButton 
                                icon={ThumbsDown} 
                                color="text-red-500" 
                                bg="hover:bg-red-50" 
                                onClick={() => handleVote(1)} 
                                label="Very Sad"
                                disabled={isSubmitting}
                            />
                            <MoodButton 
                                icon={Frown} 
                                color="text-orange-500" 
                                bg="hover:bg-orange-50" 
                                onClick={() => handleVote(2)} 
                                label="Sad"
                                disabled={isSubmitting}
                            />
                            <MoodButton 
                                icon={MehIcon} 
                                color="text-yellow-500" 
                                bg="hover:bg-yellow-50" 
                                onClick={() => handleVote(3)} 
                                label="Neutral"
                                disabled={isSubmitting}
                            />
                            <MoodButton 
                                icon={Smile} 
                                color="text-green-500" 
                                bg="hover:bg-green-50" 
                                onClick={() => handleVote(4)} 
                                label="Happy"
                                disabled={isSubmitting}
                            />
                            <MoodButton 
                                icon={Heart} 
                                color="text-pink-500" 
                                bg="hover:bg-pink-50" 
                                onClick={() => handleVote(5)} 
                                label="Very Happy"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 space-y-3 animate-in fade-in duration-500">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                            <h4 className="font-bold text-gray-800">Your voice was heard!</h4>
                            <p className="text-xs text-gray-400 mt-1">Thank you for sharing your feedback today.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface MoodButtonProps {
    icon: any;
    color: string;
    bg: string;
    onClick: () => void;
    label: string;
    disabled?: boolean;
}

const MoodButton: React.FC<MoodButtonProps> = ({ icon: Icon, color, bg, onClick, label, disabled }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all group ${bg} disabled:opacity-50`}
    >
        <div className={`p-2 rounded-full transition-transform group-hover:scale-125 ${color}`}>
            <Icon className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-gray-600">
            {label}
        </span>
    </button>
);

export default MoodWidget;
