import React, { useEffect, useState } from 'react';
import { Download, CreditCard } from 'lucide-react';
import { PayrollRecord, User } from '../types';
import { employeesApi } from '../services/employeesApi';
import { payrollApi } from '../services/payrollApi';

const EmployeePayroll: React.FC = () => {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user: User = JSON.parse(storedUser);
      try {
        const profiles = await employeesApi.list();
        const profile = profiles.find((p) => p.userId === user.id);
        if (!profile) {
          setError('Employee profile not found.');
          return;
        }
        const payslips = await payrollApi.listPayslips({ employee: profile.id });
        setRecords(payslips);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payroll records');
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Payroll</h1>
        <p className="text-gray-500">View your salary slips and payroll history.</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 text-xs uppercase text-gray-500"><th className="px-6 py-4">Month</th><th className="px-6 py-4">Gross</th><th className="px-6 py-4">Deductions</th><th className="px-6 py-4">Net</th><th className="px-6 py-4">Action</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => (
              <tr key={r.id}><td className="px-6 py-4">{r.month} {r.year}</td><td className="px-6 py-4">${r.baseSalary.toLocaleString()}</td><td className="px-6 py-4">${r.deductions.toLocaleString()}</td><td className="px-6 py-4 font-semibold text-green-600">${r.netSalary.toLocaleString()}</td><td className="px-6 py-4"><button className="flex items-center gap-1 text-orange-600"><Download className="w-4 h-4" /> Download</button></td></tr>
            ))}
            {records.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><CreditCard className="w-6 h-6 mx-auto mb-2" />No payroll records available.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePayroll;
