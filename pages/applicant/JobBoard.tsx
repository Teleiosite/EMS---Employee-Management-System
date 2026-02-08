
import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, Upload, Loader2, CheckCircle, FileText, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { jobRequirements, candidates } from '../../services/mockData';
import { saveCandidate, parseResumeFile } from '../../services/resumeService';
import { JobRequirement, User } from '../../types';
import { useToast } from '../../context/ToastContext';

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<JobRequirement[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  
  // Application State
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const { showToast } = useToast();

  useEffect(() => {
    // 1. Load Jobs
    setJobs(jobRequirements.filter(j => j.status === 'OPEN'));
    
    // 2. Load User and their applications
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u: User = JSON.parse(storedUser);
      setCurrentUser(u);
      
      // Find jobs this user has already applied to
      const userApplications = candidates
        .filter(c => c.userId === u.id)
        .map(c => c.applied_role_id);
      setAppliedJobIds(userApplications);
    }
  }, []);

  const handleApplyClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyingJobId(jobId);
    setResumeFile(null);
  };

  const handleCancel = () => {
    setApplyingJobId(null);
    setResumeFile(null);
    setIsProcessing(false);
  };

  const toggleDetails = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !applyingJobId || !currentUser) return;

    setIsProcessing(true);
    try {
      // 1. Parse Resume
      const parsedData = await parseResumeFile(resumeFile);
      
      // 2. Save Candidate (linked to User ID)
      await saveCandidate(resumeFile, parsedData, applyingJobId, currentUser.id);

      // 3. Update UI
      setAppliedJobIds(prev => [...prev, applyingJobId]);
      showToast("Application submitted successfully!", "success");
      setApplyingJobId(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to submit application. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Job Board</h1>
        <p className="text-gray-500">Explore open positions and join our team.</p>
      </div>

      <div className="grid gap-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
             <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">No open positions at the moment.</p>
          </div>
        ) : (
          jobs.map(job => {
            const isApplied = appliedJobIds.includes(job.id);
            const isApplying = applyingJobId === job.id;
            const isExpanded = expandedJobId === job.id;

            return (
              <div key={job.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all ${isApplying ? 'ring-2 ring-purple-500' : ''}`}>
                <div 
                  className="flex flex-col md:flex-row md:items-start justify-between gap-4 cursor-pointer"
                  onClick={() => toggleDetails(job.id)}
                >
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                          {job.department}
                        </span>
                        {isApplied && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Applied
                          </span>
                        )}
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       {job.role_name}
                       {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                     </h3>
                     <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> Remote / Hybrid
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Full-time
                        </div>
                        <div className="flex items-center gap-1">
                           <Briefcase className="w-4 h-4" /> {job.minimum_years_experience}+ Years Exp
                        </div>
                     </div>
                     
                     <div className="mt-4">
                       <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</p>
                       <div className="flex flex-wrap gap-2">
                         {job.required_skills.map(skill => (
                           <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                             {skill}
                           </span>
                         ))}
                       </div>
                     </div>

                     {/* Expanded Details: Responsibilities & Education */}
                     {isExpanded && (
                        <div className="mt-6 pt-4 border-t border-gray-100 animate-fade-in space-y-6">
                            {job.responsibilities && job.responsibilities.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-500" /> Key Responsibilities
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-1">
                                        {job.responsibilities.map((resp, idx) => (
                                            <li key={idx} className="leading-relaxed">{resp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {job.education_level && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-purple-500" /> Education Requirements
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {job.education_level}
                                    </p>
                                </div>
                            )}
                        </div>
                     )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-end gap-3 min-w-[150px]">
                     {!isApplied && !isApplying && (
                       <button 
                         onClick={(e) => handleApplyClick(job.id, e)}
                         className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm z-10 relative"
                       >
                         Apply Now
                       </button>
                     )}
                     {isApplied && (
                       <button disabled className="w-full bg-gray-100 text-gray-400 px-6 py-2 rounded-lg font-medium cursor-not-allowed border border-gray-200">
                         Applied
                       </button>
                     )}
                  </div>
                </div>

                {/* Application Form Drawer */}
                {isApplying && (
                  <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
                    <h4 className="font-semibold text-gray-800 mb-4">Submit Your Application</h4>
                    <form onSubmit={handleSubmitApplication} className="space-y-4">
                      <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50 text-center relative">
                         <input 
                           type="file" 
                           accept=".pdf,.docx,.doc"
                           required
                           onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         />
                         <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                         <p className="text-sm text-gray-700 font-medium">
                           {resumeFile ? resumeFile.name : "Click to upload your resume"}
                         </p>
                         <p className="text-xs text-purple-400 mt-1">PDF or DOCX (Max 5MB)</p>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button 
                          type="button" 
                          onClick={handleCancel}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isProcessing || !resumeFile}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/> Processing...</> : 'Submit Application'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobBoard;
