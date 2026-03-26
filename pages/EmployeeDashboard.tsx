import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckSquare,
  Clock,
  Megaphone
} from 'lucide-react';
import { User } from '../types';
import { leavesApi } from '../services/leavesApi';
import { attendanceApi } from '../services/attendanceApi';
import { announcementsApi } from '../services/announcementsApi';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  iconBgClass: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, colorClass, iconBgClass, onClick }) => (
  <button 
    onClick={onClick}
    className={`${colorClass} w-full text-left rounded-xl p-6 shadow-sm text-white flex flex-col justify-between h-40 transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div>
      <h3 className="font-medium text-white/90 text-sm md:text-base mb-1">{title}</h3>
      <div className="text-3xl font-bold">{value}</div>
    </div>
    <div className="self-end p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </button>
);

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);
  const [approvedLeavesThisMonth, setApprovedLeavesThisMonth] = useState(0);
  const [attendanceDaysThisMonth, setAttendanceDaysThisMonth] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [latestAnnouncementTitle, setLatestAnnouncementTitle] = useState('No new announcements');
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

    const loadDashboardStats = async () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      try {
        const leaveRequests = await leavesApi.listRequests();
        setPendingLeaveRequests(leaveRequests.filter((request) => request.status === 'PENDING').length);
        setApprovedLeavesThisMonth(
          leaveRequests.filter((request) => {
            if (request.status !== 'APPROVED') return false;
            const startDate = new Date(request.startDate);
            return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
          }).length
        );
      } catch (error) {
        console.error('Failed to load employee leave statistics:', error);
      }

      try {
        const attendanceLogs = await attendanceApi.listLogs();
        setAttendanceDaysThisMonth(
          attendanceLogs.filter((log) => {
            const logDate = new Date(log.date);
            const isThisMonth = logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
            const isCountableStatus = log.status === 'PRESENT' || log.status === 'LATE' || log.status === 'HALF_DAY';
            return isThisMonth && isCountableStatus;
          }).length
        );
      } catch (error) {
        console.error('Failed to load employee attendance statistics:', error);
      }

      try {
        const announcements = await announcementsApi.list();
        setAnnouncementCount(announcements.length);

        if (announcements.length > 0) {
          const latestAnnouncement = [...announcements].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          setLatestAnnouncementTitle(latestAnnouncement.title);
        }
      } catch (error) {
        console.error('Failed to load employee announcement statistics:', error);
      }
    };

    loadDashboardStats();
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
          value={pendingLeaveRequests}
          icon={FileText}
          colorClass="bg-yellow-400"
          iconBgClass="bg-yellow-500"
          onClick={() => navigate('/employee/leaves')}
        />
        <DashboardCard
          title="Approved Leaves (This Month)"
          value={approvedLeavesThisMonth}
          icon={CheckSquare}
          colorClass="bg-green-500"
          iconBgClass="bg-green-600"
          onClick={() => navigate('/employee/leaves')}
        />
        <DashboardCard
          title="Attendance (This Month)"
          value={`${attendanceDaysThisMonth} Days`}
          icon={Clock}
          colorClass="bg-blue-500"
          iconBgClass="bg-blue-600"
          onClick={() => navigate('/employee/attendance')}
        />
        <DashboardCard
          title="Announcements"
          value={announcementCount}
          icon={Megaphone}
          colorClass="bg-purple-500"
          iconBgClass="bg-purple-600"
          onClick={() => navigate('/employee/announcements')}
        />
      </div>

      {/* Recent Activity / Quick Actions Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400 flex-col gap-3">
          <Megaphone className="w-12 h-12 text-gray-200" />
          <p>{latestAnnouncementTitle}</p>
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
