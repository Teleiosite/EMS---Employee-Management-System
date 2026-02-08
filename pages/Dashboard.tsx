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
import { dashboardApi } from '../services/dashboardApi';
import { dashboardStats as mockStats } from '../services/mockData';
import { DashboardStats } from '../types';

const StatCard: React.FC<{
  title: string;
  value: number;
  color: 'orange' | 'purple' | 'teal' | 'blue';
  icon: React.ElementType;
  loading?: boolean;
}> = ({ title, value, color, icon: Icon, loading }) => {

  const colorStyles = {
    orange: 'bg-orange-400',
    purple: 'bg-indigo-900',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className={`${colorStyles[color]} text-white rounded-xl p-6 shadow-md relative overflow-hidden transition-transform hover:scale-[1.02]`}>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
        {loading ? (
          <div className="flex items-center h-10 mb-4">
            <Loader2 className="w-6 h-6 animate-spin opacity-70" />
          </div>
        ) : (
          <h3 className="text-4xl font-bold mb-4">{value}</h3>
        )}
        <button className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors">
          View List
        </button>
      </div>
      <Icon className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 w-24 h-24 transform translate-x-4" />
    </div>
  );
};

const InfoCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
}> = ({ title, value, icon: Icon, iconColor, iconBg, loading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.warn('Failed to fetch dashboard stats, using mock data:', err);
        setStats(mockStats);
        setError('Using offline data');
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
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          color="purple"
          icon={Briefcase}
          loading={loading}
        />
        <StatCard
          title="Total Departments"
          value={stats.totalDepartments}
          color="teal"
          icon={Building2}
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          color="blue"
          icon={FileCheck}
          loading={loading}
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
        />
        <InfoCard
          title="Total Announcements"
          value={stats.totalAnnouncements}
          icon={Megaphone}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          loading={loading}
        />
        <InfoCard
          title="Approved Leave"
          value={stats.approvedLeave}
          icon={CheckCircle}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
          loading={loading}
        />
        <InfoCard
          title="Pending Payrolls"
          value={stats.pendingPayrolls}
          icon={DollarSign}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;