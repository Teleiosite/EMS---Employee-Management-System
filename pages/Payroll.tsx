import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, MoreVertical, Edit, Trash2, Plus, CreditCard, CheckSquare, Square } from 'lucide-react';
import { payrolls } from '../services/mockData';
import { useToast } from '../context/ToastContext';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [payrollData, setPayrollData] = useState(payrolls);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleCreate = () => {
    navigate('/payroll/new');
  };

  const handleEdit = (id: string) => {
    setActiveActionId(null);
    navigate(`/payroll/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    setActiveActionId(null);
    if (window.confirm("Are you sure you want to delete this payroll record?")) {
      setPayrollData(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      
      const index = payrolls.findIndex(p => p.id === id);
      if (index > -1) {
        payrolls.splice(index, 1);
      }
      showToast('Payroll record deleted', 'info');
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(payrollData.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleProcessPayment = () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(`Are you sure you want to process payment for ${selectedIds.length} employees?`)) {
      // Update local state
      setPayrollData(prev => prev.map(p => {
        if (selectedIds.includes(p.id)) {
          return { ...p, status: 'Paid' };
        }
        return p;
      }));

      // Update mock data for persistence
      selectedIds.forEach(id => {
        const record = payrolls.find(p => p.id === id);
        if (record) {
          record.status = 'Paid';
        }
      });
      
      const count = selectedIds.length;
      setSelectedIds([]);
      showToast(`Successfully processed ${count} payments.`, 'success');
      
      setTimeout(() => {
        showToast(`Payslip email notifications sent to ${count} employees.`, 'email');
      }, 800);
    }
  };

  const isAllSelected = payrollData.length > 0 && selectedIds.length === payrollData.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Processing</h1>
          <p className="text-gray-500">Generate and manage monthly salary slips.</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleProcessPayment}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors animate-fade-in"
            >
              <CreditCard className="w-4 h-4" /> 
              Process Payment ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Payroll
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-20">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">August 2025 Cycle</h2>
          <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">Processing</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Base Salary</th>
                <th className="px-6 py-4">Deductions</th>
                <th className="px-6 py-4">Net Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollData.map((record) => {
                 const isSelected = selectedIds.includes(record.id);
                 return (
                  <tr key={record.id} className={`transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(record.id)}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{record.name}</div>
                      <div className="text-xs text-gray-500">ID: {record.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.designation}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${record.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-${record.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">${record.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {record.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <div className="flex justify-center items-center gap-3">
                         <button className="text-gray-500 hover:text-blue-600 tooltip transition-colors" title="Download PDF">
                            <Download className="w-5 h-5" />
                         </button>
                         <button className="text-gray-500 hover:text-gray-800 tooltip transition-colors" title="Print Payslip">
                            <Printer className="w-5 h-5" />
                         </button>
                         
                         <div className="relative">
                            <button 
                              onClick={() => toggleActionMenu(record.id)}
                              className={`p-1 rounded-full transition-colors ${activeActionId === record.id ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {activeActionId === record.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveActionId(null)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100 transform origin-top-right text-left">
                                  <button 
                                    onClick={() => handleEdit(record.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" /> Edit
                                  </button>
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button 
                                    onClick={() => handleDelete(record.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                         </div>
                      </div>
                    </td>
                  </tr>
                 );
              })}
              {payrollData.length === 0 && (
                <tr>
                   <td colSpan={8} className="text-center py-8 text-gray-500">No payroll records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
           <span className="text-sm text-gray-500">Showing {payrollData.length} entries</span>
        </div>
      </div>
    </div>
  );
};

export default Payroll;