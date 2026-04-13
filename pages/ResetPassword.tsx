import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { confirmPasswordReset } from '../services/authApi';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (!token) throw new Error("Invalid or missing reset token.");
      await confirmPasswordReset(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        {!success ? (
          <>
            <div className="text-center mb-6">
              <div className="bg-orange-100 p-3 rounded-xl inline-flex mb-4">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
              <p className="text-gray-500 text-sm mt-2">
                Your new password must be different from previous used passwords.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm transition-all">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold text-lg transition-all shadow-md mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been changed successfully.<br/>
              You can now log in with your new password.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold text-lg transition-all shadow-md"
            >
              Go to Login
            </button>
          </div>
        )}

        {!success && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
