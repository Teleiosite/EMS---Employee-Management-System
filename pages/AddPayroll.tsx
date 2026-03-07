import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { employeesApi } from '../services/employeesApi';
import { payrollApi } from '../services/payrollApi';
import { useToast } from '../context/ToastContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentDate = new Date();

const AddPayroll: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [employees, setEmployees] = useState<{ id: string; name: string; baseSalary: number; employeeId: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active employees to preview who will be included
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await employeesApi.list();
        setEmployees(
          data
            .filter((e) => e.status === 'ACTIVE')
            .map((e) => ({ id: e.id, name: e.name, baseSalary: e.baseSalary, employeeId: e.employeeId }))
        );
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError('Could not load employees. Please try again.');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employees.length === 0) {
      setError('No active employees found. Please add employees before creating a payroll run.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Month is 0-indexed from state so getting its real index + 1
      const monthIndex = MONTHS.indexOf(month) + 1;
      const monthStr = `${year}-${String(monthIndex).padStart(2, '0')}-01`;
      await payrollApi.createRun({ month: monthStr });
      showToast(`Payroll for ${month} ${year} created! Payslips generated for ${employees.length} employees.`, 'success');
      navigate('/admin/payroll');
    } catch (err: any) {
      setError(err.message || 'Failed to create payroll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPayroll = employees.reduce((sum, e) => sum + e.baseSalary, 0);
  const estimatedDeductions = Math.round(totalPayroll * 0.15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create Payroll Run</h1>
        <p className="text-gray-500 mt-1">Generate payslips for all active employees for a given month.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  min={2020}
                  max={2099}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-orange-700">Payroll Summary</p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Employees included</span>
                <span className="font-medium">{loadingEmployees ? '...' : employees.length}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total gross salary</span>
                <span className="font-medium">${totalPayroll.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Estimated deductions (15%)</span>
                <span className="font-medium text-red-600">-${estimatedDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-orange-200 pt-2 mt-2">
                <span>Estimated net payout</span>
                <span className="text-green-600">${(totalPayroll - estimatedDeductions).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-4">
              <button
                type="submit"
                disabled={submitting || loadingEmployees || employees.length === 0}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Creating...' : `Create Payroll for ${month} ${year}`}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/payroll')}
                className="px-8 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Employee Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-700">Active Employees ({employees.length})</h2>
          </div>

          {loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading employees...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active employees found.</p>
              <p className="text-sm mt-1">Add at least one employee before creating a payroll run.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {employees.map((emp) => (
                <div key={emp.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.employeeId}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    ${emp.baseSalary.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPayroll;