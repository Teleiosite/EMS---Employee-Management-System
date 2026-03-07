import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Settings, Loader2, Save, RefreshCw } from 'lucide-react';
import { attendanceApi, AttendanceLog, AttendancePolicy } from '../services/attendanceApi';
import { useToast } from '../context/ToastContext';

type Tab = 'log' | 'suspicious' | 'settings';

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

// ─── Time Input Helper ───────────────────────────────────────────────────────
const TimeInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({
  label, value, onChange, hint,
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      type="time"
      value={value.slice(0, 5)}
      onChange={(e) => onChange(e.target.value + ':00')}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

// ─── Live Log Tab ────────────────────────────────────────────────────────────
const LiveLog: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = logs.filter((l) =>
    !search || (l.employee_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <button onClick={fetch} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No records for this date.</td></tr>
              ) : filtered.map((log) => (
                <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${log.is_suspicious ? 'bg-red-50' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{log.employee_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{log.employee_code}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{log.date}</td>
                  <td className="px-5 py-3 text-gray-600">{fmt(log.clock_in_timestamp)}</td>
                  <td className="px-5 py-3 text-gray-600">{fmt(log.clock_out_timestamp)}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{log.clock_in_ip || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {log.is_suspicious && (
                      <span title={log.suspicious_reason} className="flex items-center gap-1 text-red-600 text-xs font-medium cursor-help">
                        <AlertTriangle className="w-4 h-4" /> Suspicious
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Suspicious Activity Tab ─────────────────────────────────────────────────
const SuspiciousActivity: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi.listSuspicious().then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">
          These records were automatically flagged because the employee used an unrecognised device and IP address at the same time, or multiple employees clocked in from the same IP within 5 minutes.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3">Device ID</th>
                <th className="px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    ✅ No suspicious activity detected.
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="bg-red-50 hover:bg-red-100 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{log.employee_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{log.employee_code}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{log.date}</td>
                  <td className="px-5 py-3 text-gray-600">{fmt(log.clock_in_timestamp)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{log.clock_in_ip || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{log.device_fingerprint || '—'}</td>
                  <td className="px-5 py-3 text-red-700 text-xs max-w-xs">{log.suspicious_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Settings Tab ────────────────────────────────────────────────────────────
const AttendanceSettings: React.FC = () => {
  const { showToast } = useToast();
  const [policy, setPolicy] = useState<Partial<AttendancePolicy>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    attendanceApi.getPolicy()
      .then(setPolicy)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof AttendancePolicy, val: string | number) =>
    setPolicy((p) => ({ ...p, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await attendanceApi.updatePolicy(policy);
      setPolicy(updated);
      showToast('Attendance policy saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Check-In Window
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Opens at" value={policy.check_in_start || '07:00:00'} onChange={(v) => set('check_in_start', v)} hint="Earliest allowed sign-in" />
          <TimeInput label="On-time deadline" value={policy.check_in_end || '09:00:00'} onChange={(v) => set('check_in_end', v)} hint="After this + grace = LATE" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Late grace period (minutes)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={policy.late_grace_minutes ?? 15}
              onChange={(e) => set('late_grace_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <p className="text-xs text-gray-400">Minutes after deadline before status = LATE</p>
          </div>
          <TimeInput label="Absent if no sign-in by" value={policy.absent_if_no_checkin_by || '11:00:00'} onChange={(v) => set('absent_if_no_checkin_by', v)} hint="After this time = ABSENT" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Check-Out Window
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Half-day if sign-out before" value={policy.half_day_if_checkout_before || '13:00:00'} onChange={(v) => set('half_day_if_checkout_before', v)} hint="Early checkout = HALF_DAY" />
          <TimeInput label="Check-out opens at" value={policy.check_out_start || '16:00:00'} onChange={(v) => set('check_out_start', v)} hint="Earliest sign-out allowed" />
        </div>
        <TimeInput label="Expected end of work day" value={policy.check_out_end || '18:00:00'} onChange={(v) => set('check_out_end', v)} hint="For reporting purposes" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Policy'}
      </button>
    </div>
  );
};

// ─── Main Admin Page ─────────────────────────────────────────────────────────
const AdminAttendance: React.FC = () => {
  const [tab, setTab] = useState<Tab>('log');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'log', label: 'Live Log', icon: <Shield className="w-4 h-4" /> },
    { id: 'suspicious', label: '⚠️ Suspicious Activity', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'settings', label: 'Attendance Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Attendance Monitoring</h1>
        <p className="text-gray-500 mt-1">Monitor employee check-ins, suspicious activity, and configure attendance rules.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'log' && <LiveLog />}
      {tab === 'suspicious' && <SuspiciousActivity />}
      {tab === 'settings' && <AttendanceSettings />}
    </div>
  );
};

export default AdminAttendance;