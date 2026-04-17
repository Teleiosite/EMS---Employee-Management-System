import React, { useState } from 'react';
import { PlusCircle, Settings, Edit, Trash2, Loader2, Plus } from 'lucide-react';

interface SalaryComponent {
  id: number;
  name: string;
  component_type: 'EARNING' | 'DEDUCTION';
  description?: string;
}

interface SalaryComponentGridProps {
  loading: boolean;
  components: SalaryComponent[];
  onEdit: (comp: SalaryComponent) => void;
  onDelete: (id: number) => void;
  onCreateNew: () => void;
}

const SalaryComponentGrid: React.FC<SalaryComponentGridProps> = ({
  loading,
  components,
  onEdit,
  onDelete,
  onCreateNew
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <span className="text-gray-400 font-semibold text-sm tracking-wide text-xs font-sans">Fetching Definitions...</span>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="p-5">
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
          <div className="relative inline-block mb-6">
            <Settings className="w-20 h-20 text-gray-200 animate-pulse" />
            <PlusCircle className="w-8 h-8 text-orange-400 absolute -bottom-2 -right-2 bg-white rounded-full shadow-lg" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-400 uppercase tracking-tighter mb-2 font-sans">No Components Defined</h3>
          <p className="text-gray-400 font-medium max-w-sm mx-auto mb-8 font-sans">Ready to start configuring? Create your first global salary component now!</p>
          <button 
            onClick={onCreateNew}
            className="bg-white text-orange-600 font-bold px-8 py-3 rounded-2xl shadow-xl shadow-orange-500/10 border border-orange-100 hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 mx-auto font-sans"
          >
            <Plus className="w-5 h-5" /> Start Configuration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((comp) => {
          const isEarning = comp.component_type === 'EARNING';
          return (
            <div key={comp.id} className="relative group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 transition-all hover:shadow-2xl hover:shadow-orange-100 hover:-translate-y-1">
              {/* Decorative Background Icon */}
              <div className={`absolute -right-4 -bottom-4 opacity-[0.03] transform rotate-12 transition-transform group-hover:scale-125 group-hover:rotate-0`}>
                {isEarning ? <PlusCircle className="w-32 h-32 text-green-600" /> : <Settings className="w-32 h-32 text-red-600" />}
              </div>

              <div className="relative z-10 font-sans">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${isEarning ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isEarning ? <PlusCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-semibold text-sm tracking-wide shadow-sm ${
                    isEarning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {comp.component_type}
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{comp.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed mb-6">{comp.description || 'Global salary component for payroll generation.'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Used in Structures</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(comp)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(comp.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Delete Confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Delete Component?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will permanently delete the selected salary component. It will be removed from all associated salary structures.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  onDelete(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryComponentGrid;
