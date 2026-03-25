import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Users, CheckSquare, Square } from 'lucide-react';
import { employeesApi } from '../services/employeesApi';
import { payrollApi } from '../services/payrollApi';
import { useToast } from '../context/ToastContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentDate = new Date();

interface Employee {
  id: string;
  name: string;
  baseSalary: number;
  employeeId: string;
  salaryStructure?: any;
}

const AddPayroll: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await employeesApi.list();
        console.log('Fetched employees list:', data);
        const active = data
          .filter((e) => e.status === 'ACTIVE')
          .map((e) => {
            console.log(`Processing employee ${e.name} salary structure:`, e.salaryStructure);
            return { 
              id: e.id, 
              name: e.name, 
              baseSalary: e.baseSalary, 
              employeeId: e.employeeId,
              salaryStructure: e.salaryStructure
            };
          });
        setEmployees(active);
        // Select all by default
        setSelectedIds(new Set(active.map((e) => e.id)));
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError('Could not load employees. Please try again.');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  const isAllSelected = employees.length > 0 && selectedIds.size === employees.length;
  const isNoneSelected = selectedIds.size === 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedEmployees = employees.filter((e) => selectedIds.has(e.id));
  const totalPayroll = selectedEmployees.reduce((sum, e) => sum + e.baseSalary, 0);
  
  const totalDeductions = selectedEmployees.reduce((sum, e) => {
    if (!e.salaryStructure || !e.salaryStructure.components) return sum;
    const itemDeductions = e.salaryStructure.components
      .filter((c: any) => c.component_type === 'DEDUCTION')
      .reduce((s: number, c: any) => s + (parseFloat(c.value) || 0), 0);
    return sum + itemDeductions;
  }, 0);

  const totalEarnings = selectedEmployees.reduce((sum, e) => {
    if (!e.salaryStructure || !e.salaryStructure.components) return sum;
    const itemEarnings = e.salaryStructure.components
      .filter((c: any) => c.component_type === 'EARNING')
      .reduce((s: number, c: any) => s + (parseFloat(c.value) || 0), 0);
    return sum + itemEarnings;
  }, 0);

  const netPayout = (totalPayroll + totalEarnings) - totalDeductions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      setError('Please select at least one employee.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const monthIndex = MONTHS.indexOf(month) + 1;
      const monthStr = `${year}-${String(monthIndex).padStart(2, '0')}-01`;
      // Pass selected employee profile IDs (as numbers) to the backend
      const employeeIds = selectedEmployees.map((e) => parseInt(e.id));
      await payrollApi.createRun({ month: monthStr, employee_ids: employeeIds });
      showToast(
        `Payroll for ${month} ${year} created! Payslips generated for ${selectedIds.size} employee${selectedIds.size !== 1 ? 's' : ''}.`,
        'success'
      );
      navigate('/admin/payroll');
    } catch (err: any) {
      setError(err.message || 'Failed to create payroll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create Payroll Run</h1>
        <p className="text-gray-500 mt-1">Select employees and generate payslips for a given month.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Month / Year */}
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

          {/* Payroll Summary */}
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-orange-700">Payroll Summary</p>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Selected employees</span>
              <span className="font-medium">{selectedIds.size} / {employees.length}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total gross salary</span>
              <span className="font-medium">${totalPayroll.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total earnings</span>
              <span className="font-medium text-green-600">+${totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total deductions</span>
              <span className="font-medium text-red-600">-${totalDeductions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-orange-200 pt-2 mt-2">
              <span>Estimated net payout</span>
              <span className="text-green-600">${netPayout.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingEmployees || isNoneSelected}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating...' : `Create Payroll for ${month} ${year}`}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/payroll')}
              className="px-6 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right: Employee Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-gray-700">
                Active Employees ({employees.length})
              </h2>
            </div>
            {/* Select All toggle */}
            {!loadingEmployees && employees.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading employees...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active employees found.</p>
              <p className="text-sm mt-1">Add employees before creating a payroll run.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto -mx-2">
              {employees.map((emp) => {
                const isChecked = selectedIds.has(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-colors ${isChecked ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleEmployee(emp.id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isChecked ? 'text-gray-900' : 'text-gray-500'}`}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-400">{emp.employeeId}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${isChecked ? 'text-gray-800' : 'text-gray-400'}`}>
                      ${emp.baseSalary.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {!loadingEmployees && employees.length > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              {selectedIds.size} of {employees.length} selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPayroll;