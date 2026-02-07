import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, CheckCircle } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Building className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xl font-bold text-orange-600 tracking-tight">EMS</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-500 hover:text-orange-600 font-medium transition-colors">Home</a>
              <a href="#" className="text-gray-500 hover:text-orange-600 font-medium transition-colors">About Us</a>
              <a href="#" className="text-gray-500 hover:text-orange-600 font-medium transition-colors">Contact Us</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                Login
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-orange-500/30">
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
               onClick={() => navigate('/login')}
               className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
             >
               Employee Login
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
    </div>
  );
};

export default Landing;