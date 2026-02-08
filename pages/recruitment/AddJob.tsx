
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobRequirements, departments } from '../../services/mockData';
import { useToast } from '../../context/ToastContext';

const AddJob: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    role_name: '',
    department: '',
    required_skills: '',
    minimum_years_experience: '',
    education_level: '',
    responsibilities: '',
    status: 'OPEN'
  });

  useEffect(() => {
    if (isEditMode && id) {
      const job = jobRequirements.find(j => j.id === id);
      if (job) {
        setFormData({
          role_name: job.role_name,
          department: job.department,
          required_skills: job.required_skills.join(', '),
          minimum_years_experience: job.minimum_years_experience.toString(),
          education_level: job.education_level || '',
          responsibilities: job.responsibilities ? job.responsibilities.join('\n') : '',
          status: job.status
        });
      }
    }
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate API latency
    setTimeout(() => {
      const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const responsibilitiesArray = formData.responsibilities.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      
      const newJobData = {
        role_name: formData.role_name,
        department: formData.department,
        required_skills: skillsArray,
        minimum_years_experience: Number(formData.minimum_years_experience),
        education_level: formData.education_level,
        responsibilities: responsibilitiesArray,
        status: formData.status as 'OPEN' | 'CLOSED'
      };

      if (isEditMode && id) {
        const index = jobRequirements.findIndex(j => j.id === id);
        if (index !== -1) {
          jobRequirements[index] = { ...jobRequirements[index], ...newJobData };
        }
        showToast("Job posting updated successfully!", "success");
      } else {
        jobRequirements.push({
          id: `job${Date.now()}`,
          ...newJobData
        });
        showToast("New job posted successfully!", "success");
      }
      navigate('/admin/recruitment/jobs');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Job Posting' : 'Post New Job'}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role Name</label>
              <input 
                name="role_name"
                value={formData.role_name}
                onChange={handleChange}
                required 
                type="text" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                placeholder="e.g. Senior Frontend Engineer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700">Required Skills (Comma separated)</label>
             <textarea 
               name="required_skills"
               value={formData.required_skills}
               onChange={handleChange}
               required
               rows={2}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
               placeholder="e.g. React, TypeScript, Tailwind CSS, Node.js"
             />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700">Key Responsibilities (One per line)</label>
             <textarea 
               name="responsibilities"
               value={formData.responsibilities}
               onChange={handleChange}
               required
               rows={5}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
               placeholder="- Develop new features&#10;- Maintain existing codebase&#10;- Collaborate with team"
             />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Education Level & Requirements</label>
            <textarea
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none" 
              placeholder="e.g. Bachelors Degree in Computer Science, Engineering, or a related field. Masters is a plus."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Min. Experience (Years)</label>
               <input 
                 name="minimum_years_experience"
                 value={formData.minimum_years_experience}
                 onChange={handleChange}
                 required 
                 type="number"
                 min="0"
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
               />
             </div>

             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Status</label>
               <select 
                 name="status"
                 value={formData.status}
                 onChange={handleChange}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
               >
                 <option value="OPEN">Open</option>
                 <option value="CLOSED">Closed</option>
               </select>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              {isEditMode ? 'Update Job' : 'Post Job'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/admin/recruitment/jobs')}
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

export default AddJob;
