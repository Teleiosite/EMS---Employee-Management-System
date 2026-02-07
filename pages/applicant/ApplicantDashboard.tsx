
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Briefcase,
  Calendar
} from 'lucide-react';
import { candidates } from '../../services/mockData';
import { Candidate, User } from '../../types';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let color = 'bg-gray-100 text-gray-600';
  let icon = <Clock className="w-3 h-3" />;
  let label = 'Under Review';

  switch (status) {
    case 'APPLIED':
      color = 'bg-blue-100 text-blue-700';
      label = 'Submitted';
      break;
    case 'SHORTLISTED':
      color = 'bg-yellow-100 text-yellow-700';
      icon = <CheckCircle className="w-3 h-3" />;
      label = 'Shortlisted';
      break;
    case 'INTERVIEWING':
      color = 'bg-purple-100 text-purple-700';
      icon = <Calendar className="w-3 h-3" />;
      label = 'Interview Scheduled';
      break;
    case 'HIRED':
      color = 'bg-green-100 text-green-700';
      icon = <CheckCircle className="w-3 h-3" />;
      label = 'Hired';
      break;
    case 'REJECTED':
      color = 'bg-red-50 text-red-600';
      icon = <XCircle className="w-3 h-3" />;
      label = 'Not Selected';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon} {label}
    </span>
  );
};

const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Candidate[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u: User = JSON.parse(storedUser);
      setUser(u);
      
      // Filter candidates mock data for entries belonging to this user
      const userApps = candidates.filter(c => c.userId === u.id);
      // Sort by newest first
      userApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setApplications(userApps);
    }
  }, []);

  // Friendly feedback messages based on status
  const getFeedbackMessage = (status: string) => {
    switch(status) {
      case 'APPLIED': return "Your application has been received and is waiting for HR review.";
      case 'SHORTLISTED': return "Great news! Your profile has been flagged for further review.";
      case 'INTERVIEWING': return "We'd like to meet you! Check your email for interview details.";
      case 'HIRED': return "Congratulations! We're excited to have you join the team.";
      case 'REJECTED': return "Thank you for your interest. We've decided to move forward with other candidates.";
      default: return "Application status updated.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Hello, {user?.firstName}!</h1>
        <p className="text-gray-500 mt-1">Track your job applications and stay updated.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applications List (Left 2/3) */}
        <div className="md:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold text-gray-800">My Applications</h2>
             <button 
               onClick={() => navigate('/applicant/jobs')}
               className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
             >
               Browse Jobs
             </button>
           </div>

           {applications.length === 0 ? (
             <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Briefcase className="w-8 h-8 text-gray-300" />
               </div>
               <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
               <p className="text-gray-500 mt-1 mb-6">Start exploring opportunities and apply today.</p>
               <button 
                 onClick={() => navigate('/applicant/jobs')}
                 className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
               >
                 View Open Positions
               </button>
             </div>
           ) : (
             <div className="space-y-4">
               {applications.map(app => (
                 <div key={app.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-lg font-bold text-gray-900">{app.applied_role_name}</h3>
                       <p className="text-sm text-gray-500">Applied on {app.created_at}</p>
                     </div>
                     <StatusBadge status={app.status} />
                   </div>
                   
                   <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                     <p className="text-sm text-gray-700 flex items-start gap-2">
                       <span className="mt-0.5 text-purple-500"><FileText className="w-4 h-4"/></span>
                       {getFeedbackMessage(app.status)}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Profile Summary (Right 1/3) */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
             <h2 className="text-lg font-bold text-gray-800 mb-4">My Profile</h2>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={user?.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                   <h3 className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</h3>
                   <p className="text-sm text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                </div>
             </div>
             
             <div className="space-y-3 pt-4 border-t border-gray-100">
               <button 
                 onClick={() => navigate('/applicant/profile')}
                 className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
               >
                 Edit Profile
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;
