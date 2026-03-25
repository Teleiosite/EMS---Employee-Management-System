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

  const handleDeleteComponent = async (compId: number) => {
    if (!window.confirm('Are you sure you want to delete this salary component?')) return;
    try {
        await payrollApi.deleteSalaryComponent(compId);
        showToast('Component deleted', 'info');
        fetchComponents();
    } catch (err: any) {
        showToast(err.message || 'Failed to delete component', 'error');
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) {
      return;
    }

    setActiveActionId(null); // Close the action menu immediately

    try {
      await payrollApi.deletePayslip(id);
      setPayrollData(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      showToast('Payroll record deleted', 'info');
    } catch (err: any) {
      console.error('Failed to delete payroll record:', err);
      showToast(err.message || 'Failed to delete payroll record', 'error');
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

          <div className="p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {components.map((comp) => {
                    const isEarning = comp.component_type === 'EARNING';
                    return (
                        <div key={comp.id} className="relative group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-orange-100 hover:-translate-y-1">
                            {/* Decorative Background Icon */}
                            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0`}>
                                {isEarning ? <PlusCircle className="w-32 h-32 text-green-600" /> : <Settings className="w-32 h-32 text-red-600" />}
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${isEarning ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {isEarning ? <PlusCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                        isEarning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {comp.component_type}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{comp.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed mb-6">{comp.description || 'Global salary component for payroll generation.'}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Used in Structures</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => { 
                                                setEditingComp(comp); 
                                                setCompFormData({ name: comp.name, component_type: comp.component_type, description: comp.description || '' }); 
                                                setShowCompModal(true); 
                                            }}
                                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" onClick={() => handleDeleteComponent(comp.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {components.length === 0 && !loadingComps && (
                <div className="text-center py-32 bg-gray-50/50 rounded-[3rem] border-4 border-dashed border-gray-100">
                    <div className="relative inline-block mb-6">
                        <Settings className="w-20 h-20 text-gray-200 animate-pulse" />
                        <PlusCircle className="w-8 h-8 text-orange-400 absolute -bottom-2 -right-2 bg-white rounded-full shadow-lg" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter mb-2">No Components Defined</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto mb-8">Ready to start configuring? Create your first global salary component now!</p>
                    <button 
                        onClick={() => { setEditingComp(null); setCompFormData({ name: '', component_type: 'EARNING', description: '' }); setShowCompModal(true); }}
                        className="bg-white text-orange-600 font-bold px-8 py-3 rounded-2xl shadow-xl shadow-orange-500/10 border border-orange-100 hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 mx-auto"
                    >
                        <Plus className="w-5 h-5" /> Start Configuration
                    </button>
                </div>
            )}
            {loadingComps && (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                    <span className="text-gray-400 font-black uppercase tracking-widest text-xs">Fetching Definitions...</span>
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
                    <div className="p-6 space-y-5">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Quick Select Templates</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { name: 'Housing', type: 'EARNING' },
                                    { name: 'Transport', type: 'EARNING' },
                                    { name: 'Pension', type: 'DEDUCTION' },
                                    { name: 'Income Tax', type: 'DEDUCTION' }
                                ].map(template => (
                                    <button
                                        key={template.name}
                                        type="button"
                                        onClick={() => setCompFormData({ ...compFormData, name: template.name, component_type: template.type as any })}
                                        className="px-3 py-1.5 rounded-xl border border-gray-100 bg-white text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm"
                                    >
                                        + {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Component Name</label>
                            <input
                                required
                                value={compFormData.name}
                                onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                                placeholder="e.g. Housing Allowance"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Component Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCompFormData({ ...compFormData, component_type: 'EARNING' })}
                                    className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                                        compFormData.component_type === 'EARNING' 
                                        ? 'border-green-500 bg-green-50 text-green-700 shadow-lg shadow-green-500/10' 
                                        : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'
                                    }`}
                                >
                                    Earning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompFormData({ ...compFormData, component_type: 'DEDUCTION' })}
                                    className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                                        compFormData.component_type === 'DEDUCTION' 
                                        ? 'border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-500/10' 
                                        : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-100'
                                    }`}
                                >
                                    Deduction
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description (Optional)</label>
                            <textarea
                                value={compFormData.description}
                                onChange={(e) => setCompFormData({ ...compFormData, description: e.target.value })}
                                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none h-24 resize-none transition-all text-sm font-medium text-gray-600"
                                placeholder="Describe the purpose of this component..."
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