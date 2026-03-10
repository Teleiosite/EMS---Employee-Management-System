import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckSquare,
  Clock,
  Megaphone
} from 'lucide-react';
import { User } from '../types';
import leavesApi from '../services/leavesApi';
import attendanceApi from '../services/attendanceApi';
import { announcementsApi } from '../services/announcementsApi';
import { employeesApi } from '../services/employeesApi';

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

  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [approvedLeaves, setApprovedLeaves] = useState(0);
  const [attendanceDays, setAttendanceDays] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let currentUser: User | null = null;
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      setUser(currentUser);
    }

    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Use Promise.allSettled so one failure doesn't crash the whole dashboard
        Promise.allSettled([
          // 1. Leaves
          (async () => {
            console.log("[Dashboard] Leaves block start. currentUser?.id:", currentUser?.id);
            if (currentUser?.id) {
              const profile = await employeesApi.getProfile(currentUser.id);
              console.log("[Dashboard] getProfile returned:", profile);
              if (profile?.id) {
                const myLeaves = await leavesApi.listRequests({ employee: profile.id });
                console.log("[Dashboard] leavesApi returned:", myLeaves);
                const pending = myLeaves.filter(req => req.status === 'PENDING').length;
                const approvedThisMonth = myLeaves.filter(req => {
                  const startDate = new Date(req.startDate);
                  return req.status === 'APPROVED' && startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
                }).length;
                console.log("[Dashboard] Leaves calc -> pending:", pending, "approved:", approvedThisMonth);
                setPendingLeaves(pending);
                setApprovedLeaves(approvedThisMonth);
              }
            }
          })(),

          // 2. Attendance
          (async () => {
            console.log("[Dashboard] Attendance block start.");
            const myAttendance = await attendanceApi.listLogs();
            console.log("[Dashboard] attendanceApi returned:", myAttendance);
            const presentThisMonth = myAttendance.filter(log => {
              const logDate = new Date(log.date);
              return (log.status === 'PRESENT' || log.status === 'LATE' || log.status === 'HALF_DAY') &&
                logDate.getMonth() === currentMonth &&
                logDate.getFullYear() === currentYear;
            }).length;
            console.log("[Dashboard] Attendance calc -> presentThisMonth:", presentThisMonth);
            setAttendanceDays(presentThisMonth);
          })(),

          // 3. Announcements
          (async () => {
            console.log("[Dashboard] Announcements block start.");
            const announcements = await announcementsApi.list();
            console.log("[Dashboard] announcementsApi returned:", announcements);
            setAnnouncementsCount(announcements.length);
          })()
        ]).then((results) => {
          results.forEach((res, index) => {
            if (res.status === 'rejected') {
              console.error(`[Dashboard] Fetch ${index + 1} Failed:`, res.reason);
            }
          });
        });

      } catch (error) {
        console.error("Dashboard initialization error", error);
      }
    };

    fetchDashboardData();
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
          value={pendingLeaves}
          icon={FileText}
          colorClass="bg-yellow-400"
          iconBgClass="bg-yellow-500"
        />
        <DashboardCard
          title="Approved Leaves (This Month)"
          value={approvedLeaves}
          icon={CheckSquare}
          colorClass="bg-green-500"
          iconBgClass="bg-green-600"
        />
        <DashboardCard
          title="Attendance (This Month)"
          value={`${attendanceDays} Day${attendanceDays !== 1 ? 's' : ''}`}
          icon={Clock}
          colorClass="bg-blue-500"
          iconBgClass="bg-blue-600"
        />
        <DashboardCard
          title="Announcements"
          value={announcementsCount}
          icon={Megaphone}
          colorClass="bg-purple-500"
          iconBgClass="bg-purple-600"
        />
      </div>

      {/* Recent Activity / Quick Actions Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400 flex-col gap-3">
          <Megaphone className="w-12 h-12 text-gray-200" />
          <p>{announcementsCount > 0 ? `You have ${announcementsCount} announcement${announcementsCount > 1 ? 's' : ''} to review in the Announcements tab.` : "No new announcements"}</p>
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