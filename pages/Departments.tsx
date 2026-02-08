import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { departmentsApi, ApiError } from '../services/employeesApi';
import { departments as mockDepartments } from '../services/mockData';
import { Department } from '../types';

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await departmentsApi.list();
        setDepartments(data);
      } catch (err) {
        console.warn('Failed to fetch from API, using mock data:', err);
        // Fallback to mock data
        setDepartments(mockDepartments);
        if (err instanceof ApiError && err.status !== 401) {
          setError('Using offline data. Backend may not be running.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    setDeleting(id);
    try {
      await departmentsApi.delete(id);
      setDepartments(prev => prev.filter(dept => dept.id !== id));
    } catch (err) {
      console.error('Failed to delete department:', err);
      // Still remove from local state for demo purposes
      setDepartments(prev => prev.filter(dept => dept.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">View Departments</h1>
          {error && (
            <p className="text-amber-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/departments/new')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <span className="ml-2 text-gray-500">Loading departments...</span>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="py-4">Department Name</th>
                  <th className="py-4">Description</th>
                  <th className="py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-gray-800 font-medium">{dept.name}</td>
                    <td className="py-4 text-gray-600 text-sm">{dept.description || '-'}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-4 text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/departments/edit/${dept.id}`)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(dept.id)}
                          disabled={deleting === dept.id}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleting === dept.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDepartments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No departments found.
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

export default Departments;