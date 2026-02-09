import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Upload,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { applicantApi, ApplicantProfile as ApplicantProfileType } from '../../services/applicantApi';
import { useToast } from '../../context/ToastContext';

interface EducationEntry {
  degree: string;
  school: string;
  year?: string;
}

interface ExperienceEntry {
  title: string;
  company: string;
  duration?: string;
  description?: string;
}

const ApplicantProfile: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ApplicantProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    city: '',
    country: '',
    headline: '',
    bio: '',
    years_of_experience: 0,
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  // Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await applicantApi.getProfile();
        setProfile(data);

        // Populate form
        setFormData({
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          headline: data.headline || '',
          bio: data.bio || '',
          years_of_experience: data.years_of_experience || 0,
        });
        setSkills(data.skills || []);
        setEducation(data.education || []);
        setExperience(data.experience || []);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleAddEducation = () => {
    setEducation(prev => [...prev, { degree: '', school: '', year: '' }]);
  };

  const handleUpdateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setEducation(prev => prev.map((edu, i) => i === index ? { ...edu, [field]: value } : edu));
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperience(prev => [...prev, { title: '', company: '', duration: '', description: '' }]);
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    setExperience(prev => prev.map((exp, i) => i === index ? { ...exp, [field]: value } : exp));
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;

    setIsUploadingResume(true);
    try {
      const updatedProfile = await applicantApi.uploadResume(resumeFile);
      setProfile(updatedProfile);
      setResumeFile(null);
      showToast('Resume uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resume', 'error');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = await applicantApi.updateProfile({
        ...formData,
        skills,
        education,
        experience,
      });
      setProfile(updatedProfile);
      showToast('Profile saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500">Keep your profile updated to improve your chances.</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Profile Completeness */}
      {profile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Profile Completeness</span>
            <span className="text-lg font-bold text-purple-600">{profile.profile_completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${profile.profile_completeness}%` }}
            />
          </div>
          {profile.profile_completeness < 100 && (
            <p className="text-sm text-gray-500 mt-2">
              Complete your profile to increase visibility to recruiters.
            </p>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-purple-500" /> Basic Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
              <Mail className="w-4 h-4" />
              {profile?.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleInputChange}
              placeholder="e.g., Senior Software Engineer with 5+ years experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input
              type="number"
              name="years_of_experience"
              value={formData.years_of_experience}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" /> Resume
        </h2>

        {profile?.current_resume ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-green-800">Resume Uploaded</p>
                <p className="text-sm text-green-600">
                  Last updated: {profile.resume_uploaded_at ? new Date(profile.resume_uploaded_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-yellow-800">No resume uploaded yet. Upload your resume to apply for jobs faster.</p>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center relative hover:border-purple-400 transition-colors">
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-700 font-medium">
            {resumeFile ? resumeFile.name : "Click to upload a new resume"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF or DOCX (Max 5MB)</p>
        </div>

        {resumeFile && (
          <button
            onClick={handleResumeUpload}
            disabled={isUploadingResume}
            className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isUploadingResume ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Resume
          </button>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-500" /> Skills
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map(skill => (
            <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {skill}
              <button onClick={() => handleRemoveSkill(skill)} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            placeholder="Add a skill..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" /> Education
          </h2>
          <button
            onClick={handleAddEducation}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus className="w-4 h-4" /> Add Education
          </button>
        </div>

        {education.length === 0 ? (
          <p className="text-gray-500 text-sm">No education entries yet.</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                <button
                  onClick={() => handleRemoveEducation(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                    placeholder="Degree"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => handleUpdateEducation(index, 'school', e.target.value)}
                    placeholder="School/University"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={edu.year || ''}
                    onChange={(e) => handleUpdateEducation(index, 'year', e.target.value)}
                    placeholder="Year"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" /> Experience
          </h2>
          <button
            onClick={handleAddExperience}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus className="w-4 h-4" /> Add Experience
          </button>
        </div>

        {experience.length === 0 ? (
          <p className="text-gray-500 text-sm">No experience entries yet.</p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                <button
                  onClick={() => handleRemoveExperience(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => handleUpdateExperience(index, 'title', e.target.value)}
                    placeholder="Job Title"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(index, 'company', e.target.value)}
                    placeholder="Company"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={exp.duration || ''}
                  onChange={(e) => handleUpdateExperience(index, 'duration', e.target.value)}
                  placeholder="Duration (e.g., Jan 2020 - Present)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                />
                <textarea
                  value={exp.description || ''}
                  onChange={(e) => handleUpdateExperience(index, 'description', e.target.value)}
                  placeholder="Description of your role..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default ApplicantProfile;
