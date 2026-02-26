import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { payrollApi } from '../services/payrollApi';

const AddPayroll: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ month: new Date().toISOString().slice(0, 7), status: 'DRAFT' as 'DRAFT' | 'PROCESSING' | 'COMPLETED' });

  useEffect(() => {
    if (!isEditMode || !id) return;
    payrollApi.getRun(id).then((run) => {
      const monthIndex = new Date(`${run.month} 1, ${run.year}`).getMonth() + 1;
      setFormData({ month: `${run.year}-${String(monthIndex).padStart(2, '0')}`, status: run.status as 'DRAFT' | 'PROCESSING' | 'COMPLETED' });
    }).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load payroll run'));
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditMode && id) {
        await payrollApi.updateRunStatus(id, formData.status);
      } else {
        await payrollApi.createRun({ month: `${formData.month}-01` });
      }
      navigate('/admin/payroll');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payroll run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Payroll Run' : 'Create Payroll Run'}</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Month</label>
            <input type="month" value={formData.month} onChange={(e) => setFormData((p) => ({ ...p, month: e.target.value }))} className="w-full px-4 py-2 border rounded-lg" disabled={isEditMode} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))} className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="DRAFT">DRAFT</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <button disabled={loading} type="submit" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-lg font-medium">{loading ? 'Saving...' : isEditMode ? 'Update Payroll Run' : 'Create Payroll Run'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddPayroll;
