import React, { useState, useEffect } from 'react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { useToast } from '../../context/ToastContext';
import { Save, Loader2, Sparkles, Key, FileText, CheckCircle2, History, AlertTriangle, Zap, Play, ShieldCheck } from 'lucide-react';

const AISettings: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [isActive, setIsActive] = useState(true);
    const [apiKey, setApiKey] = useState('');
    const [promptTemplate, setPromptTemplate] = useState('');
    const [parseCount, setParseCount] = useState(0);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await recruitmentApi.getAISettings();
            setIsActive(data.is_active);
            setPromptTemplate(data.prompt_template || '');
            setParseCount(data.resume_parse_count || 0);
        } catch (err: any) {
            console.error('Failed to load settings:', err);
            showToast('Failed to load AI settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!apiKey) {
            showToast('Please enter an API Key to test.', 'info');
            return;
        }

        setTesting(true);
        try {
            const res = await recruitmentApi.testAIConnection(apiKey);
            if (res.success) {
                showToast(res.message, 'success');
            } else {
                showToast(res.error || 'Test failed', 'error');
            }
        } catch (err: any) {
            console.error('Test Connection Error:', err);
            showToast(err.response?.data?.error || 'Failed to connect to Gemini API', 'error');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = {
                is_active: isActive,
                prompt_template: promptTemplate
            };

            // Only send API key if it was modified
            if (apiKey) {
                payload.gemini_api_key = apiKey;
            }

            await recruitmentApi.updateAISettings(payload);
            showToast('AI Settings updated successfully', 'success');
            setApiKey(''); // Clear the key field after saving
            fetchSettings(); // Refresh to catch any count updates or confirmed state
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            showToast(err.message || 'Failed to update settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading AI settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header section with usage metrics */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-orange-600" /> AI Resume Intelligence
                    </h1>
                    <p className="text-gray-500 mt-1">Configure Google Gemini to automate your recruitment analysis and ranking.</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg">
                            <History className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total Parses</p>
                            <p className="text-lg font-bold text-gray-800">{parseCount}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Model</p>
                            <p className="text-lg font-bold text-gray-800">1.5 Flash</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                        <form onSubmit={handleSave} className="p-6 space-y-8">

                            {/* Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Enable AI Engine</h3>
                                        <p className="text-xs text-gray-500">If disabled, the system returns raw data only.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>

                            <div className="space-y-6">
                                {/* API Key */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <Key className="w-4 h-4 text-gray-400" />
                                            Google Gemini API Key
                                        </label>
                                        <button 
                                            type="button"
                                            disabled={!apiKey || testing}
                                            onClick={handleTestConnection}
                                            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
                                        >
                                            {testing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Play className="w-3 h-3 group-hover:scale-125 transition-transform"/>}
                                            Test Connection
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="••••••••••••••••••••••••••••••••••••"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow pr-10"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                        Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-bold">Google AI Studio</a>.
                                    </p>
                                </div>

                                {/* Prompt Template */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        Instructional Prompt
                                    </label>
                                    <textarea
                                        value={promptTemplate}
                                        onChange={(e) => setPromptTemplate(e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow font-mono text-xs leading-relaxed"
                                        placeholder="Customize how the AI should interpret resumes..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-gray-900 border border-transparent hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</>
                                    ) : (
                                        <><Save className="w-5 h-5" /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Key Requirements Checklist */}
                    <div className="bg-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Schema Alignment
                        </h3>
                        <p className="text-xs text-blue-100 mb-6 leading-relaxed">
                            To ensure proper data mapping into the EMS profiles, your prompt must instruction the AI to return exactly these keys:
                        </p>
                        <div className="space-y-2">
                            {['name', 'email', 'phone', 'skills', 'experience_years', 'headline', 'education', 'experience', 'summary'].map(key => (
                                <div key={key} className="flex items-center gap-2 text-[11px] font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                                    {key}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Responsibility Notice */}
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                        <div className="flex items-center gap-3 text-amber-800 font-bold mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                Billing & Costs
                        </div>
                        <p className="text-[12px] text-amber-700 leading-relaxed mb-4">
                            By adding your own key, you take full responsibility for consumption and Google Cloud billing. EMS does not charge extra or add a markup for AI features.
                        </p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-amber-900 border-b border-amber-100 pb-1">
                                <span>Plan</span>
                                <span>Free Tier Available</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-amber-900">
                                <span>Usage Limit</span>
                                <span>As per Google Studio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings;

