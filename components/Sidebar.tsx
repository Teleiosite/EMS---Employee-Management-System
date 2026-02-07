import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  Clock, 
  Megaphone,
  Briefcase,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
  closeMobileSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, closeMobileSidebar }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Departments', 'Announcements']);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const handleLinkClick = () => {
    if (isMobile && closeMobileSidebar) {
      closeMobileSidebar();
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Employees', icon: Users, path: '/admin/employees' },
    { 
      name: 'Departments', 
      icon: Building, 
      subItems: [
        { name: 'View Departments', path: '/admin/departments' },
        { name: 'Add Department', path: '/admin/departments/new' }
      ]
    },
    { name: 'Leave Management', icon: Briefcase, path: '/admin/leaves' },
    { name: 'Payroll', icon: DollarSign, path: '/admin/payroll' },
    { name: 'Attendance', icon: Clock, path: '/admin/attendance' },
    { 
      name: 'Announcements', 
      icon: Megaphone, 
      subItems: [
        { name: 'View Announcements', path: '/admin/announcements' },
        { name: 'Add Announcement', path: '/admin/announcements/new' }
      ]
    },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto z-10 transition-transform ${isMobile ? 'block' : 'hidden md:block fixed left-0 top-0'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Building className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-500 leading-none">Employee</h1>
          <h2 className="text-sm font-semibold text-orange-400">Management System</h2>
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Main</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            if (item.subItems) {
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = item.subItems.some(sub => location.pathname === sub.path);
              
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive || isExpanded
                        ? 'text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-12 space-y-1 mt-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleLinkClick}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`
                          }
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path!}
                end={item.path === '/admin'} // Exact match for dashboard
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
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;