import React, { useState, useEffect } from 'react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { useToast } from '../../context/ToastContext';
import { Save, Loader2, Sparkles, Key, FileText, CheckCircle2 } from 'lucide-react';

const AISettings: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [isActive, setIsActive] = useState(true);
    const [apiKey, setApiKey] = useState('');
    const [promptTemplate, setPromptTemplate] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await recruitmentApi.getAISettings();
            setIsActive(data.is_active);
            setPromptTemplate(data.prompt_template || '');
            // We don't get the API key back, it's write-only, but if the object exists
            // the backend implies the key is either set or empty.
        } catch (err: any) {
            console.error('Failed to load settings:', err);
            showToast('Failed to load AI settings', 'error');
        } finally {
            setLoading(false);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-600" /> AI Resume Parsing
                    </h1>
                    <p className="text-gray-500 mt-1">Configure Google Gemini to automatically extract data from applicant resumes.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <form onSubmit={handleSave} className="p-6 space-y-8">

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                            <h3 className="font-semibold text-gray-800">Enable AI Parsing</h3>
                            <p className="text-sm text-gray-500">When disabled, the system will use a mock parser for demonstrations.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="space-y-6">
                        {/* API Key */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Key className="w-4 h-4 text-gray-400" />
                                Google Gemini API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter new API Key (leave blank to keep existing)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                            />
                            <p className="text-xs text-gray-500">
                                Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a>.
                            </p>
                        </div>

                        {/* Prompt Template */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <FileText className="w-4 h-4 text-gray-400" />
                                Prompt Instructions
                            </label>
                            <textarea
                                value={promptTemplate}
                                onChange={(e) => setPromptTemplate(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow font-mono text-sm leading-relaxed"
                                placeholder="Instructions on what JSON schema the AI should return..."
                            />
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-800">Required JSON Keys</h4>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Your prompt must request the following exact JSON keys for the parser to work: <br />
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">name</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">email</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">phone</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">skills</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">experience_years</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">headline</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">education</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">experience</code>
                                            <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-0.5">summary</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Save Configuration</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AISettings;
