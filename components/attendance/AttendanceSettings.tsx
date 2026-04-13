import React, { useState, useEffect } from 'react';
import { Save, Loader2, MapPin, Globe, Clock, ShieldCheck } from 'lucide-react';
import { attendanceApi, AttendancePolicy } from '../../services/attendanceApi';
import { useToast } from '../../context/ToastContext';

const TimeInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({
  label, value, onChange, hint,
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">{label}</label>
    <input
      type="time"
      value={value.slice(0, 5)}
      onChange={(e) => onChange(e.target.value + ':00')}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-800"
    />
    {hint && <p className="text-[10px] text-gray-400 font-medium italic">{hint}</p>}
  </div>
);

const EnforceSelect: React.FC<{ label: string; field: 'enforce_ip' | 'enforce_location'; value: string; onChange: (v: string) => void }> = ({ label, field, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">{label}</label>
    <select
      value={value || 'off'}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
    >
      <option value="off">Disabled — No restriction</option>
      <option value="flag">Alert — Flag as suspicious</option>
      <option value="block">Enforce — Reject check-in</option>
    </select>
  </div>
);

const AttendanceSettings: React.FC = () => {
  const { showToast } = useToast();
  const [policy, setPolicy] = useState<Partial<AttendancePolicy>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipInput, setIpInput] = useState('');

  useEffect(() => {
    attendanceApi.getPolicy()
      .then((p) => {
        setPolicy(p);
        setIpInput(Array.isArray(p.allowed_ips) ? p.allowed_ips.join(', ') : '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setField = (field: keyof AttendancePolicy, val: any) =>
    setPolicy((p) => ({ ...p, [field]: val }));

  const useMyIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const { ip } = await res.json();
      const existing = ipInput ? ipInput.trim() : '';
      const newVal = existing ? (existing.endsWith(',') ? existing + ' ' + ip : existing + ', ' + ip) : ip;
      setIpInput(newVal);
      showToast('Current IP detected and added.', 'info');
    } catch {
      showToast('Could not detect public IP address', 'error');
    }
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField('office_latitude', parseFloat(pos.coords.latitude.toFixed(6)));
        setField('office_longitude', parseFloat(pos.coords.longitude.toFixed(6)));
        showToast('Office coordinates synchronized with your GPS.', 'success');
      },
      () => showToast('Location access denied by browser.', 'error'),
      { timeout: 8000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ips = ipInput
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);
      const updated = await attendanceApi.updatePolicy({ ...policy, allowed_ips: ips });
      setPolicy(updated);
      setIpInput(Array.isArray(updated.allowed_ips) ? updated.allowed_ips.join(', ') : '');
      showToast('Global configuration updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-gray-100">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
      <span className="text-[10px] font-semibold text-gray-400 tracking-wide">Loading Policy Defs...</span>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in font-sans pb-20">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Check-In Window */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-6 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2.5 rounded-2xl text-green-600">
                <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Clock-In Matrix</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <TimeInput label="Earliest Sign-In" value={policy.check_in_start || '07:00:00'} onChange={(v) => setField('check_in_start', v)} hint="Window opens" />
            <TimeInput label="Punctuality Limit" value={policy.check_in_end || '09:00:00'} onChange={(v) => setField('check_in_end', v)} hint="Base deadline" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Grace Threshold (Min)</label>
              <input type="number" min={0} max={60} value={policy.late_grace_minutes ?? 15}
                onChange={(e) => setField('late_grace_minutes', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" />
              <p className="text-[10px] text-gray-400 font-medium italic">Buffer after deadline</p>
            </div>
            <TimeInput label="Absence Trigger" value={policy.absent_if_no_checkin_by || '11:00:00'} onChange={(v) => setField('absent_if_no_checkin_by', v)} hint="Auto-absent after" />
          </div>
        </div>

        {/* Check-Out Window */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-6 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600">
                <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Clock-Out Matrix</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <TimeInput label="Half-Day Boundary" value={policy.half_day_if_checkout_before || '13:00:00'} onChange={(v) => setField('half_day_if_checkout_before', v)} hint="Prior = HALF_DAY" />
            <TimeInput label="Window Authorization" value={policy.check_out_start || '16:00:00'} onChange={(v) => setField('check_out_start', v)} hint="Earliest allowed" />
          </div>
          <TimeInput label="Standard Shift End" value={policy.check_out_end || '18:00:00'} onChange={(v) => setField('check_out_end', v)} hint="Target work day completion" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* IP Security */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-6 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-600">
                <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Network Isolation</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Authorized IP Pool</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="e.g. 192.168.1.1, 10.0.0.1"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={useMyIp}
                  className="px-4 py-2 text-[10px] font-semibold text-sm tracking-wide border-2 border-orange-100 text-orange-600 rounded-2xl hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all whitespace-nowrap"
                >
                  Capture My IP
                </button>
              </div>
            </div>
            <EnforceSelect label="Enforcement Protocol" field="enforce_ip" value={(policy.enforce_ip as string)} onChange={(v) => setField('enforce_ip', v)} />
          </div>
        </div>

        {/* Location Security */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-6 shadow-xl shadow-gray-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-600">
                <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Geofence Registry</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Latitude Reference</label>
              <input type="number" step="0.000001" value={policy.office_latitude ?? ''} onChange={(e) => setField('office_latitude', parseFloat(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Longitude Reference</label>
              <input type="number" step="0.000001" value={policy.office_longitude ?? ''} onChange={(e) => setField('office_longitude', parseFloat(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" />
            </div>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="w-full py-3 text-[10px] font-semibold text-sm tracking-wide border-2 border-purple-100 text-purple-600 rounded-2xl hover:bg-purple-500 hover:border-purple-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Sync GPS Coordinates
          </button>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">Authorized Radius</label>
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">{policy.office_radius_meters ?? 200}m</span>
            </div>
            <input
              type="range" min={50} max={1000} step={50}
              value={policy.office_radius_meters ?? 200}
              onChange={(e) => setField('office_radius_meters', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner"
            />
          </div>
          <EnforceSelect label="Accuracy Protocol" field="enforce_location" value={(policy.enforce_location as string)} onChange={(v) => setField('enforce_location', v)} />
        </div>
      </div>

      <div className="flex justify-end">
        <button
            onClick={handleSave}
            disabled={saving}
            className="group relative flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 text-white px-12 py-4 rounded-lg font-semibold text-sm tracking-wide text-xs transition-all shadow-2xl shadow-orange-500/30 active:scale-95 disabled:cursor-not-allowed"
        >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />}
            {saving ? 'Syncing...' : 'Lock Configuration'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceSettings;
