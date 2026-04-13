import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, PlusCircle, Settings, ChevronRight } from 'lucide-react';

import { payrollApi } from '../services/payrollApi';
import { payrolls as mockPayrolls } from '../services/mockData';
import { PayrollRecord } from '../types';
import { useToast } from '../context/ToastContext';

// Sub-components
import PayslipTable from '../components/payroll/PayslipTable';
import SalaryComponentGrid from '../components/payroll/SalaryComponentGrid';
import SalaryComponentModal from '../components/payroll/SalaryComponentModal';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<'payslips' | 'components'>('payslips');
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Components State
  const [components, setComponents] = useState<any[]>([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [compFormData, setCompFormData] = useState({ name: '', component_type: 'EARNING' as 'EARNING' | 'DEDUCTION', description: '' });

  // Data Fetching
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
    if (activeTab === 'payslips') {
      fetchPayrolls();
    } else {
      fetchComponents();
    }
  }, [activeTab]);

  // Handlers
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingComp) {
        await payrollApi.updateSalaryComponent(editingComp.id, compFormData);
        showToast('Component updated successfully', 'success');
      } else {
        await payrollApi.saveSalaryComponent(compFormData);
        showToast('Component created successfully', 'success');
      }
      setShowCompModal(false);
      fetchComponents();
    } catch (err: any) {
      showToast(err.message || 'Failed to save component', 'error');
    }
  };

  const handleDeleteComponent = async (compId: number) => {
    if (!window.confirm('Permanent Action: Are you sure you want to delete this salary component?')) return;
    try {
      await payrollApi.deleteSalaryComponent(compId);
      showToast('Component removed', 'info');
      fetchComponents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete component', 'error');
    }
  };

  const handleDeletePayslip = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
    try {
      // Mock Data check - if the ID contains letters, it's local offline data, don't ping backend
      if (!isNaN(Number(id))) {
        await payrollApi.deletePayslip(id);
      }
      setPayrollData(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      showToast('Record deleted permanently', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

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
    if (window.confirm(`Process payment for ${selectedIds.length} employees?`)) {
      setPayrollData(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: 'Paid' as any } : p));
      const count = selectedIds.length;
      setSelectedIds([]);
      showToast(`Batch Success: Processed ${count} payments.`, 'success');
      setTimeout(() => showToast(`Payslip notifications dispatched to ${count} employees via email.`, 'email'), 800);
    }
  };

  const handleDownloadPayslip = async (id: string) => {
    try {
      if (isNaN(Number(id))) {
        showToast('Local offline payslips cannot be downloaded.', 'error');
        return;
      }
      
      const blob = await payrollApi.downloadPayslip(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Auto-attach specific filename based on data reference
      const record = payrollData.find(p => p.id === id);
      const month = record ? record.month : 'period';
      const year = record ? record.year : '2026';
      
      a.download = `payslip_${month}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay revocation by 1 second to avoid Chrome's metadata destruction bug
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (err: any) {
      showToast('Failed to download payslip.', 'error');
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            Payroll Console
            <ChevronRight className="w-6 h-6 text-orange-500" />
            <span className="text-gray-400 font-medium text-lg tracking-wide">
              {activeTab === 'payslips' ? 'Cycle Management' : 'Global Settings'}
            </span>
          </h1>
          {error && <p className="text-amber-600 text-xs font-bold mt-2 uppercase tracking-wide">Mode: {error}</p>}
        </div>
        
        <div className="flex gap-3">
          {activeTab === 'payslips' ? (
            <>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleProcessPayment}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all active:scale-95 animate-in slide-in-from-top-4"
                >
                  <CreditCard className="w-4 h-4" />
                  Process Batch ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => navigate('/admin/payroll/new')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> New Cycle
              </button>
            </>
          ) : (
            <button
              onClick={() => { setEditingComp(null); setCompFormData({ name: '', component_type: 'EARNING', description: '' }); setShowCompModal(true); }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" /> Add Component
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Modern Tab Design */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50/50 gap-2">
          <button
            onClick={() => setActiveTab('payslips')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-semibold uppercase text-sm tracking-wide tracking-[0.2em] transition-all ${
              activeTab === 'payslips' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            Monthly Payslips
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-semibold uppercase text-sm tracking-wide tracking-[0.2em] transition-all ${
              activeTab === 'components' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            Salary Definitions
          </button>
        </div>

        {activeTab === 'payslips' ? (
          <PayslipTable 
            loading={loading}
            data={payrollData}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onSelectAll={handleSelectAll}
            onEdit={(id) => {
               showToast('Payslips are dynamically generated! Switch to Salary Definitions to change amounts.', 'info')
            }}
            onDelete={handleDeletePayslip}
            onDownload={handleDownloadPayslip}
          />
        ) : (
          <SalaryComponentGrid 
            loading={loadingComps}
            components={components}
            onEdit={(comp) => {
              setEditingComp(comp);
              setCompFormData({ name: comp.name, component_type: comp.component_type, description: comp.description || '' });
              setShowCompModal(true);
            }}
            onDelete={handleDeleteComponent}
            onCreateNew={() => {
              setEditingComp(null);
              setCompFormData({ name: '', component_type: 'EARNING', description: '' });
              setShowCompModal(true);
            }}
          />
        )}
      </div>

      {/* Reusable Modal Component */}
      <SalaryComponentModal 
        show={showCompModal}
        editingComp={editingComp}
        formData={compFormData}
        setFormData={setCompFormData}
        onClose={() => setShowCompModal(false)}
        onSave={handleSaveComponent}
      />
    </div>
  );
};

export default Payroll;