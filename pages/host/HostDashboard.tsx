import React, { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api' : '/api');

interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
}

interface HostStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  recent_signups: TenantSummary[];
}

const HostDashboard: React.FC = () => {
  const [stats, setStats] = useState<HostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${API_BASE_URL}/core/host/stats/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('Access denied or endpoint unavailable.');
        return r.json();
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-red-800 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Companies', value: stats?.total_tenants ?? 0, icon: Building2, color: 'from-orange-500 to-orange-600' },
    { label: 'Active Companies', value: stats?.active_tenants ?? 0, icon: ShieldCheck, color: 'from-green-500 to-green-600' },
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'New This Month', value: stats?.recent_signups?.length ?? 0, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-500/20 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-orange-400 text-sm font-semibold uppercase tracking-widest">Platform Owner</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Host Command Center</h1>
        <p className="text-gray-400 mt-1">Monitor all companies using your EMS platform.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {metricCards.map(card => (
          <div key={card.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
            <div className={`bg-gradient-to-br ${card.color} p-3 rounded-xl shrink-0`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">{card.value.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            Registered Companies
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats?.recent_signups?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No companies registered yet.</td>
                </tr>
              ) : stats?.recent_signups?.map(t => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{t.name}</td>
                  <td className="px-6 py-4 font-mono text-gray-400 text-xs">{t.slug}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      {t.user_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      {t.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
