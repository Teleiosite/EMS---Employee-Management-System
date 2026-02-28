import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { leavesApi } from '../services/leavesApi';
import { LeaveRequest, User } from '../types';
import { useToast } from '../context/ToastContext';

const EmployeeLeaves: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPLY' | 'HISTORY'>('APPLY');
  const [user, setUser] = useState<User | null>(null);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const leavesList = await leavesApi.listRequests();
      setMyLeaves(leavesList);
    } catch (err) {
      console.error('Failed to load leaves', err);
      showToast('Failed to load your leave history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchLeaves();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const diffTime = Math.abs(new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

      // Let's assume we use leave_type = 1 as general/default for now since the frontend form is just a text input
      // Ideally we should have a dropdown for leave types. 
      const types = await leavesApi.listTypes();
      const fallBackTypeId = types.length > 0 ? parseInt(types[0].id) : 1;

      const newLeave = await leavesApi.createRequest({
        employee: parseInt(user.id),
        leave_type: fallBackTypeId, // Defaulting to the first available leave type
        start_date: formData.startDate,
        end_date: formData.endDate,
        duration_days: diffDays,
        reason: formData.reason
      });

      setMyLeaves(prev => [newLeave, ...prev]);
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      setActiveTab('HISTORY');

      showToast('Leave request submitted successfully!', 'success');

      setTimeout(() => {
        showToast(`Email notification sent to HR Manager regarding your request.`, 'email');
      }, 1000);
      setTimeout(() => {
        showToast(`Confirmation email sent to ${user.email}.`, 'email');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit leave', err);
      showToast(err.message || 'Failed to submit leave request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">Apply for new leave or view your leave history.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('APPLY')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'APPLY'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'HISTORY'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <History className="w-4 h-4" /> Leave History
        </button>
      </div>

      {activeTab === 'APPLY' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Leave Type</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g. Sick Leave, Casual Leave"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <textarea
                rows={4}
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please describe the reason for your leave..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-4">Applied On</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{leave.appliedOn}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{leave.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span>From: {leave.startDate}</span>
                        <span>To: {leave.endDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {leave.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {leave.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                        {leave.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myLeaves.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No leave history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;