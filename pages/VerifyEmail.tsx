import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { confirmEmailVerification } from '../services/authApi';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided in the URL.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await confirmEmailVerification(token);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Failed to verify email. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 text-center border-t-4 border-orange-500">
        
        {loading && (
          <div className="py-8">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
            <p className="text-gray-500">Please wait while we confirm your address.</p>
          </div>
        )}

        {!loading && success && (
          <div className="py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email Verified!</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Your email address has been successfully verified. Your account is now fully active.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
            >
              Log In to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}

        {!loading && error && (
          <div className="py-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Failed</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              {error}
            </p>
            <div className="space-y-3">
               <button 
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
               >
                Return to Login
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
