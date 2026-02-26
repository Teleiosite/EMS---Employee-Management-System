import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { registerStaffWithBackend } from '../services/authApi';
import { departmentsApi, designationsApi, employeesApi } from '../services/employeesApi';
import { UserRole } from '../types';

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [designations, setDesignations] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    designationId: '',
    salary: '',
    password: '',
    confirmPassword: '',
    joiningDate: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [deps, desigs] = await Promise.all([departmentsApi.list(), designationsApi.list()]);
        setDepartments(deps.map((d) => ({ id: d.id, name: d.name })));
        setDesignations(desigs.map((d) => ({ id: d.id, title: d.title })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form options');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const loadEmployee = async () => {
      if (!isEditMode || !id) return;
      setLoading(true);
      try {
        const employee = await employeesApi.get(id);
        setFormData((prev) => ({
          ...prev,
          employeeId: employee.employeeId,
          firstName: employee.name.split(' ')[0] || '',
          lastName: employee.name.split(' ').slice(1).join(' '),
          email: employee.email,
          salary: String(employee.baseSalary),
          joiningDate: employee.joiningDate,
          status: employee.status,
          password: '',
          confirmPassword: '',
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [id, isEditMode]);

  const canSubmit = useMemo(() => {
    if (!isEditMode) {
      return formData.password.length >= 8 && formData.password === formData.confirmPassword;
    }
    return true;
  }, [formData.confirmPassword, formData.password, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await employeesApi.update(id, {
          department: formData.departmentId ? Number(formData.departmentId) : null,
          designation: formData.designationId ? Number(formData.designationId) : null,
          base_salary: Number(formData.salary),
          phone_number: formData.phone,
          address: formData.address,
          status: formData.status,
        });
      } else {
        const user = await registerStaffWithBackend({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: UserRole.EMPLOYEE,
        });

        await employeesApi.create({
          user_id: user.id,
          employee_id: formData.employeeId,
          department: formData.departmentId ? Number(formData.departmentId) : null,
          designation: formData.designationId ? Number(formData.designationId) : null,
          base_salary: Number(formData.salary),
          joining_date: formData.joiningDate,
          phone_number: formData.phone,
          address: formData.address,
          status: formData.status,
        });
      }

      navigate('/admin/employees');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h1>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input name="employeeId" required value={formData.employeeId} onChange={handleChange} placeholder="Employee ID" className="w-full px-4 py-2 border rounded-lg" disabled={isEditMode} />
            <input name="email" required value={formData.email} onChange={handleChange} type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-lg" disabled={isEditMode} />
            <input name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full px-4 py-2 border rounded-lg" disabled={isEditMode} />
            <input name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full px-4 py-2 border rounded-lg" disabled={isEditMode} />
            <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select name="designationId" value={formData.designationId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="">Select Designation</option>
              {designations.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            <input name="salary" required value={formData.salary} onChange={handleChange} type="number" placeholder="Base Salary" className="w-full px-4 py-2 border rounded-lg" />
            <input name="joiningDate" required value={formData.joiningDate} onChange={handleChange} type="date" className="w-full px-4 py-2 border rounded-lg" />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full px-4 py-2 border rounded-lg" />
            <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="w-full px-4 py-2 border rounded-lg" />
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ON_LEAVE">ON_LEAVE</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="password" required value={formData.password} onChange={handleChange} type="password" placeholder="Temporary Password" className="w-full px-4 py-2 border rounded-lg" />
              <input name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} type="password" placeholder="Confirm Password" className="w-full px-4 py-2 border rounded-lg" />
            </div>
          )}

          <button disabled={loading || !canSubmit} type="submit" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-lg font-medium">
            {loading ? 'Saving...' : isEditMode ? 'Update Employee' : 'Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
