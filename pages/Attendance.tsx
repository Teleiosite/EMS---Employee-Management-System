import React, { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, Clock, Calendar, AlertTriangle, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { attendanceApi, AttendanceStatus, AttendanceLog } from '../services/attendanceApi';
import { useToast } from '../context/ToastContext';

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

const Attendance: React.FC = () => {
  const { showToast } = useToast();
  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'in' | 'out' | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'got' | 'denied'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [status, logs] = await Promise.all([
        attendanceApi.getStatus(),
        attendanceApi.listLogs(),
      ]);
      setTodayStatus(status);
      setHistory(logs.slice(0, 30));
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClockIn = async () => {
    setActing('in');
    setGpsStatus('getting');
    try {
      const res = await attendanceApi.clockIn();
      setGpsStatus('got');
      let msg = res.detail;
      if (res.distance_from_office != null) {
        msg += ` (${Math.round(res.distance_from_office)}m from office)`;
      }
      showToast(msg, 'success');
      if (res.is_suspicious) {
        showToast('⚠️ Suspicious sign-in detected and flagged for admin review.', 'info');
      }
      await fetchData();
    } catch (err: any) {
      setGpsStatus('denied');
      showToast(err.message || 'Clock-in failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleClockOut = async () => {
    setActing('out');
    try {
      const res = await attendanceApi.clockOut();
      const h = Math.floor(res.working_minutes / 60);
      const m = res.working_minutes % 60;
      showToast(`${res.detail} (${h}h ${m}m worked)`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Clock-out failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const log = todayStatus?.log;
  const hasClockedIn = !!log?.clock_in;
  const hasClockedOut = !!log?.clock_out;
  const windowOpen = todayStatus?.window_open ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500 mt-1">Track your daily check-ins and working hours.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Clock-in / Clock-out card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Live time */}
              <div className="text-center md:text-left">
                <p className="text-5xl font-bold text-gray-800 tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-gray-500 mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className={`text-sm mt-2 font-medium ${windowOpen ? 'text-green-600' : 'text-amber-600'}`}>
                  {todayStatus?.window_message}
                </p>
              </div>

              {/* Today's summary */}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Check In</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{fmt(log?.clock_in ?? null)}</p>
                </div>
                <div className="h-12 w-px bg-gray-200 self-center" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Check Out</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{fmt(log?.clock_out ?? null)}</p>
                </div>
                {log?.status && (
                  <>
                    <div className="h-12 w-px bg-gray-200 self-center" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleClockIn}
                  disabled={hasClockedIn || !windowOpen || acting === 'in'}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                >
                  {acting === 'in' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {acting === 'in' && gpsStatus === 'getting' ? 'Getting location…' : hasClockedIn ? 'Signed In ✓' : 'Sign In'}
                </button>
                {/* GPS status */}
                {gpsStatus !== 'idle' && (
                  <p className={`text-xs flex items-center gap-1 ${gpsStatus === 'denied' ? 'text-red-500' : gpsStatus === 'got' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                    <MapPin className="w-3 h-3" />
                    {gpsStatus === 'getting' && 'Getting your location…'}
                    {gpsStatus === 'got' && 'Location confirmed ✓'}
                    {gpsStatus === 'denied' && 'Location unavailable — enable in browser settings'}
                  </p>
                )}
                <button
                  onClick={handleClockOut}
                  disabled={!hasClockedIn || hasClockedOut || acting === 'out'}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                >
                  {acting === 'out' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                  {hasClockedOut ? 'Signed Out ✓' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>

          {/* Policy info */}
          {todayStatus?.policy && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Sign-in window: <strong>{todayStatus.policy.check_in_start.slice(0, 5)} – {todayStatus.policy.absent_if_no_checkin_by.slice(0, 5)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>Late after: <strong>{todayStatus.policy.check_in_end.slice(0, 5)}</strong> (+{todayStatus.policy.late_grace_minutes} min grace)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Sign-out opens: <strong>{todayStatus.policy.check_out_start.slice(0, 5)}</strong></span>
              </div>
            </div>
          )}

          {/* History table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-700">Recent Attendance History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Check In</th>
                    <th className="px-6 py-3">Check Out</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No attendance records yet.</td></tr>
                  ) : history.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{row.date}</td>
                      <td className="px-6 py-3 text-gray-600">{fmt(row.clock_in_timestamp)}</td>
                      <td className="px-6 py-3 text-gray-600">{fmt(row.clock_out_timestamp)}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;