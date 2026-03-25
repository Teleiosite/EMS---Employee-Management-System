import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreVertical, Mail, Edit, Trash2, Loader2, UserPlus, Upload, FileCheck, AlertTriangle, X, Download } from 'lucide-react';


import { employeesApi, ApiError } from '../services/employeesApi';
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
  
  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);


  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await employeesApi.list();
        setEmployeeList(data);
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setError('Please log in to view employees.');
          } else {
            setError(`Failed to load employees: ${err.message}`);
          }
        } else {
          setError('Failed to connect to server. Please check if the backend is running.');
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
    } catch (err: any) {
      console.error('Failed to delete employee:', err);
      const message = err.message || 'Failed to delete employee. Please try again.';
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeleting(null);
    }
  };

  const filteredEmployees = employeeList.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'password', 'department', 'designation', 'base_salary', 'joining_date', 'phone_number', 'address'];
    const sampleRow = ['John', 'Doe', 'john.doe@company.com', 'SecurePass123', 'Engineering', 'Software Engineer', '50000', new Date().toISOString().split('T')[0], '+1234567890', '123 Main St'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          <button 
            type="button" 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all hover:border-orange-200"
          >
            <Upload className="w-4 h-4 text-orange-500" /> Bulk Import
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/employees/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
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
                {filteredEmployees.length === 0 && !error && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <UserPlus className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">
                          {searchTerm ? 'No employees found matching your search.' : 'No employees added yet.'}
                        </p>
                        {!searchTerm && (
                          <button
                            type="button"
                            onClick={() => navigate('/admin/employees/new')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            + Add Your First Employee
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                Bulk Employee Migration
              </h3>
              <button 
                onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8">
              {!importResult ? (
                <div className="space-y-6">
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center space-y-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold">
                        {importFile ? importFile.name : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">Supports CSV, Excel (.xlsx, .xls)</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> IMPORTANT
                    </p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Required columns: <strong>first_name, last_name, email, password, department, designation, base_salary, joining_date</strong>. New departments and designations are created automatically.
                    </p>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="mt-2 flex items-center gap-2 text-xs text-orange-600 hover:text-orange-700 font-bold underline-offset-2 hover:underline transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Template CSV
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!importFile) return;
                        setImporting(true);
                        try {
                          const res = await employeesApi.bulkImport(importFile);
                          setImportResult({ success: res.success_count, errors: res.errors });
                          // Refresh list
                          const data = await employeesApi.list();
                          setEmployeeList(data);
                        } catch (err: any) {
                          alert(err.message || "Import failed.");
                        } finally {
                          setImporting(false);
                        }
                      }}
                      disabled={!importFile || importing}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                      Start Migration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border-4 border-green-50 shadow-inner">
                    <FileCheck className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-900">Migration Completed</h4>
                    <p className="text-gray-500 mt-2">
                      Successfully imported <span className="font-bold text-green-600">{importResult.success}</span> employees.
                    </p>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Errors Found ({importResult.errors.length})
                      </p>
                      <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {importResult.errors.map((err, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="opacity-50">•</span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default Employees;