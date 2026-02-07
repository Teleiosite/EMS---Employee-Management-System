import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employees, payrolls } from '../services/mockData';

const AddPayroll: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    employeeId: '',
    month: 'August',
    year: 2025,
    baseSalary: '',
    deductions: '',
    status: 'Processing'
  });

  // Derived state for display
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      const payroll = payrolls.find(p => p.id === id);
      if (payroll) {
        setFormData({
          employeeId: payroll.employeeId,
          month: payroll.month,
          year: payroll.year,
          baseSalary: payroll.baseSalary.toString(),
          deductions: payroll.deductions.toString(),
          status: payroll.status
        });
        setSelectedEmployeeName(payroll.name);
      }
    }
  }, [isEditMode, id]);

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: empId,
        baseSalary: emp.baseSalary.toString(),
        // Simple 12% mock tax calc
        deductions: Math.round(emp.baseSalary * 0.12).toString() 
      }));
      setSelectedEmployeeName(emp.name);
    } else {
      setFormData(prev => ({ ...prev, employeeId: '', baseSalary: '', deductions: '' }));
      setSelectedEmployeeName('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateNet = () => {
    const base = Number(formData.baseSalary) || 0;
    const ded = Number(formData.deductions) || 0;
    return base - ded;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTimeout(() => {
      const emp = employees.find(e => e.id === formData.employeeId);
      const designation = emp ? emp.designation : 'Employee';
      const name = emp ? emp.name : selectedEmployeeName;

      if (isEditMode && id) {
        const index = payrolls.findIndex(p => p.id === id);
        if (index !== -1) {
          payrolls[index] = {
            ...payrolls[index],
            month: formData.month,
            year: Number(formData.year),
            baseSalary: Number(formData.baseSalary),
            deductions: Number(formData.deductions),
            netSalary: calculateNet(),
            status: formData.status as any,
          };
        }
        alert("Payroll record updated!");
      } else {
        payrolls.push({
          id: `p${Date.now()}`,
          employeeId: formData.employeeId,
          name: name,
          designation: designation,
          month: formData.month,
          year: Number(formData.year),
          baseSalary: Number(formData.baseSalary),
          deductions: Number(formData.deductions),
          netSalary: calculateNet(),
          status: formData.status as any
        });
        alert("Payroll record created!");
      }
      navigate('/payroll');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Payroll' : 'Create Payroll'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Employee</label>
            {isEditMode ? (
              <input 
                type="text" 
                value={selectedEmployeeName} 
                disabled 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
            ) : (
              <select 
                name="employeeId" 
                value={formData.employeeId} 
                onChange={handleEmployeeChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Month</label>
               <select 
                 name="month"
                 value={formData.month}
                 onChange={handleChange}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
               >
                 {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                   <option key={m} value={m}>{m}</option>
                 ))}
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Year</label>
               <input 
                 name="year"
                 type="number"
                 value={formData.year}
                 onChange={handleChange}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Base Salary ($)</label>
              <input 
                name="baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Deductions/Tax ($)</label>
              <input 
                name="deductions"
                type="number"
                value={formData.deductions}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200">
             <span className="font-semibold text-gray-700">Net Salary:</span>
             <span className="font-bold text-xl text-green-600">${calculateNet().toLocaleString()}</span>
          </div>

          <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
              >
                <option value="Processing">Processing</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

          <div className="pt-4">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {isEditMode ? 'Update Payroll' : 'Create Payroll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayroll;