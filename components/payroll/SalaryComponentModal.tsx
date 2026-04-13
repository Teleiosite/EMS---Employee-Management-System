import React from 'react';
import { X, Save } from 'lucide-react';

interface SalaryComponent {
  id?: number;
  name: string;
  component_type: 'EARNING' | 'DEDUCTION';
  description?: string;
}

interface SalaryComponentModalProps {
  show: boolean;
  editingComp: SalaryComponent | null;
  formData: { name: string; component_type: 'EARNING' | 'DEDUCTION'; description: string };
  setFormData: (data: any) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

const SalaryComponentModal: React.FC<SalaryComponentModalProps> = ({
  show,
  editingComp,
  formData,
  setFormData,
  onClose,
  onSave
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSave}>
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 text-sm">{editingComp ? 'Edit Component' : 'New Salary Component'}</h3>
            <button type="button" onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">Quick Select Templates</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Housing', type: 'EARNING' },
                  { name: 'Transport', type: 'EARNING' },
                  { name: 'Pension', type: 'DEDUCTION' },
                  { name: 'Income Tax', type: 'DEDUCTION' }
                ].map(template => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, name: template.name, component_type: template.type as any })}
                    className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-[11px] font-medium text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors shadow-sm"
                  >
                    + {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Component Name</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-colors text-sm text-gray-800"
                placeholder="e.g. Housing Allowance"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Component Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, component_type: 'EARNING' })}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-colors ${
                    formData.component_type === 'EARNING' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Earning
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, component_type: 'DEDUCTION' })}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-colors ${
                    formData.component_type === 'DEDUCTION' 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Deduction
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none h-20 resize-none transition-colors text-sm text-gray-600"
                placeholder="Describe the purpose of this component..."
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button type="submit" className="flex-1 bg-orange-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryComponentModal;
