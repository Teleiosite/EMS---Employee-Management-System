import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, History, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { LeaveRequest, User } from '../types';
import { useToast } from '../context/ToastContext';
import { employeesApi } from '../services/employeesApi';
import { leavesApi, LeaveType } from '../services/leavesApi';

const EmployeeLeaves: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPLY' | 'HISTORY'>('APPLY');
  const [user, setUser] = useState<User | null>(null);
  const [employeeProfileId, setEmployeeProfileId] = useState<string>('');
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ typeId: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    const boot = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const currentUser: User = JSON.parse(storedUser);
      setUser(currentUser);
      setLoading(true);
      setError(null);
      try {
        const [profiles, requests, types] = await Promise.all([
          employeesApi.list(),
          leavesApi.listRequests(),
          leavesApi.listTypes(),
        ]);
        const profile = profiles.find((p) => p.userId === currentUser.id);
        if (profile) {
          setEmployeeProfileId(profile.id);
          setMyLeaves(requests.filter((l) => l.employeeId === profile.id));
        }
        setLeaveTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leave data');
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const durationDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [formData.endDate, formData.startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeProfileId || !formData.typeId) return;

    setLoading(true);
    setError(null);
    try {
      const created = await leavesApi.createRequest({
        employee: Number(employeeProfileId),
        leave_type: Number(formData.typeId),
        start_date: formData.startDate,
        end_date: formData.endDate,
        duration_days: durationDays,
        reason: formData.reason,
      });

      setMyLeaves((prev) => [created, ...prev]);
      setFormData({ typeId: '', startDate: '', endDate: '', reason: '' });
      setActiveTab('HISTORY');
      showToast('Leave request submitted successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit leave request';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <p className="text-gray-500">Apply for new leave or view your leave history.</p>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setActiveTab('APPLY')} className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium ${activeTab === 'APPLY' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}><Plus className="w-4 h-4" /> Apply Leave</button>
        <button onClick={() => setActiveTab('HISTORY')} className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium ${activeTab === 'HISTORY' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}><History className="w-4 h-4" /> Leave History</button>
      </div>

      {activeTab === 'APPLY' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <select required value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="">Select Leave Type</option>
              {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <textarea rows={4} required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Reason" />
            <button disabled={loading || durationDays <= 0} type="submit" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-lg font-medium">{loading ? 'Submitting...' : 'Submit Request'}</button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {loading ? <p>Loading...</p> : (
            <div className="space-y-4">
              {myLeaves.map((leave) => (
                <div key={leave.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800">{leave.type}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1"><Calendar className="w-4 h-4" /> {leave.startDate} to {leave.endDate}</div>
                    <div className="text-sm text-gray-600 mt-2">{leave.reason}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {leave.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : leave.status === 'REJECTED' ? <XCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {leave.status}
                  </span>
                </div>
              ))}
              {myLeaves.length === 0 && <p className="text-gray-500">No leave history yet.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
