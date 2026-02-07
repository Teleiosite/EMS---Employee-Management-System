import React from 'react';
import { 
  Users, 
  Briefcase, 
  Building2, 
  FileCheck, 
  UserCheck, 
  Megaphone, 
  CheckCircle, 
  DollarSign 
} from 'lucide-react';
import { dashboardStats, currentUser } from '../services/mockData';

const StatCard: React.FC<{
  title: string;
  value: number;
  color: 'orange' | 'purple' | 'teal' | 'blue';
  icon: React.ElementType;
}> = ({ title, value, color, icon: Icon }) => {
  
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
        <h3 className="text-4xl font-bold mb-4">{value}</h3>
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
}> = ({ title, value, icon: Icon, iconColor, iconBg }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
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
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {currentUser.firstName}</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your team today.</p>
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
          value={dashboardStats.totalEmployees} 
          color="orange"
          icon={Users}
        />
        <StatCard 
          title="On Leave Today" 
          value={dashboardStats.onLeaveToday} 
          color="purple"
          icon={Briefcase}
        />
        <StatCard 
          title="Total Departments" 
          value={dashboardStats.totalDepartments} 
          color="teal"
          icon={Building2}
        />
        <StatCard 
          title="Pending Approvals" 
          value={dashboardStats.pendingApprovals} 
          color="blue"
          icon={FileCheck}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard 
          title="Present Today" 
          value={dashboardStats.presentToday} 
          icon={UserCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <InfoCard 
          title="Total Announcements" 
          value={dashboardStats.totalAnnouncements} 
          icon={Megaphone}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <InfoCard 
          title="Approved Leave" 
          value={dashboardStats.approvedLeave} 
          icon={CheckCircle}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
        />
        <InfoCard 
          title="Pending Payrolls" 
          value={dashboardStats.pendingPayrolls} 
          icon={DollarSign}
          iconColor="text-red-600"
          iconBg="bg-red-100"
        />
      </div>
    </div>
  );
};

export default Dashboard;