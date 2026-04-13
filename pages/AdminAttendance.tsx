import React, { useState } from 'react';
import { Shield, AlertTriangle, Settings, ChevronRight } from 'lucide-react';

// Sub-components
import LiveLog from '../components/attendance/LiveLog';
import SuspiciousActivity from '../components/attendance/SuspiciousActivity';
import AttendanceSettings from '../components/attendance/AttendanceSettings';

type Tab = 'log' | 'suspicious' | 'settings';

const AdminAttendance: React.FC = () => {
  const [tab, setTab] = useState<Tab>('log');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Surveillance Log', icon: <Shield className="w-4 h-4" /> },
    { id: 'suspicious', label: 'Anomaly Detection', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'settings', label: 'Security Policy', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Header section with rich aesthetics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            Attendance Matrix
            <ChevronRight className="w-6 h-6 text-orange-500" />
            <span className="text-gray-400 font-medium text-lg tracking-wide">
                {tabs.find(t => t.id === tab)?.label}
            </span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium max-w-2xl leading-relaxed">
            Advanced biometric monitoring and network-level security policing for organizational check-in integrity.
          </p>
        </div>
      </div>

      {/* Modern, glassmorphism-style Tab Switcher */}
      <div className="inline-flex p-1.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-lg shadow-xl shadow-gray-200/50">
        {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
                <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-semibold uppercase text-sm tracking-wide tracking-[0.15em] transition-all duration-300 ${
                        isActive 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 -translate-y-0.5' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    {t.icon}
                    {t.label}
                </button>
            );
        })}
      </div>

      {/* Content Area - Render sub-components with smooth transitions */}
      <div className="bg-transparent rounded-3xl min-h-[500px]">
        {tab === 'log' && <LiveLog />}
        {tab === 'suspicious' && <SuspiciousActivity />}
        {tab === 'settings' && <AttendanceSettings />}
      </div>
    </div>
  );
};

export default AdminAttendance;