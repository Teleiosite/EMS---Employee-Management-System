import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, MoreVertical, Edit, Trash2, Plus, CreditCard, Loader2, Settings, PlusCircle, Save, X } from 'lucide-react';

import { payrollApi } from '../services/payrollApi';
import { payrolls as mockPayrolls } from '../services/mockData';
import { PayrollRecord } from '../types';
import { useToast } from '../context/ToastContext';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Tabs
  const [activeTab, setActiveTab] = useState<'payslips' | 'components'>('payslips');

  // Components State
  const [components, setComponents] = useState<any[]>([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [compFormData, setCompFormData] = useState({ name: '', component_type: 'EARNING', description: '' });


  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await payrollApi.listPayslips();
        setPayrollData(data);
      } catch (err) {
        console.warn('Failed to fetch from API, using mock data:', err);
        setPayrollData([...mockPayrolls]);
        setError('Using offline data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
  }, []);

  const fetchComponents = async () => {
    setLoadingComps(true);
    try {
        const data = await payrollApi.listSalaryComponents();
        setComponents(data);
    } catch (err) {
        console.error('Failed to fetch components', err);
    } finally {
        setLoadingComps(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'components') {
        fetchComponents();
    }
  }, [activeTab]);

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (editingComp) {
            await payrollApi.updateSalaryComponent(editingComp.id, compFormData);
            showToast('Component updated', 'success');
        } else {
            await payrollApi.saveSalaryComponent(compFormData);
            showToast('Component created', 'success');
        }
        setShowCompModal(false);
        setEditingComp(null);
        setCompFormData({ name: '', component_type: 'EARNING', description: '' });
        fetchComponents();
    } catch (err: any) {
        showToast(err.message || 'Failed to save component', 'error');
    }
  };


  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleCreate = () => {
    navigate('/admin/payroll/new');
  };

  const handleEdit = (id: string) => {
    setActiveActionId(null);
    navigate(`/admin/payroll/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this payroll record?")) {
      setActiveActionId(null);
      setPayrollData(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
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
          <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
          <p className="text-gray-500">Configure salary components and generate monthly slips.</p>

          {error && (
            <p className="text-amber-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <div className="flex gap-3">
          {activeTab === 'payslips' ? (
            <>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors animate-fade-in"
                >
                  <CreditCard className="w-4 h-4" />
                  Process Payment ({selectedIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={handleCreate}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Payroll
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setEditingComp(null); setCompFormData({ name: '', component_type: 'EARNING', description: '' }); setShowCompModal(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> New Component
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('payslips')}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'payslips' ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Monthly Payslips
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
              activeTab === 'components' ? 'border-orange-500 text-orange-600 bg-orange-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Salary Components
          </button>
        </div>

        {activeTab === 'payslips' ? (
          <div className="pb-20">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
              <h2 className="font-semibold text-gray-700">Payroll Cycle Overview</h2>
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">Processing</span>
            </div>


        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-gray-500">Loading payroll records...</span>
          </div>
        ) : (
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <div className="flex justify-center items-center gap-3">
                          <button type="button" className="text-gray-500 hover:text-blue-600 tooltip transition-colors" title="Download PDF">
                            <Download className="w-5 h-5" />
                          </button>
                          <button type="button" className="text-gray-500 hover:text-gray-800 tooltip transition-colors" title="Print Payslip">
                            <Printer className="w-5 h-5" />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
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
                                    type="button"
                                    onClick={() => handleEdit(record.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" /> Edit
                                  </button>
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(record.id);
                                    }}
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
        )}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
          <span className="text-sm text-gray-500">Showing {payrollData.length} entries</span>
        </div>
      </div>
    ) : (

          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {components.map((comp) => (
                    <div key={comp.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all hover:shadow-lg hover:border-orange-200 group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                comp.component_type === 'EARNING' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {comp.component_type}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => { setEditingComp(comp); setCompFormData({ name: comp.name, component_type: comp.component_type, description: comp.description || '' }); setShowCompModal(true); }}
                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-white rounded-lg shadow-sm transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{comp.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{comp.description || 'No description provided.'}</p>
                    </div>
                ))}
            </div>
            {components.length === 0 && !loadingComps && (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No salary components defined yet.</p>
                </div>
            )}
            {loadingComps && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            )}
          </div>
        )}
      </div>

      {/* Component Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSaveComponent}>
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">{editingComp ? 'Edit Component' : 'New Salary Component'}</h3>
                        <button type="button" onClick={() => setShowCompModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Component Name</label>
                            <input
                                required
                                value={compFormData.name}
                                onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="e.g. Housing Allowance"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCompFormData({ ...compFormData, component_type: 'EARNING' })}
                                    className={`py-2 px-4 rounded-xl border-2 font-bold transition-all ${
                                        compFormData.component_type === 'EARNING' 
                                        ? 'border-green-500 bg-green-50 text-green-700' 
                                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                                >
                                    Earning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompFormData({ ...compFormData, component_type: 'DEDUCTION' })}
                                    className={`py-2 px-4 rounded-xl border-2 font-bold transition-all ${
                                        compFormData.component_type === 'DEDUCTION' 
                                        ? 'border-red-500 bg-red-50 text-red-700' 
                                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                                >
                                    Deduction
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description (Optional)</label>
                            <textarea
                                value={compFormData.description}
                                onChange={(e) => setCompFormData({ ...compFormData, description: e.target.value })}
                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none h-20 resize-none"
                                placeholder="Details about this component..."
                            />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                        <button type="submit" className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Component
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>

  );
};

export default Payroll;