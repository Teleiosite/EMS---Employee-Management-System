import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { attendanceApi, AttendanceLog } from '../../services/attendanceApi';

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    ABSENT: 'bg-red-100 text-red-800',
    HALF_DAY: 'bg-orange-100 text-orange-800',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const LiveLog: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await attendanceApi.listLogs({ date: filterDate });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((l) =>
    !search || (l.employee_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
          />
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
        />
        <button 
            onClick={fetchLogs} 
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm group" 
            title="Refresh Logs"
        >
          <RefreshCw className={`w-5 h-5 group-active:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-orange-500' : 'text-gray-500'}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Synchronizing Logs...</span>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase text-gray-400 font-semibold tracking-[0.15em]">
                <tr>
                  <th className="px-6 py-5">Employee</th>
                  <th className="px-6 py-5">Log Date</th>
                  <th className="px-6 py-5">Clock In</th>
                  <th className="px-6 py-5">Clock Out</th>
                  <th className="px-6 py-5">Network IP</th>
                  <th className="px-6 py-5 text-center">Outcome</th>
                  <th className="px-6 py-5">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-semibold text-xs text-xs italic">No check-in entries found.</td></tr>
                ) : filtered.map((log) => (
                  <tr key={log.id} className={`group transition-all duration-200 hover:bg-gray-50/80 ${log.is_suspicious ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{log.employee_name || 'Anonymous'}</p>
                      <p className="text-[10px] font-semibold text-gray-400 tracking-wide">#{log.employee_code}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{log.date}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">{fmt(log.clock_in_timestamp)}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">{fmt(log.clock_out_timestamp)}</td>
                    <td className="px-6 py-4">
                        <code className="text-[10px] bg-gray-100 px-2 py-1 rounded-lg text-gray-500 font-semibold">{log.clock_in_ip || '---'}</code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold text-sm tracking-wide shadow-sm border ${statusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.is_suspicious ? (
                        <div title={log.suspicious_reason} className="flex items-center gap-1.5 text-red-600 text-[10px] font-semibold text-sm tracking-wide cursor-help bg-red-100/50 px-2 py-1 rounded-lg border border-red-200 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5" /> Suspect
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold text-green-500 tracking-wide px-2 py-1 bg-green-50 border border-green-100 rounded-lg w-fit">Verified</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wide">Real-time Telemetry Data</span>
            <span className="text-[10px] font-semibold text-gray-400 tracking-wide">Showing {filtered.length} logs</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLog;
