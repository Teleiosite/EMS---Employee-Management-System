import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import recruitmentApi from '../../services/recruitmentApi';
import { departmentsApi } from '../../services/employeesApi';

const AddJob: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', department: '', location: 'Remote', description: '', is_active: true });

  useEffect(() => {
    departmentsApi.list().then((data) => setDepartments(data)).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    recruitmentApi.getJob(id).then((job) => {
      setFormData({
        title: job.role_name,
        department: job.department,
        location: 'Remote',
        description: job.responsibilities.join('\n') || 'Job description',
        is_active: job.status === 'OPEN',
      });
    }).catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load job', 'error'));
  }, [id, isEditMode, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && id) {
        await recruitmentApi.updateJob(id, formData);
        showToast('Job posting updated successfully!', 'success');
      } else {
        await recruitmentApi.createJob(formData);
        showToast('New job posted successfully!', 'success');
      }
      navigate('/admin/recruitment/jobs');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save job', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Job Posting' : 'Post New Job'}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" placeholder="Role Name" />
          <select name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg bg-white">
            <option value="">Select Department</option>
            {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
          </select>
          <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="Location" />
          <textarea name="description" value={formData.description} onChange={handleChange} required rows={6} className="w-full px-4 py-2 border rounded-lg" placeholder="Description / responsibilities" />
          <select name="is_active" value={String(formData.is_active)} onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.value === 'true' }))} className="w-full px-4 py-2 border rounded-lg bg-white">
            <option value="true">Open</option>
            <option value="false">Closed</option>
          </select>
          <button disabled={loading} type="submit" className="bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-lg font-medium">{loading ? 'Saving...' : isEditMode ? 'Update Job Posting' : 'Post Job'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddJob;
