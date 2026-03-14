import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, User, Lock, Mail, Briefcase, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api' : '/api');

const CompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    company_slug: '',
    admin_email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Auto-generate slug from company name
    if (name === 'company_name') {
      setForm(prev => ({
        ...prev,
        company_name: value,
        company_slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/tenant-register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail || Object.values(data).flat().join(' ');
        throw new Error(detail || 'Registration failed.');
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome aboard!</h2>
          <p className="text-gray-500 mb-1">Your company workspace has been created.</p>
          <p className="text-gray-400 text-sm">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500 p-3 rounded-2xl shadow-lg">
              <Building className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">Create Your Company</h1>
          <p className="text-gray-500 mt-2">Set up your EMS workspace in seconds</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="company_name"
                  type="text"
                  required
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                  className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Company Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Company Slug <span className="text-xs font-normal text-gray-400">(auto-generated)</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="company_slug"
                  type="text"
                  required
                  value={form.company_slug}
                  onChange={handleChange}
                  placeholder="acme-corporation"
                  className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-mono"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">This is your unique identifier. Must be lowercase with hyphens.</p>
            </div>

            <hr className="border-gray-100" />
            <p className="text-sm font-semibold text-gray-600">Admin Account Details</p>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="first_name" type="text" required value={form.first_name} onChange={handleChange} placeholder="John"
                    className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input name="last_name" type="text" value={form.last_name} onChange={handleChange} placeholder="Doe"
                  className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="admin_email" type="email" required value={form.admin_email} onChange={handleChange} placeholder="admin@acme.com"
                  className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} placeholder="At least 8 characters"
                  className="pl-10 w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60 mt-2">
              {loading ? 'Creating workspace...' : (<>Create Company Workspace <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegister;
