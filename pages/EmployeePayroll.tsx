import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { payrolls, employees } from '../services/mockData';
import { PayrollRecord, User } from '../types';

const EmployeePayroll: React.FC = () => {
  const [myPayrolls, setMyPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      // Find the employee profile associated with this user account
      const employeeProfile = employees.find(e => e.userId === user.id);
      
      if (employeeProfile) {
        // Filter payrolls for this employee
        const userPayrolls = payrolls.filter(p => p.employeeId === employeeProfile.id);
        setMyPayrolls(userPayrolls);
      }
    }
    setLoading(false);
  }, []);

  const getPayPeriodString = (month: string, year: number) => {
    // Simple mapping for demo purposes. 
    // In a real app, use a library like date-fns
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of month

    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} to ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const handleDownload = (id: string) => {
    alert("Downloading payslip...");
  };

  if (loading) {
     return <div className="p-6 text-gray-500">Loading payroll data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Payslips</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <th className="px-6 py-4">Pay Period</th>
                <th className="px-6 py-4">Salary</th>
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
                    ${record.netSalary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        record.status === 'Paid' ? 'bg-green-100 text-green-700' :
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
              {myPayrolls.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-12 text-center flex flex-col items-center justify-center text-gray-400">
                     <FileText className="w-12 h-12 mb-2 opacity-20" />
                     <p>No payslips found for your account.</p>
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