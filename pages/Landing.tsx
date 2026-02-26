import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, CheckCircle, Briefcase, MapPin, Clock } from 'lucide-react';
import { recruitmentApi } from '../services/recruitmentApi';
import { JobRequirement } from '../types';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [openJobs, setOpenJobs] = useState<JobRequirement[]>([]);

  useEffect(() => {
    recruitmentApi.listPublicJobs()
      .then((jobs) => setOpenJobs(jobs.filter((job) => job.status === 'OPEN')))
      .catch(() => setOpenJobs([]));
  }, []);

  const handlePlaceholderClick = (e: React.MouseEvent) => e.preventDefault();
  const scrollToJobs = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('careers-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleApplyClick = () => navigate('/login?redirect=/applicant/jobs');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-orange-100 p-2 rounded-lg"><Building className="w-6 h-6 text-orange-600" /></div>
              <span className="text-xl font-bold text-orange-600 tracking-tight">EMS</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" onClick={handlePlaceholderClick} className="text-gray-500 hover:text-orange-600 font-medium">Home</a>
              <a href="#" onClick={handlePlaceholderClick} className="text-gray-500 hover:text-orange-600 font-medium">About Us</a>
              <a href="#careers" onClick={scrollToJobs} className="text-gray-500 hover:text-orange-600 font-medium">Careers</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-orange-600 font-medium">Login</button>
              <button onClick={() => navigate('/login')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium">Sign Up</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">Manage Your Team <br /><span className="text-orange-500">Efficiently & Seamlessly</span></h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">The all-in-one platform to streamline your HR processes across payroll, attendance, leave, recruitment, and employee operations.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => navigate('/login')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2">Get Started <ArrowRight className="w-5 h-5" /></button>
          <button onClick={scrollToJobs} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"><Briefcase className="w-5 h-5" /> View Openings</button>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {['Automated Payroll Processing', 'Real-time Attendance Tracking', 'Seamless Leave Management'].map((feature) => (
            <div key={feature} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg"><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium text-gray-700">{feature}</span></div>
          ))}
        </div>
      </div>

      <div id="careers-section" className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Growing Team</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We are looking for talented individuals to help us build the future of workforce management.</p>
          </div>
          <div className="grid gap-6 max-w-4xl mx-auto">
            {openJobs.length === 0 ? <div className="text-center py-12 bg-white rounded-2xl shadow-sm border"><Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No Open Positions</h3></div> : openJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">{job.department}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">{job.role_name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500"><div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Remote / Hybrid</div><div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Full-time</div><div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.minimum_years_experience}+ Years Exp</div></div>
                </div>
                <button onClick={handleApplyClick} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2">Apply Now <ArrowRight className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
