
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginWithBackend, registerApplicantWithBackend } from '../services/authApi';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For Signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await loginWithBackend(email, password);
        login(user); // Update context state

          // Superuser (platform host) goes to host dashboard
          if ((user as any).isSuperuser) {
            navigate('/host');
          } else if (user.role === UserRole.ADMIN || user.role === UserRole.HR_MANAGER) {
            navigate('/admin');
          } else if (user.role === UserRole.EMPLOYEE) {
            navigate('/employee');
          } else {
            navigate('/applicant');
          }
      } else {
        await registerApplicantWithBackend(name, email, password);
        const user = await loginWithBackend(email, password);
        login(user);
        navigate('/applicant');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('EMAIL_NOT_VERIFIED')) {
        setError('Please check your email and click the verification link to log in. Check your spam folder if you do not see it.');
      } else {
        setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-orange-100 p-3 rounded-xl inline-flex mb-4">
          <Building className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">HireWix</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-gray-800">
             {isLogin ? 'Sign in to your account' : 'Create an Applicant Account'}
           </h2>
           <p className="text-gray-500 mt-2 text-sm">
             {isLogin ? 'Or start your journey with us' : 'Join us to find your dream job'}
           </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold text-lg transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium hover:underline block w-full"
          >
            {isLogin ? "Don't have an account? Create an Applicant Account" : "Already have an account? Sign In"}
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/register')}
            className="text-gray-500 hover:text-gray-700 text-xs font-medium hover:underline"
          >
            Not on HireWix? <span className="font-bold text-orange-600">Register your company workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
