import React, { useState, useEffect } from 'react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip,
    CartesianGrid,
    Legend
} from 'recharts';
import { 
    Smile, 
    Frown, 
    Meh, 
    TrendingUp, 
    Users, 
    MessageSquare,
    Target,
    Settings,
    Save,
    X,
    Shield
} from 'lucide-react';
import { analyticsApi, SurveyAnalytics, PulseSurvey } from '../services/analyticsApi';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const SurveyDashboard: React.FC = () => {
    const [data, setData] = useState<SurveyAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [survey, setSurvey] = useState<PulseSurvey | null>(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [analyticsResult, activeSurvey] = await Promise.all([
                analyticsApi.getSurveyAnalytics(),
                analyticsApi.getActiveSurvey().catch(() => null)
            ]);
            setData(analyticsResult);
            if (activeSurvey) {
                setSurvey(activeSurvey);
                setEditQuestion(activeSurvey.question);
            }
        } catch (error) {
            console.error('Failed to fetch survey data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!survey) return;
        setIsSaving(true);
        try {
            const updated = await analyticsApi.updateSurvey(survey.id, {
                question: editQuestion,
                is_active: survey.is_active
            });
            setSurvey(updated);
            setShowSettings(false);
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to update survey settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSurveyStatus = async () => {
        if (!survey) return;
        try {
            const updated = await analyticsApi.updateSurvey(survey.id, {
                is_active: !survey.is_active
            });
            setSurvey(updated);
            fetchAnalytics();
        } catch (error) {
            console.error('Failed to toggle survey status:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-medium tracking-wide">Analyzing workforce mood...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const handleExport = () => {
        if (!data) return;
        const csvRows = [
            ['Sentiment', 'Count'],
            ...data.sentiment_analysis.map(s => [s.name, s.count]),
            ['', ''],
            ['Average Happiness', data.average_sentiment.toFixed(2)],
            ['Response Rate', `${data.response_rate.toFixed(2)}%`],
            ['Total Responses', data.total_responses]
        ];
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `workforce_sentiment_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-7 h-7 text-orange-500" />
                        Workforce Insights & Sentiment
                    </h1>
                    <p className="text-sm text-gray-500">Aggregated real-time data from employee pulse surveys.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Settings className="w-4 h-4" />
                        Survey Settings
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Shield className="w-6 h-6" />
                                <h2 className="text-xl font-bold">Engagement Settings</h2>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Question</label>
                                <textarea 
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-medium"
                                    placeholder="Enter survey question..."
                                />
                                <p className="text-[10px] text-gray-400 italic">This question will be shown to all employees on their dashboard.</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 tracking-tight">System Status</h4>
                                    <p className="text-[10px] text-gray-500">Enable or disable the collection of daily mood data.</p>
                                </div>
                                <button 
                                    onClick={toggleSurveyStatus}
                                    className={`w-12 h-6 rounded-full transition-all relative ${survey?.is_active ? 'bg-orange-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${survey?.is_active ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard 
                    label="Avg Happiness" 
                    value={data.average_sentiment.toFixed(1)} 
                    max="/ 5.0"
                    icon={Smile} 
                    color="text-green-500"
                    bg="bg-green-50"
                />
                <MetricCard 
                    label="Response Rate" 
                    value={data.response_rate.toFixed(0)} 
                    max="%"
                    icon={Target} 
                    color="text-blue-500"
                    bg="bg-blue-50"
                />
                <MetricCard 
                    label="Total Feedback" 
                    value={data.total_responses.toString()} 
                    icon={MessageSquare} 
                    color="text-orange-500"
                    bg="bg-orange-50"
                />
                <MetricCard 
                    label="Active Participants" 
                    value={(data.total_responses > 0 ? (data.total_responses / (data.response_rate/100)) : 0).toFixed(0)} 
                    icon={Users} 
                    color="text-indigo-500"
                    bg="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Sentiment Distribution</h3>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.sentiment_analysis}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 12, fill: '#6b7280'}}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{fill: '#f9731610'}}
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {data.sentiment_analysis.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart of Happiness */}
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-800">Mood Breakdown</h3>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.sentiment_analysis}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                >
                                    {data.sentiment_analysis.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Engagement Advisory Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                        <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">HR Action Intelligence</h3>
                </div>
                <p className="text-indigo-100 relative z-10 max-w-2xl text-sm leading-relaxed">
                    Based on current sentiment trends, the general mood is <span className="text-white font-bold">{data.average_sentiment > 3.5 ? 'Positive' : 'Cautious'}</span>. 
                    {data.response_rate < 50 ? ' Consider running an open town hall to increase response participation.' : ' Engagement levels are healthy and stable across departments.'}
                </p>
                <div className="pt-2 relative z-10">
                    <button 
                        onClick={handleExport}
                        className="bg-white text-indigo-700 px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                        Export Report
                    </button>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: string; max?: string; icon: any; color: string; bg: string }> = ({ label, value, max, icon: Icon, color, bg }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            {max && <span className="text-xs font-bold text-gray-300">{max}</span>}
        </div>
        <p className="text-2xl font-black text-gray-900 leading-none mb-1">{value}</p>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
);

export default SurveyDashboard;
