import React, { useState } from 'react';
import { Download, Printer, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { PayrollRecord } from '../../types';

interface PayslipTableProps {
  loading: boolean;
  data: PayrollRecord[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

const PayslipTable: React.FC<PayslipTableProps> = ({
  loading,
  data,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onEdit,
  onDelete,
  onDownload
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-2 text-gray-500">Loading payroll records...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-20">
      <table className="w-full text-left font-sans">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
            <th className="px-6 py-4 w-12">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
              />
            </th>
            <th className="px-6 py-4">Employee</th>
            <th className="px-6 py-4">Designation</th>
            <th className="px-6 py-4">Base Salary</th>
            <th className="px-6 py-4 text-center">Net Salary</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <tr 
                key={record.id} 
                className={`transition-all duration-200 ${isSelected ? 'bg-orange-50/50' : 'hover:bg-gray-50/80'}`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(record.id)}
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{record.name}</div>
                  <div className="text-[10px] text-gray-400 font-semibold text-sm tracking-wide">ID: {record.employeeId}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{record.designation}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">${record.baseSalary.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100 italic">
                    ${record.netSalary.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-sm tracking-wide ${
                    record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    record.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); onDownload(record.id); }}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all" 
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all" title="Print Payslip">
                      <Printer className="w-5 h-5" />
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleActionMenu(record.id); }}
                        className={`p-2 rounded-xl transition-all ${activeActionId === record.id ? 'bg-orange-100 text-orange-600 shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeActionId === record.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveActionId(null)}></div>
                          <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl py-2 z-20 border border-gray-100 transform origin-top-right animate-in zoom-in-95 duration-200">
                            <button
                              type="button"
                              onClick={() => { setActiveActionId(null); onEdit(record.id); }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors"
                            >
                              <Edit className="w-4 h-4" /> Edit Record
                            </button>
                            <div className="h-px bg-gray-50 my-1 mx-2"></div>
                            <button
                              type="button"
                              onClick={() => { setActiveActionId(null); onDelete(record.id); }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Record
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-gray-400 font-semibold text-xs text-xs">No payroll cycles found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PayslipTable;
