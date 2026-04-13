import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Clock, 
    User as UserIcon, 
    Activity, 
    ChevronDown, 
    ChevronUp,
    ShieldAlert,
    History
} from 'lucide-react';
import { analyticsApi, AuditLogEntry } from '../services/analyticsApi';

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await analyticsApi.getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredLogs = logs.filter(log => 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <History className="w-7 h-7 text-orange-500" />
                        System Audit Logs
                    </h1>
                    <p className="text-sm text-gray-500">Track all administrative changes and data mutations across the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={fetchLogs}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                     >
                        Refresh
                     </button>
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                        Admin Only
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user, resource or action..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading system logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        No audit entries found matching your search.
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <tr className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${expandedLog === log.id ? 'bg-orange-50/30' : ''}`}
                                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-100 rounded-full">
                                                    <UserIcon className="w-3.5 h-3.5 text-gray-600" />
                                                </div>
                                                <span className="font-semibold text-gray-800">{log.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                <Activity className="w-3.5 h-3.5 text-gray-400" />
                                                {log.resource}
                                                <span className="text-gray-400 text-[10px] bg-gray-100 px-1.5 rounded uppercase">{log.resource_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {expandedLog === log.id ? <ChevronUp className="w-4 h-4 ml-auto text-orange-500" /> : <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />}
                                        </td>
                                    </tr>
                                    {expandedLog === log.id && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-6 bg-gray-50/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                                Request Context
                                                            </h4>
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 text-xs">
                                                                <div className="flex justify-between"><span className="text-gray-500">IP Address:</span> <span className="font-mono">{log.ip_address}</span></div>
                                                                <div className="flex flex-col"><span className="text-gray-500 mb-1">User Agent:</span> <span className="text-gray-700 italic">{log.user_agent}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Data Changes</h4>
                                                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-[11px] text-green-400 overflow-x-auto max-h-60">
                                                            <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;
