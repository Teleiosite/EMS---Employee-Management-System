import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Calendar, MoreVertical, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { announcementsApi } from '../services/announcementsApi';
import { Announcement } from '../types';
import { useToast } from '../context/ToastContext';

const Announcements: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.list();
      setAnnouncements(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements from the server.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleEdit = (id: string) => {
    setActiveActionId(null);
    navigate(`/admin/announcements/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setActiveActionId(null);
      try {
        await announcementsApi.delete(id);
        setAnnouncements(prev => prev.filter(item => item.id !== id));
        showToast('Announcement deleted successfully!', 'success');
      } catch (err) {
        console.error('Failed to delete announcement:', err);
        showToast('Failed to delete announcement.', 'error');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'NORMAL': return 'bg-blue-100 text-blue-700';
      case 'LOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading announcements...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500">View and manage company-wide updates.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/announcements/new')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Announcement
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {announcements.length === 0 && !error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Announcements</h3>
            <p className="text-gray-500 mt-1">There are currently no announcements to display.</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg h-fit ${item.priority === 'HIGH' ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <Megaphone className={`w-6 h-6 ${item.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority} Priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{item.content}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleActionMenu(item.id)}
                    className={`p-2 rounded-full transition-colors ${activeActionId === item.id ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeActionId === item.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveActionId(null)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100 transform origin-top-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;