import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckSquare,
  Clock,
  Megaphone
} from 'lucide-react';
import { User } from '../types';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  iconBgClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, colorClass, iconBgClass }) => (
  <div className={`${colorClass} rounded-xl p-6 shadow-sm text-white flex flex-col justify-between h-40 transition-transform hover:scale-[1.02]`}>
    <div>
      <h3 className="font-medium text-white/90 text-sm md:text-base mb-1">{title}</h3>
      <div className="text-3xl font-bold">{value}</div>
    </div>
    <div className="self-end p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const EmployeeDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.firstName || 'Employee'}!</h1>
        <p className="text-gray-500 mt-1">Here's a summary of your activities.</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium">
          <Clock className="w-4 h-4" />
          {currentDate}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Pending Leave Requests"
          value="0"
          icon={FileText}
          colorClass="bg-yellow-400"
          iconBgClass="bg-yellow-500"
        />
        <DashboardCard
          title="Approved Leaves (This Month)"
          value="0"
          icon={CheckSquare}
          colorClass="bg-green-500"
          iconBgClass="bg-green-600"
        />
        <DashboardCard
          title="Attendance (This Month)"
          value="2 Days"
          icon={Clock}
          colorClass="bg-blue-500"
          iconBgClass="bg-blue-600"
        />
        <DashboardCard
          title="Announcements"
          value="1"
          icon={Megaphone}
          colorClass="bg-purple-500"
          iconBgClass="bg-purple-600"
        />
      </div>

      {/* Recent Activity / Quick Actions Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400 flex-col gap-3">
          <Megaphone className="w-12 h-12 text-gray-200" />
          <p>No new announcements</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400 flex-col gap-3">
          <Clock className="w-12 h-12 text-gray-200" />
          <p>Attendance Overview Graph (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;