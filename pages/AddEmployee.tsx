import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employees } from '../services/mockData';

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    salary: '',
    experience: '',
    password: '',
    confirmPassword: '',
    joiningDate: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const employee = employees.find(e => e.id === id);
      if (employee) {
        const [first, ...last] = employee.name.split(' ');
        setFormData({
          username: employee.employeeId, // Using EmployeeID as username for mock
          firstName: first || '',
          lastName: last.join(' ') || '',
          email: employee.email,
          department: employee.department.toLowerCase(),
          salary: employee.baseSalary.toString(),
          experience: employee.experience.toString(),
          password: 'mockpassword', // Placeholder
          confirmPassword: 'mockpassword',
          joiningDate: employee.joiningDate
        });
      }
    }
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call and Data Update
    setTimeout(() => {
      if (isEditMode && id) {
        // Update existing employee in mock data
        const index = employees.findIndex(e => e.id === id);
        if (index !== -1) {
          employees[index] = {
            ...employees[index],
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            department: formData.department.charAt(0).toUpperCase() + formData.department.slice(1),
            baseSalary: Number(formData.salary),
            experience: Number(formData.experience)
          };
        }
        alert("Employee updated successfully!");
      } else {
        // Add new employee to mock data
        const newEmployee = {
          id: `e${Date.now()}`,
          userId: `u${Date.now()}`,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          employeeId: `EMP${Math.floor(Math.random() * 1000)}`,
          department: formData.department.charAt(0).toUpperCase() + formData.department.slice(1) || 'Engineering',
          designation: 'Employee', // Default
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE' as const,
          baseSalary: Number(formData.salary),
          experience: Number(formData.experience)
        };
        employees.push(newEmployee);
        alert("Employee added successfully!");
      }
      navigate('/admin/employees');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                required 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter username" 
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">First name</label>
              <input 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter first name" 
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Last name</label>
              <input 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter last name" 
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <input 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required 
                type="email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter email address" 
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-600"
              >
                <option value="">Select Department (Optional)</option>
                <option value="engineering">Engineering</option>
                <option value="hr">Human Resources</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
              </select>
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Salary</label>
              <input 
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                type="number" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter salary" 
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Birthday</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-500" />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Experience (Years)</label>
              <input 
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                type="number" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter experience in years" 
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditMode}
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Enter password" 
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isEditMode}
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                placeholder="Confirm password" 
              />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {isEditMode ? 'Update Employee' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;