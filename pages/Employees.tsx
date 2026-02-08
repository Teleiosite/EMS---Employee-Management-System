import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreVertical, Mail, Edit, Trash2, Loader2 } from 'lucide-react';
import { employeesApi, ApiError } from '../services/employeesApi';
import { employees as mockEmployees } from '../services/mockData';
import { EmployeeProfile } from '../types';

type Employee = EmployeeProfile & { name: string; email: string };

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeesApi.list();
        setEmployeeList(data);
      } catch (err) {
        console.warn('Failed to fetch from API, using mock data:', err);
        setEmployeeList(mockEmployees);
        if (err instanceof ApiError && err.status !== 401) {
          setError('Using offline data. Backend may not be running.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleEdit = (id: string) => {
    setActiveActionId(null);
    navigate(`/admin/employees/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    setActiveActionId(null);
    setDeleting(id);

    try {
      await employeesApi.delete(id);
      setEmployeeList(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      console.error('Failed to delete employee:', err);
      // Still remove from local state for demo
      setEmployeeList(prev => prev.filter(emp => emp.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filteredEmployees = employeeList.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage your team members and their roles.</p>
          {error && (
            <p className="text-amber-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/employees/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employees by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-gray-500">Loading employees...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Employee</th>
                  <th className="px-6 py-4 whitespace-nowrap">ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Department</th>
                  <th className="px-6 py-4 whitespace-nowrap">Designation</th>
                  <th className="px-6 py-4 whitespace-nowrap">Salary</th>
                  <th className="px-6 py-4 whitespace-nowrap">Experience</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${deleting === emp.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-sm text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{emp.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.designation}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${emp.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{emp.experience} Years</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex justify-end gap-2 items-center">
                        <button type="button" className="p-1 text-gray-400 hover:text-blue-600"><Mail className="w-4 h-4" /></button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleActionMenu(emp.id)}
                            className={`p-1 rounded-full transition-colors ${activeActionId === emp.id ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeActionId === emp.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveActionId(null)}></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100 transform origin-top-right">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(emp.id)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                                >
                                  <Edit className="w-4 h-4" /> Edit Details
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(emp.id);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete Employee
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;