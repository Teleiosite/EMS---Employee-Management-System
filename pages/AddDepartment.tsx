import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { departmentsApi } from '../services/employeesApi';

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartment = async () => {
      if (!isEditMode || !id) return;
      setLoading(true);
      try {
        const dept = await departmentsApi.get(id);
        setFormData({ name: dept.name, description: dept.description || '' });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };
    loadDepartment();
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditMode && id) {
        await departmentsApi.update(id, formData);
      } else {
        await departmentsApi.create(formData);
      }
      navigate('/admin/departments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Department' : 'Add New Department'}</h1>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Department Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          <div className="pt-4">
            <button disabled={loading} type="submit" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {loading ? 'Saving...' : isEditMode ? 'Update Department' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;
