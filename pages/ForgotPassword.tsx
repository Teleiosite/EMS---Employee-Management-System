import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { requestPasswordReset } from '../services/authApi';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
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
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mt-2">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold text-lg transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <br/>
              <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
