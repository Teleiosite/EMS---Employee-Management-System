import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, Upload } from 'lucide-react';
import recruitmentApi from '../../services/recruitmentApi';
import { JobRequirement } from '../../types';
import { useToast } from '../../context/ToastContext';

const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [roleId, setRoleId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    recruitmentApi.listJobs().then(setJobs).catch(() => setJobs([]));
  }, []);

  const handleSubmit = async () => {
    if (!roleId || !file || !name || !email) return;
    setIsSubmitting(true);
    try {
      const created = await recruitmentApi.createCandidate({
        full_name: name,
        email,
        job: Number(roleId),
      });
      await recruitmentApi.uploadResume(created.id, file);
      showToast('Candidate and resume uploaded successfully.', 'success');
      navigate('/admin/recruitment/candidates');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Upload Resume</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 max-w-2xl">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate full name" className="w-full px-4 py-2 border rounded-lg" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Candidate email" className="w-full px-4 py-2 border rounded-lg" />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
          <option value="">-- Select Role --</option>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.role_name}</option>)}
        </select>
        <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative block cursor-pointer">
          <input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">{file ? file.name : 'Click to upload resume'}</p>
        </label>
        <button onClick={handleSubmit} disabled={isSubmitting || !file || !roleId || !name || !email} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold disabled:opacity-70 flex justify-center items-center gap-2">
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><FileText className="w-5 h-5" /> Create Candidate & Upload</>}
        </button>
      </div>
    </div>
  );
};

export default UploadResume;
