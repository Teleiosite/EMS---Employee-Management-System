import React, { useState } from 'react';
import { Mail, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import { EmployeeProfile } from '../../types';

type Employee = EmployeeProfile & { name: string; email: string };

interface EmployeeTableProps {
  data: Employee[];
  deletingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddFirst: () => void;
  searchTerm: string;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  deletingId,
  onEdit,
  onDelete,
  onAddFirst,
  searchTerm
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const toggleActionMenu = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  return (
    <div className="overflow-x-auto font-sans">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/50 border-b border-gray-100">
          <tr className="text-[10px] uppercase text-gray-400 font-semibold tracking-[0.15em]">
            <th className="px-6 py-5 whitespace-nowrap">Identity</th>
            <th className="px-6 py-5 whitespace-nowrap">Staff ID</th>
            <th className="px-6 py-5 whitespace-nowrap">Department</th>
            <th className="px-6 py-5 whitespace-nowrap">Designation</th>
            <th className="px-6 py-5 whitespace-nowrap">Monthly Pay</th>
            <th className="px-6 py-5 whitespace-nowrap text-center">Lifecycle</th>
            <th className="px-6 py-5 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((emp) => (
            <tr key={emp.id} className={`group transition-all duration-200 hover:bg-gray-50/80 ${deletingId === emp.id ? 'opacity-30 blur-[1px]' : ''}`}>
              <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{emp.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{emp.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-[10px] font-semibold text-gray-400 tracking-wide bg-gray-100 px-2 py-1 rounded-lg">
                  {emp.employeeId}
                </span>
              </td>
              <td className="px-6 py-5 text-sm text-gray-600 font-bold">{emp.department}</td>
              <td className="px-6 py-5 text-sm text-gray-500 font-medium">{emp.designation}</td>
              <td className="px-6 py-5 text-sm font-semibold text-gray-900">${(emp.grossPay || emp.baseSalary).toLocaleString()}</td>
              <td className="px-6 py-5 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold text-sm tracking-wide shadow-sm border ${
                    emp.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200 shadow-green-500/10' : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {emp.status}
                </span>
              </td>
              <td className="px-6 py-5 text-right relative">
                <div className="flex justify-end gap-2 items-center">
                  <button type="button" className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all shadow-sm">
                    <Mail className="w-4 h-4" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleActionMenu(emp.id)}
                      className={`p-2 rounded-xl transition-all ${activeActionId === emp.id ? 'bg-orange-100 text-orange-600 shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeActionId === emp.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveActionId(null)}></div>
                        <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl py-2 z-20 border border-gray-100 transform origin-top-right animate-in zoom-in-95 duration-200">
                          <button
                            type="button"
                            onClick={() => { setActiveActionId(null); onEdit(emp.id); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-3 transition-colors"
                          >
                            <Edit className="w-4 h-4" /> Update Profile
                          </button>
                          <div className="h-px bg-gray-50 my-1 mx-2"></div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionId(null);
                              onDelete(emp.id);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Terminate Access
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                    <UserPlus className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-semibold text-xs text-xs mb-8">
                    {searchTerm ? 'No staff matched your query criteria.' : 'The human directory is currently empty.'}
                  </p>
                  {!searchTerm && (
                    <button
                      type="button"
                      onClick={onAddFirst}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm tracking-wide text-xs shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                    >
                      Initialize Onboarding
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
