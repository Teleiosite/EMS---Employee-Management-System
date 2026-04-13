import React, { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, ShieldCheck, AlertCircle, Calendar, LogIn, Power, MoreVertical, Zap, Layers, Key, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  subscription_tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  created_at: string;
  user_count: number;
  ai_usage_count: number;
}

interface InviteCode {
  id: number;
  code: string;
  label: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
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
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<TenantSummary | null>(null);

  const fetchStats = () => {
    setLoading(true);
    api.get<HostStats>('/core/host/stats/')
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);



  const handleToggleStatus = async (tenant: TenantSummary) => {
    setUpdatingId(tenant.id);
    try {
      await api.patch(`/core/host/tenants/${tenant.id}/`, {
        is_active: !tenant.is_active
      });
      fetchStats();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeTier = async (tenantId: number, newTier: string) => {
    setUpdatingId(tenantId);
    try {
      await api.patch(`/core/host/tenants/${tenantId}/`, {
        subscription_tier: newTier
      });
      fetchStats();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const executeImpersonate = async (tenantId: number) => {
    setImpersonateTarget(null);
    setUpdatingId(tenantId);
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const BASE = (import.meta as any).env?.VITE_API_BASE_URL || (isLocalhost ? 'http://localhost:8000/api' : '/api');
      
      const res = await fetch(`${BASE}/auth/impersonate/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || `Server error: ${res.status}`);
      }
      
      const mappedUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        isSuperuser: false,
      };
      
      localStorage.setItem('user', JSON.stringify(mappedUser));
      window.location.href = '/#/admin';
      window.location.reload();
    } catch (err: any) {
      alert(`Login As failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-red-800 rounded-2xl p-5 text-center max-w-md">
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
    { label: 'Growth Tracking', value: stats?.recent_signups?.length ?? 0, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-6">
      {/* Impersonation Confirmation Modal */}
      {impersonateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setImpersonateTarget(null)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-orange-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <LogIn className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Tenant Impersonation</h3>
            <p className="text-gray-400 text-center text-sm mb-8">
              You will be logged in as an administrator for <span className="text-white font-semibold">{impersonateTarget.name}</span>. This will end your current host session.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => executeImpersonate(impersonateTarget.id)}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => setImpersonateTarget(null)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-orange-400 text-sm font-semibold tracking-wide">Platform Owner</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Host Command Center</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all tenant organizations.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Refresh Stats
        </button>
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

      {/* Companies Management Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            Tenant Management
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/30 text-left border-b border-gray-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tier / AI Usage</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {stats?.recent_signups?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No tenants registered on this platform.</p>
                    </div>
                  </td>
                </tr>
              ) : stats?.recent_signups?.map(t => (
                <tr key={t.id} className={`hover:bg-gray-800/20 transition-colors ${!t.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base">{t.name}</span>
                      <span className="text-gray-500 text-xs font-mono lowercase">{t.slug}.ems.com</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={t.subscription_tier}
                          disabled={updatingId === t.id}
                          onChange={(e) => handleChangeTier(t.id, e.target.value)}
                          className={`bg-gray-800 border-none rounded-md px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-orange-500 ${
                            t.subscription_tier === 'ENTERPRISE' ? 'text-purple-400' : 
                            t.subscription_tier === 'PRO' ? 'text-blue-400' : 'text-gray-400'
                          }`}
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-1">
                        <Zap className="w-3 h-3 text-orange-400" />
                        <span>AI Parsed: <b>{t.ai_usage_count}</b></span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md text-gray-300">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      {t.user_count}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(t)}
                      disabled={updatingId === t.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        t.is_active 
                          ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' 
                          : 'bg-red-500/10 text-red-500 hover:bg-green-500/10 hover:text-green-500'
                      }`}
                      title={t.is_active ? "Clique to Suspend" : "Click to Reactivate"}
                    >
                      <Power className="w-3 h-3" />
                      {t.is_active ? 'ACTIVE' : 'SUSPENDED'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImpersonateTarget(t)}
                        disabled={updatingId !== null}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingId === t.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogIn className="w-3.5 h-3.5" />
                        )}
                        {updatingId === t.id ? 'Connecting...' : 'Login As'}
                      </button>
                    </div>
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
