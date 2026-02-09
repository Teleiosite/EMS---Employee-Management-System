import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
  Calendar,
  User as UserIcon,
  Upload,
  Bell,
  Loader2
} from 'lucide-react';
import { applicantApi, Application, ApplicantProfile } from '../../services/applicantApi';
import { User } from '../../types';

const StatusBadge: React.FC<{ status: Application['status'] }> = ({ status }) => {
  const color = applicantApi.getStatusColor(status);
  const label = applicantApi.getStatusLabel(status);

  const getIcon = () => {
    switch (status) {
      case 'APPLIED':
      case 'UNDER_REVIEW':
        return <Clock className="w-3 h-3" />;
      case 'SHORTLISTED':
      case 'HIRED':
        return <CheckCircle className="w-3 h-3" />;
      case 'INTERVIEWING':
        return <Calendar className="w-3 h-3" />;
      case 'REJECTED':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {getIcon()} {label}
    </span>
  );
};

const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        // Fetch applications and profile in parallel
        const [appsData, profileData] = await Promise.all([
          applicantApi.getMyApplications(),
          applicantApi.getProfile()
        ]);

        setApplications(appsData);
        setProfile(profileData);
      } catch (err: any) {
        console.error('Failed to load applicant data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Count applications by status
  const statusCounts = {
    total: applications.length,
    pending: applications.filter(a => ['APPLIED', 'UNDER_REVIEW'].includes(a.status)).length,
    interviews: applications.filter(a => a.status === 'INTERVIEWING').length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          Hello, {user?.firstName || profile?.first_name || 'Applicant'}!
        </h1>
        <p className="text-gray-500 mt-1">Track your job applications and stay updated.</p>

        {profile && profile.profile_completeness < 100 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Complete your profile ({profile.profile_completeness}%)
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  A complete profile increases your chances of getting noticed.
                </p>
              </div>
              <button
                onClick={() => navigate('/applicant/profile')}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Complete Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{statusCounts.total}</p>
              <p className="text-xs text-gray-500">Total Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{statusCounts.pending}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{statusCounts.interviews}</p>
              <p className="text-xs text-gray-500">Interviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{statusCounts.shortlisted}</p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
          </div>
        </div>
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

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
                      <h3 className="text-lg font-bold text-gray-900">{app.job_title}</h3>
                      <p className="text-sm text-gray-500">
                        {app.job_department} • Applied on {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-0.5 text-purple-500"><FileText className="w-4 h-4" /></span>
                      {app.status_message}
                    </p>
                  </div>

                  {app.status === 'INTERVIEWING' && app.interview_scheduled_at && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Interview Scheduled
                      </p>
                      <p className="text-sm text-indigo-700 mt-1">
                        {new Date(app.interview_scheduled_at).toLocaleString()}
                        {app.interview_location && ` • ${app.interview_location}`}
                      </p>
                    </div>
                  )}
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
              <div className="w-16 h-16 rounded-full overflow-hidden bg-purple-100 border border-purple-200 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {profile?.first_name || user?.firstName} {profile?.last_name || user?.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate max-w-[150px]">{profile?.email || user?.email}</p>
              </div>
            </div>

            {profile?.headline && (
              <p className="text-sm text-gray-600 mb-4">{profile.headline}</p>
            )}

            {/* Profile Completeness */}
            {profile && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Profile Completeness</span>
                  <span className="font-medium text-gray-800">{profile.profile_completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${profile.profile_completeness}%` }}
                  />
                </div>
              </div>
            )}

            {/* Resume Status */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-4">
              <div className="flex items-center gap-2 text-sm">
                {profile?.current_resume ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">Resume Uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">No Resume Yet</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/applicant/profile')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/applicant/jobs')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Find Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;
