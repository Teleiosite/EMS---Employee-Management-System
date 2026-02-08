
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, CheckCircle, Briefcase, MapPin, Clock } from 'lucide-react';
import { jobRequirements } from '../services/mockData';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handlePlaceholderClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const scrollToJobs = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('careers-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyClick = () => {
    // Redirect to login with a return URL to the applicant job board
    navigate('/login?redirect=/applicant/jobs');
  };

  // Get only open jobs
  const openJobs = jobRequirements.filter(job => job.status === 'OPEN');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xl font-bold text-orange-600 tracking-tight">EMS</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" onClick={handlePlaceholderClick} className="text-gray-500 hover:text-orange-600 font-medium transition-colors">Home</a>
              <a href="#" onClick={handlePlaceholderClick} className="text-gray-500 hover:text-orange-600 font-medium transition-colors">About Us</a>
              <a href="#careers" onClick={scrollToJobs} className="text-gray-500 hover:text-orange-600 font-medium transition-colors">Careers</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-orange-500/30"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Manage Your Team <br/>
            <span className="text-orange-500">Efficiently & Seamlessly</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            The all-in-one platform to streamline your HR processes, from payroll and attendance to leave management and announcements. Empower your workforce and simplify your administration.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button 
               onClick={() => navigate('/login')}
               className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
             >
               Get Started <ArrowRight className="w-5 h-5" />
             </button>
             <button 
               onClick={scrollToJobs}
               className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
             >
               <Briefcase className="w-5 h-5" /> View Openings
             </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
             {[
               "Automated Payroll Processing",
               "Real-time Attendance Tracking",
               "Seamless Leave Management"
             ].map((feature, i) => (
               <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                 <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                 <span className="font-medium text-gray-700">{feature}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Careers Section */}
      <div id="careers-section" className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Growing Team</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We are looking for talented individuals to help us build the future of workforce management. Check out our open positions below.
            </p>
          </div>

          <div className="grid gap-6 max-w-4xl mx-auto">
            {openJobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Open Positions</h3>
                <p className="text-gray-500">Check back later for new opportunities.</p>
              </div>
            ) : (
              openJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                        {job.department}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{job.role_name}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> Remote / Hybrid
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Full-time
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> {job.minimum_years_experience}+ Years Exp
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.required_skills.slice(0, 4).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <button 
                      onClick={handleApplyClick}
                      className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Apply Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
