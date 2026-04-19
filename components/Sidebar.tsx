
import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  FileText,
  ShieldCheck,
  ExternalLink,
  BarChart3,
  History,
  GitBranch,
  SearchCode,
  Lock,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isMobile?: boolean;
  closeMobileSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, closeMobileSidebar }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Departments', 'Announcements', 'Recruitment', 'Analytics']);
  const [companyName, setCompanyName] = useState<string>('HireWix');

  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenantName) setCompanyName(user.tenantName);
  }, [user]);

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
    { name: 'Payroll', icon: DollarSign, path: '/admin/payroll', requiredTier: 'BUSINESS', featureKey: 'payroll_runs' },
    { name: 'Attendance', icon: Clock, path: '/admin/attendance' },
    {
      name: 'Recruitment',
      icon: FileText,
      subItems: [
        { name: 'Job Postings', path: '/admin/recruitment/jobs' },
        { name: 'Candidate Dashboard', path: '/admin/recruitment/candidates', requiredTier: 'BUSINESS', featureKey: 'ai_resumes' },
        { name: 'AI Settings', path: '/admin/recruitment/ai-settings', requiredTier: 'BUSINESS', featureKey: 'ai_resumes' }
      ]
    },
    {
      name: 'Announcements',
      icon: Megaphone,
      subItems: [
        { name: 'View Announcements', path: '/admin/announcements' },
        { name: 'Add Announcement', path: '/admin/announcements/new' }
      ]
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      subItems: [
        { name: 'Organization Chart', path: '/admin/analytics/org-chart' },
        { name: 'Workforce Insights', path: '/admin/analytics/surveys', requiredTier: 'ENTERPRISE', featureKey: 'workforce_analytics' },
        { name: 'Audit Logs', path: '/admin/analytics/audit-logs', requiredTier: 'ENTERPRISE', featureKey: 'audit_logs' }
      ]
    },
    { name: 'Billing & Subscription', icon: ShieldCheck, path: '/admin/billing' },
  ];

  const getTrialInfo = (item: any) => {
    if (!item.requiredTier || user?.isSuperuser) return { isLocked: false, trialCount: 0 };
    
    const tiers = ['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE'];
    const userTierIdx = tiers.indexOf(user?.subscription_tier || 'FREE');
    const requiredIdx = tiers.indexOf(item.requiredTier);

    if (userTierIdx >= requiredIdx) return { isLocked: false, trialCount: 0 };

    const usage = user?.feature_usage?.[item.featureKey!] || 0;
    return {
      isLocked: usage >= 10,
      trialCount: usage,
      needed: item.requiredTier
    };
  };

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto z-10 transition-transform ${isMobile ? 'block' : 'hidden md:block fixed left-0 top-0'}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Building className="w-6 h-6 text-orange-600" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-base font-bold text-orange-500 leading-tight truncate max-w-[9rem]" title={companyName}>{companyName}</h1>
          <h2 className="text-xs font-semibold text-orange-400">Management System</h2>
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Main</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const trial = getTrialInfo(item);

            if (item.subItems) {
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = item.subItems.some(sub => location.pathname === sub.path);

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive || isExpanded
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
                      {item.subItems.map((subItem) => {
                        const subTrial = getTrialInfo(subItem);
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subTrial.isLocked ? '/admin/billing' : subItem.path}
                            onClick={handleLinkClick}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-4 py-2 text-sm rounded-md transition-colors ${isActive
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                              }`
                            }
                          >
                            <span className="flex items-center gap-2">
                              {subItem.name}
                              {subTrial.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                            </span>
                            {!subTrial.isLocked && subTrial.needed && (
                              <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                                {subTrial.trialCount}/10
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={trial.isLocked ? '/admin/billing' : item.path!}
                end={item.path === '/admin'}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${trial.isLocked ? 'opacity-70' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                   <item.icon className="w-5 h-5" />
                   {item.name}
                   {trial.isLocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                {!trial.isLocked && trial.needed && (
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                     Trial: {trial.trialCount}/10
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Platform Owner Section - only visible for super admin (no tenant) */}
      {user?.isSuperuser && (
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">Platform</p>
          <a
            href="#/host"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            Host Console
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
          </a>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
