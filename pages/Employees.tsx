import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, UserPlus, Upload, ChevronRight } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { employeesApi, ApiError } from '../services/employeesApi';
import { EmployeeProfile } from '../types';

// Sub-components
import EmployeeTable from '../components/employee/EmployeeTable';
import ImportModal from '../components/employee/ImportModal';

type Employee = EmployeeProfile & { name: string; email: string };

const Employees: React.FC = () => {
  const navigate = useNavigate();
  
  // Queries
  const { 
    data: employeeList = [], 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.list(),
  });

  // State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const error = localError || (queryError instanceof ApiError ? queryError.message : queryError ? 'Failed to load employees' : null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent Action: Are you sure you want to delete this employee?")) return;
    setDeletingId(id);
    try {
      await employeesApi.delete(id);
      refetch();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to terminate employee record.');
      setTimeout(() => setLocalError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const res = await employeesApi.bulkImport(importFile);
      setImportResult({ success: res.success_count, errors: res.errors });
      await refetch();
    } catch (err: any) {
      alert(err.message || "Bulk migration failed.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Generate simple CSV
    const headers = ['First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Base Salary', 'Employee ID', 'Joining Date'];
    const row = ['John', 'Doe', 'john@example.com', 'Engineering', 'Developer', '60000', 'EMP001', '2024-01-15'];
    const csvContent = headers.join(",") + "\n" + row.join(",");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url; // Not setAttribute, directly assign
    link.download = "employee_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Fix: Delay revocation to allow Chrome time to attach the filename metadata
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const filteredEmployees = employeeList.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            Human Resources
            <ChevronRight className="w-6 h-6 text-orange-500" />
            <span className="text-gray-400 font-medium text-lg tracking-wide">Directory</span>
          </h1>
          {error ? (
             <p className="text-red-500 text-[10px] font-semibold text-sm tracking-wide mt-2 bg-red-50 p-2 rounded-lg border border-red-100 w-fit">{error}</p>
          ) : (
            <p className="text-gray-500 mt-2 font-medium">Coordinate and manage your global workforce assets.</p>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-semibold text-sm tracking-wide text-gray-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-xl shadow-gray-200/50"
          >
            <Upload className="w-4 h-4 text-orange-500" /> Bulk Import
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/employees/new')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-[10px] font-semibold text-sm tracking-wide transition-all shadow-xl shadow-orange-600/20 flex items-center gap-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white p-2 rounded-lg shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, staff ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-transparent rounded-2xl text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Accessing Directory...</span>
          </div>
        ) : (
          <EmployeeTable 
            data={filteredEmployees}
            deletingId={deletingId}
            onEdit={(id) => navigate(`/admin/employees/edit/${id}`)}
            onDelete={handleDelete}
            onAddFirst={() => navigate('/admin/employees/new')}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* Migration Portal Modal */}
      <ImportModal 
        show={showImportModal}
        onClose={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
        importFile={importFile}
        setImportFile={setImportFile}
        importing={importing}
        importResult={importResult}
        onDownloadTemplate={downloadTemplate}
        onStartImport={handleStartImport}
        onDone={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
      />
    </div>
  );
};

export default Employees;