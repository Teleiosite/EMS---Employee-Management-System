import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recruitmentApi } from '../../services/recruitmentApi';
import { JobRequirement } from '../../types';
import { ArrowLeft, CheckCircle, UploadCloud, Briefcase, MapPin, Building } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const JobApplication: React.FC = () => {
  const { tenantSlug, jobId } = useParams<{ tenantSlug: string; jobId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<JobRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        if (!tenantSlug || !jobId) throw new Error("Missing job or company identifiers.");
        const jobs = await recruitmentApi.getPublicJobs(tenantSlug);
        const found = jobs.find(j => j.id === jobId);
        if (!found) {
          throw new Error("Job not found or no longer available.");
        }
        setJob(found);
      } catch (err: any) {
        showToast(err.message || 'Error loading job details', 'error');
        navigate(`/careers/${tenantSlug}`);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [tenantSlug, jobId, navigate, showToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResume(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume) {
      showToast('Please upload a resume', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('job', jobId!);
      data.append('full_name', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('resume', resume);

      await recruitmentApi.submitPublicApplication(data);
      setSuccess(true);
      showToast('Application submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-gray-100">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying for the <strong>{job?.role_name}</strong> position. We've received your application and will be in touch soon.
          </p>
          <Link
            to={`/careers/${tenantSlug}`}
            className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to={`/careers/${tenantSlug}`} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all jobs
        </Link>
        
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 mb-8">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900">{job?.role_name}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center"><Building className="mr-1.5 h-4 w-4" /> {job?.department}</div>
              <div className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> {job?.location}</div>
              <div className="flex items-center"><Briefcase className="mr-1.5 h-4 w-4" /> {job?.employment_type}</div>
            </div>
            
            <div className="mt-8 prose prose-indigo max-w-none">
              <h3 className="text-lg font-semibold text-gray-900">About the Role</h3>
              <p className="text-gray-600 mt-2 whitespace-pre-line">{job?.description}</p>
              
              {job?.responsibilities && job.responsibilities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Responsibilities</h3>
                  <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                    {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {job?.required_skills && job.required_skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Required Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.required_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Submit Your Application</h2>
            <p className="text-sm text-gray-500 mt-1">Please fill out the details below to apply.</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume (PDF)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} required />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">{resume ? resume.name : 'PDF up to 10MB'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;
