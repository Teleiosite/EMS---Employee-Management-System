import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { parseResumeFile } from '../../services/resumeService'; // Keep for client-side preview
import { ParsedResume, JobRequirement } from '../../types';
import { useToast } from '../../context/ToastContext';

const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [roleId, setRoleId] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await recruitmentApi.listJobs('OPEN');
        setJobs(data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
        showToast('Failed to load job roles.', 'error');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.type.includes('word') || selected.name.endsWith('.docx') || selected.name.endsWith('.doc')) {
        setFile(selected);
        setParsedData(null); // Reset preview
      } else {
        showToast('Please upload a PDF or DOCX file.', 'error');
      }
    }
  };

  const handleParse = async () => {
    if (!file || !roleId) {
      showToast('Please select a file and a job role.', 'error');
      return;
    }

    setIsParsing(true);
    try {
      // 1. Client-side mock parse for preview
      const data = await parseResumeFile(file);
      setParsedData(data);
      showToast('Resume analyzed! Review details below.', 'success');
    } catch (error) {
      showToast('Failed to parse resume.', 'error');
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !parsedData || !roleId) return;

    setIsSaving(true);
    try {
      // 1. Create candidate record
      const newCandidate = await recruitmentApi.createCandidate({
        full_name: parsedData.name || 'Unknown Candidate',
        email: parsedData.email || `unknown-${Date.now()}@example.com`,
        job: parseInt(roleId),
        skills: parsedData.skills
      });

      // 2. Upload resume file (this triggers backend re-parsing and AI analysis)
      await recruitmentApi.uploadResume(newCandidate.id, file);

      showToast('Candidate profile created and ranked.', 'success');
      navigate('/admin/recruitment/candidates');
    } catch (e) {
      console.error(e);
      showToast('Error saving candidate to database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upload Resume</h1>
          <p className="text-gray-500">Add a new candidate by parsing their resume.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">1. Select Job & File</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
              {loadingJobs ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">Loading jobs...</div>
              ) : (
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="">-- Select Role --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.role_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF/DOCX)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or DOCX up to 5MB</p>
              </div>
            </div>

            <button
              onClick={handleParse}
              disabled={isParsing || !file || !roleId}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isParsing ? (
                <> <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Resume... </>
              ) : (
                <> <FileText className="w-5 h-5" /> Analyze Resume </>
              )}
            </button>
          </div>
        </div>

        {/* Preview / Results */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">2. AI Analysis Preview</h2>

          {!parsedData ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border border-gray-100 rounded-lg bg-gray-50">
              <FileText className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Upload and analyze to see extracted data here.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="bg-blue-200 p-2 rounded-full text-blue-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{parsedData.name || 'Name Unknown'}</h3>
                  <p className="text-sm text-gray-600">{parsedData.email || 'Email Unknown'}</p>
                  <p className="text-sm text-gray-600">{parsedData.phone || 'Phone Unknown'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detected Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills.map(s => (
                    <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">{s}</span>
                  )) : <span className="text-sm text-gray-400 italic">No skills detected</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Experience Summary</h4>
                {parsedData.experience && parsedData.experience.length > 0 ? (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{parsedData.experience[0].title} at {parsedData.experience[0].company}</p>
                    <p className="text-xs text-gray-500">{parsedData.experience[0].duration}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No experience detected.</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm & Add Candidate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResume;
