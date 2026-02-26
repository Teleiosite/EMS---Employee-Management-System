import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { announcementsApi } from '../services/announcementsApi';
import { useToast } from '../context/ToastContext';

const AddAnnouncement: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH'
  });

  useEffect(() => {
    if (isEditMode && id) {
      announcementsApi.get(id).then((item) => {
        if (!item) return;
        setFormData({
          title: item.title,
          content: item.content,
          date: item.date,
          priority: item.priority
        });
      });
    }
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && id) {
      await announcementsApi.update(id, formData);
      showToast('Announcement updated successfully!', 'success');
      showToast('Update email sent to all employees.', 'email');
    } else {
      await announcementsApi.create(formData);
      showToast('Announcement published successfully!', 'success');
      showToast('Email notification sent to all active employees.', 'email');
    }
    navigate('/admin/announcements');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Announcement' : 'Add Announcement'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input 
              name="title"
              value={formData.title}
              onChange={handleChange}
              required 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
              placeholder="Enter announcement title" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input 
                name="date"
                value={formData.date}
                onChange={handleChange}
                required 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-600" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select 
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-600"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content</label>
            <textarea 
              name="content"
              value={formData.content}
              onChange={handleChange}
              required 
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" 
              placeholder="Write your announcement content here..." 
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              {isEditMode ? 'Update Announcement' : 'Publish Announcement'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/admin/announcements')}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAnnouncement;