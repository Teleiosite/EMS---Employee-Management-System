import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { employeesApi, departmentsApi, designationsApi, DesignationType } from '../services/employeesApi';
import api from '../services/api';
import { Department } from '../types';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate: string;
  phoneNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
}

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    designation: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<DesignationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch departments and designations on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepts(true);
      try {
        const data = await departmentsApi.list();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };

    const fetchDesignations = async () => {
      setLoadingDesignations(true);
      try {
        const data = await designationsApi.list();
        setDesignations(data);
      } catch (err) {
        console.error('Failed to fetch designations:', err);
      } finally {
        setLoadingDesignations(false);
      }
    };

    fetchDepartments();
    fetchDesignations();
  }, []);

  // Fetch employee data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchEmployee = async () => {
        setLoading(true);
        try {
          const employee = await employeesApi.get(id);
          setFormData({
            firstName: employee.name.split(' ')[0] || '',
            lastName: employee.name.split(' ').slice(1).join(' ') || '',
            email: employee.email,
            department: employee.department || '',
            designation: employee.designation || '',
            salary: employee.baseSalary.toString(),
            joiningDate: employee.joiningDate,
            phoneNumber: '',
            address: '',
            password: '',
            confirmPassword: '',
          });
        } catch (err) {
          console.error('Failed to fetch employee:', err);
          setError('Failed to load employee data');
        } finally {
          setLoading(false);
        }
      };

      fetchEmployee();
    }
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.salary.trim()) {
      setError('Salary is required');
      return false;
    }
    if (!formData.joiningDate) {
      setError('Joining date is required');
      return false;
    }
    if (!isEditMode) {
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditMode && id) {
        // Update existing employee
        await employeesApi.update(id, {
          base_salary: parseFloat(formData.salary),
          phone_number: formData.phoneNumber,
          address: formData.address,
          department_id: formData.department ? parseInt(formData.department) : null,
          designation_id: formData.designation ? parseInt(formData.designation) : null,
        });
        setSuccess('Employee updated successfully!');
        setTimeout(() => navigate('/admin/employees'), 1500);
      } else {
        // Step 1: Register the user with EMPLOYEE role
        const registerResponse = await api.post<{ id: string }>('/auth/register/', {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'EMPLOYEE',
        });

        // Step 2: Create the employee profile
        const employeeId = `EMP${Date.now().toString().slice(-6)}`;
        await employeesApi.create({
          user_id: registerResponse.id,
          employee_id: employeeId,
          base_salary: parseFloat(formData.salary),
          joining_date: formData.joiningDate,
          phone_number: formData.phoneNumber || '',
          address: formData.address || '',
          department_id: formData.department ? parseInt(formData.department) : undefined,
          designation_id: formData.designation ? parseInt(formData.designation) : undefined,
          status: 'ACTIVE',
        });

        setSuccess('Employee added successfully!');
        setTimeout(() => navigate('/admin/employees'), 1500);
      }
    } catch (err: any) {
      console.error('Failed to save employee:', err);
      if (err.message) {
        // Handle specific API errors
        if (err.message.includes('email')) {
          setError('An account with this email already exists');
        } else if (err.message.includes('password')) {
          setError('Password does not meet requirements');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to save employee. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Enter last name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                disabled={isEditMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter email address"
              />
              {isEditMode && (
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loadingDepts}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-600"
              >
                <option value="">Select Department (Optional)</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {departments.length === 0 && !loadingDepts && (
                <p className="text-xs text-amber-600">
                  No departments found. <button type="button" onClick={() => navigate('/admin/departments/new')} className="text-orange-600 underline">Add a department first</button>
                </p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Designation</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                disabled={loadingDesignations}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-600"
              >
                <option value="">Select Designation (Optional)</option>
                {designations.map(des => (
                  <option key={des.id} value={des.id}>{des.title}</option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Base Salary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter salary"
                />
              </div>
            </div>

            {/* Joining Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Joining Date <span className="text-red-500">*</span>
              </label>
              <input
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Enter phone number"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                placeholder="Enter address"
              />
            </div>

            {/* Password Fields - Only for new employees */}
            {!isEditMode && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Enter password (min 8 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 8+ characters, not entirely numeric, and not a common word.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Confirm password"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Update Employee' : 'Add Employee'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-8 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;