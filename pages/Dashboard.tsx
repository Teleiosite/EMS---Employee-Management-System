import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Building2,
  FileCheck,
  UserCheck,
  Megaphone,
  CheckCircle,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/dashboardApi';
import { DashboardStats } from '../types';

// Default empty stats
const emptyStats: DashboardStats = {
  totalEmployees: 0,
  onLeaveToday: 0,
  totalDepartments: 0,
  pendingApprovals: 0,
  presentToday: 0,
  totalAnnouncements: 0,
  approvedLeave: 0,
  pendingPayrolls: 0,
};

const StatCard: React.FC<{
  title: string;
  value: number;
  color: 'orange' | 'purple' | 'teal' | 'blue';
  icon: React.ElementType;
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, color, icon: Icon, loading, onClick }) => {

  const colorStyles = {
    orange: 'bg-orange-400',
    purple: 'bg-indigo-900',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left ${colorStyles[color]} text-white rounded-xl p-6 shadow-md relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
        {loading ? (
          <div className="flex items-center h-10 mb-4">
            <Loader2 className="w-6 h-6 animate-spin opacity-70" />
          </div>
        ) : (
          <h3 className="text-4xl font-bold mb-4">{value}</h3>
        )}
        <span className="inline-block text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors">
          View List
        </span>
      </div>
      <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 w-24 h-24 transform translate-x-4" />
    </button>
  );
};

const InfoCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon: Icon, iconColor, iconBg, loading, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 focus:outline-none ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          {loading ? (
            <div className="flex items-center h-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</span>
      </div>
    </button>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        // Keep showing zeros, don't use mock data
        setStats(emptyStats);
        if (err?.status === 401) {
          setError('Please log in to view dashboard data.');
        } else {
          setError('Failed to connect to server. Showing empty data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.firstName || 'Admin';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {firstName}</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your team today.</p>
          {error && (
            <p className="text-amber-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 text-gray-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          {currentDate}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          color="orange"
          icon={Users}
          loading={loading}
          onClick={() => navigate('/admin/employees')}
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          color="purple"
          icon={Briefcase}
          loading={loading}
          onClick={() => navigate('/admin/leaves')}
        />
        <StatCard
          title="Total Departments"
          value={stats.totalDepartments}
          color="teal"
          icon={Building2}
          loading={loading}
          onClick={() => navigate('/admin/departments')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          color="blue"
          icon={FileCheck}
          loading={loading}
          onClick={() => navigate('/admin/leaves')}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard
          title="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          loading={loading}
          onClick={() => navigate('/admin/attendance')}
        />
        <InfoCard
          title="Total Announcements"
          value={stats.totalAnnouncements}
          icon={Megaphone}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          loading={loading}
          onClick={() => navigate('/admin/announcements')}
        />
        <InfoCard
          title="Approved Leave"
          value={stats.approvedLeave}
          icon={CheckCircle}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
          loading={loading}
          onClick={() => navigate('/admin/leaves')}
        />
        <InfoCard
          title="Pending Payrolls"
          value={stats.pendingPayrolls}
          icon={DollarSign}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          loading={loading}
          onClick={() => navigate('/admin/payroll')}
        />
      </div>
    </div>
  );
};

export default Dashboard;