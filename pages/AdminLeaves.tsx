import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { leaves as initialLeaves } from '../services/mockData';
import { LeaveRequest } from '../types';
import { useToast } from '../context/ToastContext';

const AdminLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const { showToast } = useToast();

  useEffect(() => {
    // In a real app, fetch from API
    setLeaves([...initialLeaves]);
  }, []);

  const handleAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) {
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      
      // Update mock db
      const index = initialLeaves.findIndex(l => l.id === id);
      if (index !== -1) {
        initialLeaves[index].status = status;
      }
      
      showToast(`Leave request marked as ${status}`, 'success');
      setTimeout(() => {
          showToast(`Status update email sent to employee.`, 'email');
      }, 500);
    }
  };

  const filteredLeaves = leaves.filter(leave => filter === 'ALL' || leave.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-500">Review and manage employee leave requests.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
           {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                 filter === f 
                 ? 'bg-orange-100 text-orange-700 shadow-sm' 
                 : 'text-gray-500 hover:bg-gray-50'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{leave.employeeName}</div>
                    <div className="text-xs text-gray-500">Applied: {leave.appliedOn}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{leave.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col">
                         <span className="font-medium">{leave.startDate}</span>
                         <span className="text-xs text-gray-400">to {leave.endDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{leave.reason}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                         leave.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                         'bg-yellow-100 text-yellow-800'
                       }`}>
                         {leave.status}
                       </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {leave.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(leave.id, 'APPROVED')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleAction(leave.id, 'REJECTED')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {leave.status !== 'PENDING' && (
                      <span className="text-xs text-gray-400 italic">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-8 text-center text-gray-500">No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaves;