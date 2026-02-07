import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Mail, Lock } from 'lucide-react';
import { mockCredentials } from '../services/mockData';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      // Logic to check credentials
      if (email === mockCredentials.admin.email && password === mockCredentials.admin.password) {
        localStorage.setItem('user', JSON.stringify(mockCredentials.admin.user));
        navigate('/admin');
      } else if (email === mockCredentials.employee.email && password === mockCredentials.employee.password) {
        localStorage.setItem('user', JSON.stringify(mockCredentials.employee.user));
        navigate('/employee');
      } else {
        setError('Invalid email or password. Try admin@ems.com / admin');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-orange-100 p-3 rounded-xl inline-flex mb-4">
          <Building className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">EMS</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-gray-800">Sign in to your account</h2>
           <p className="text-gray-500 mt-2 text-sm">Or start your journey with us</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mr-2" />
              Remember me
            </label>
            <a href="#" className="text-orange-600 font-medium hover:text-orange-700">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold text-lg transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
           <p>Demo Credentials:</p>
           <p>Admin: admin@ems.com / admin</p>
           <p>Employee: john.doe@ems.com / 123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;