import React, { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, ShieldCheck, LogOut } from 'lucide-react';
import { AttendanceLog, User } from '../types';
import { attendanceApi } from '../services/attendanceApi';
import { employeesApi } from '../services/employeesApi';

const Attendance: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfileId, setEmployeeProfileId] = useState<string>('');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [actionStatus, setActionStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const simulatedIp = '203.0.113.50';

  useEffect(() => {
    const load = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const u: User = JSON.parse(storedUser);
      setUser(u);
      try {
        const profiles = await employeesApi.list();
        const profile = profiles.find((p) => p.userId === u.id);
        if (!profile) {
          setError('Employee profile not found.');
          return;
        }
        setEmployeeProfileId(profile.id);
        const userLogs = await attendanceApi.list({ employee: profile.id });
        setLogs(userLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attendance');
      }
    };
    load();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = useMemo(() => logs.find((log) => log.date === todayStr), [logs, todayStr]);

  const handleAttendanceAction = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!employeeProfileId) return;
    setActionStatus('PROCESSING');
    setError(null);
    try {
      if (type === 'CHECK_IN') {
        const created = await attendanceApi.clockIn(employeeProfileId);
        setLogs((prev) => [created, ...prev]);
      } else if (todayLog) {
        const updated = await attendanceApi.clockOut(todayLog.id);
        setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      }
      setActionStatus('SUCCESS');
      setTimeout(() => setActionStatus('IDLE'), 1500);
    } catch (err) {
      setActionStatus('ERROR');
      setError(err instanceof Error ? err.message : 'Failed to update attendance');
    }
  };

  const isCheckedIn = !!todayLog;
  const isCheckedOut = !!todayLog?.clockOutTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500">Manage daily attendance and view logs.</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Daily Action</h2>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="relative">
              <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center bg-gray-50 ${isCheckedIn && !isCheckedOut ? 'border-green-100' : 'border-gray-100'}`}>
                <div className="text-center">
                  <span className="text-3xl font-mono font-bold text-gray-700 block">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-xs text-gray-400 font-medium uppercase mt-1">Current Time</span>
                </div>
              </div>
              {isCheckedIn && !isCheckedOut && <div className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full border-4 border-white"><ShieldCheck className="w-6 h-6" /></div>}
            </div>

            <div className="w-full space-y-3">
              {!isCheckedIn && <button onClick={() => handleAttendanceAction('CHECK_IN')} disabled={actionStatus === 'PROCESSING'} className="w-full py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 flex items-center justify-center gap-2">{actionStatus === 'PROCESSING' ? 'Processing...' : <><Clock className="w-5 h-5" /> Check In</>}</button>}
              {isCheckedIn && !isCheckedOut && <button onClick={() => handleAttendanceAction('CHECK_OUT')} disabled={actionStatus === 'PROCESSING'} className="w-full py-3 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-70 flex items-center justify-center gap-2">{actionStatus === 'PROCESSING' ? 'Processing...' : <><LogOut className="w-5 h-5" /> Check Out</>}</button>}
              {isCheckedOut && <div className="w-full py-3 rounded-lg font-bold text-gray-500 bg-gray-100 text-center border">Day Completed</div>}
            </div>

            <div className="text-sm text-gray-500 space-y-2 w-full">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" /> Location IP</span>
                <span className="font-mono text-xs bg-white border px-2 py-1 rounded">{simulatedIp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">My Attendance History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="pb-3">Date</th><th className="pb-3">Check In</th><th className="pb-3">Check Out</th><th className="pb-3">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="text-sm hover:bg-gray-50"><td className="py-3">{log.date}</td><td className="py-3">{log.clockInTime || '--:--'}</td><td className="py-3">{log.clockOutTime || '--:--'}</td><td className="py-3">{log.status}</td></tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-400">No history available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
