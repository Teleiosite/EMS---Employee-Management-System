import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { payrollApi } from '../services/payrollApi';
import { PayrollRecord } from '../types';

const EmployeePayroll: React.FC = () => {
  const [myPayrolls, setMyPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      setLoading(true);
      try {
        // The backend PayslipViewSet already filters by current user for employees
        const payslips = await payrollApi.listPayslips();
        setMyPayrolls(payslips);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch payslips:', err);
        setError('Failed to load payslips from the server.');
        setMyPayrolls([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, []);

  const getPayPeriodString = (month: string, year: number) => {
    try {
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);

      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return `${startDate.toLocaleDateString('en-US', options)} to ${endDate.toLocaleDateString('en-US', options)}`;
    } catch {
      return `${month} ${year}`;
    }
  };

  const handleDownload = (id: string) => {
    alert("Downloading payslip...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading payroll data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Payslips</h1>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <th className="px-6 py-4">Pay Period</th>
                <th className="px-6 py-4">Gross Salary</th>
                <th className="px-6 py-4">Deductions</th>
                <th className="px-6 py-4">Net Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myPayrolls.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {getPayPeriodString(record.month, record.year)}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    ${record.baseSalary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-red-600 font-medium">
                    -${record.deductions.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-green-700 font-bold">
                    ${record.netSalary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        record.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDownload(record.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {myPayrolls.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2 opacity-20" />
                      <p>No payslips found for your account.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePayroll;