import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { departmentsApi } from '../services/employeesApi';

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch department data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchDepartment = async () => {
        setLoadingData(true);
        try {
          const dept = await departmentsApi.get(id);
          setFormData({
            name: dept.name,
            description: dept.description || ''
          });
        } catch (err) {
          console.error('Failed to fetch department:', err);
          setError('Failed to load department data');
        } finally {
          setLoadingData(false);
        }
      };

      fetchDepartment();
    }
  }, [isEditMode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditMode && id) {
        // Update existing department
        await departmentsApi.update(id, {
          name: formData.name,
          description: formData.description || undefined
        });
        setSuccess('Department updated successfully!');
      } else {
        // Create new department
        await departmentsApi.create({
          name: formData.name,
          description: formData.description || undefined
        });
        setSuccess('Department added successfully!');
      }
      setTimeout(() => navigate('/admin/departments'), 1500);
    } catch (err: any) {
      console.error('Failed to save department:', err);
      if (err.message?.includes('unique') || err.message?.includes('already exists')) {
        setError('A department with this name already exists');
      } else {
        setError(err.message || 'Failed to save department. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-2 text-gray-500">Loading department...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/departments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Department' : 'Add New Department'}
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 max-w-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              placeholder="Enter department name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
              placeholder="Enter brief description (optional)"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Update Department' : 'Add Department'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/departments')}
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

export default AddDepartment;