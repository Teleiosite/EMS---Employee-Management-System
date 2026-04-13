import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, ShieldCheck, Fingerprint } from 'lucide-react';
import { attendanceApi, AttendanceLog } from '../../services/attendanceApi';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const SuspiciousActivity: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi.listSuspicious()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex items-center gap-4 p-6 bg-red-50 border border-red-100 rounded-xl shadow-sm">
        <div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg shadow-red-500/30">
          <AlertTriangle className="w-6 h-6 shrink-0" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-red-900 uppercase tracking-tight">Security Alert Protocol</h3>
          <p className="text-xs font-medium text-red-700 leading-relaxed">
            These records were automatically flagged by the anti-cheat engine. Detection triggers include: Unrecognized Device IDs, Multiple IPs, or Bulk sign-ins (Collision checks) within 5 minutes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Running Collision Detection...</span>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-xl shadow-red-900/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase text-gray-400 font-semibold tracking-[0.15em]">
                <tr>
                  <th className="px-6 py-5">Identified Employee</th>
                  <th className="px-6 py-5">Event Date</th>
                  <th className="px-6 py-5">Checkpoint</th>
                  <th className="px-6 py-5">Source IP</th>
                  <th className="px-6 py-5">Hardware Identity</th>
                  <th className="px-6 py-5">Violation Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <ShieldCheck className="w-16 h-16 text-green-500" />
                        <span className="font-semibold uppercase text-sm tracking-wide tracking-[0.3em] text-xs">No Security Violations Detected</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="bg-red-50/20 hover:bg-red-100/30 transition-all duration-200">
                    <td className="px-6 py-5">
                      <p className="font-extrabold text-gray-900">{log.employee_name || 'Unmapped'}</p>
                      <p className="text-[10px] font-semibold text-gray-400 tracking-wide">UID: {log.employee_code}</p>
                    </td>
                    <td className="px-6 py-5 text-gray-600 font-medium">{log.date}</td>
                    <td className="px-6 py-5 text-gray-900 font-semibold italic">{fmt(log.clock_in_timestamp)}</td>
                    <td className="px-6 py-5 font-semibold text-[10px] text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">{log.clock_in_ip || 'MASKED'}</span>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[100px]">{log.device_fingerprint || 'MISSING'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="text-red-700 text-[10px] font-semibold bg-red-100 p-2 rounded-xl border border-red-200 max-w-xs leading-relaxed uppercase tracking-tight">
                            {log.suspicious_reason}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-red-50/10 flex justify-between items-center">
            <span className="text-[10px] font-semibold text-red-400 tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Security OverWatch Active
            </span>
            <span className="text-[10px] font-semibold text-red-400 tracking-wide">Flagged Units: {logs.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspiciousActivity;
