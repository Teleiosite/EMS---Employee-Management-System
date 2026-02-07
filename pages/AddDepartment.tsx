import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { departments } from '../services/mockData';

const AddDepartment: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const dept = departments.find(d => d.id === id);
      if (dept) {
        setFormData({
          name: dept.name,
          description: dept.description || ''
        });
      }
    }
  }, [isEditMode, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API call
    setTimeout(() => {
      if (isEditMode && id) {
        const index = departments.findIndex(d => d.id === id);
        if (index !== -1) {
          departments[index] = {
            ...departments[index],
            name: formData.name,
            description: formData.description
          };
        }
        alert("Department updated successfully!");
      } else {
        departments.push({
          id: `d${Date.now()}`,
          name: formData.name,
          description: formData.description
        });
        alert("Department added successfully!");
      }
      navigate('/admin/departments');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Department' : 'Add New Department'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Department Name</label>
            <input 
              required 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
              placeholder="Enter department name" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" 
              placeholder="Enter brief description (optional)" 
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {isEditMode ? 'Update Department' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;