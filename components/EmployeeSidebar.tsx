import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Megaphone,
  Briefcase,
  DollarSign,
  User,
  Building
} from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
  closeMobileSidebar?: () => void;
}

const EmployeeSidebar: React.FC<SidebarProps> = ({ isMobile, closeMobileSidebar }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (isMobile && closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/employee' },
    { name: 'My Attendance', icon: Clock, path: '/employee/attendance' },
    { name: 'Leave Management', icon: Briefcase, path: '/employee/leaves' },
    { name: 'Payslips', icon: DollarSign, path: '/employee/payroll' },
    { name: 'Announcements', icon: Megaphone, path: '/employee/announcements' },
    { name: 'My Profile', icon: User, path: '/employee/profile' },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto z-10 transition-transform ${isMobile ? 'block' : 'hidden md:block fixed left-0 top-0'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Building className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-500 leading-none">Employee</h1>
          <h2 className="text-sm font-semibold text-orange-400">Portal</h2>
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Menu</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/employee'}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;