import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calculator, DollarSign, ArrowRight, Loader2, PlusCircle } from 'lucide-react';
import { payrollApi } from '../services/payrollApi';
import { useToast } from '../context/ToastContext';

interface Props {
    employeeId: string;
    baseSalary: number;
    onUpdate?: () => void;
}

interface NewComponentForm {
    name: string;
    component_type: 'EARNING' | 'DEDUCTION';
    value: string;
}

const CompensationTab: React.FC<Props> = ({ employeeId, baseSalary, onUpdate }) => {
    const [allComponents, setAllComponents] = useState<any[]>([]);
    const [myStructure, setMyStructure] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Form for adding new component to list
    const [showAddForm, setShowAddForm] = useState(false);
    const [newComp, setNewComp] = useState<NewComponentForm>({ name: '', component_type: 'EARNING', value: '' });

    useEffect(() => {
        fetchData();
    }, [employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [comps, structureRes] = await Promise.all([
                payrollApi.listSalaryComponents(),
                payrollApi.getSalaryStructure(employeeId)
            ]);
            setAllComponents(comps);
            
            // structureRes is likely a list or filtered results
            const structure = Array.isArray(structureRes) ? structureRes[0] : structureRes;
            setMyStructure(structure);
            if (structure && structure.components) {
                setItems(structure.components);
            }
        } catch (err) {
            console.error('Failed to fetch compensation data', err);
            showToast('Failed to load compensation data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newComp.name.trim() || !newComp.value) {
            showToast('Please enter a component name and amount.', 'error');
            return;
        }

        // Check if we have a matching global component to link; otherwise use inline name
        const matchedGlobal = allComponents.find(
            c => c.name.toLowerCase() === newComp.name.trim().toLowerCase()
        );

        const newItem = matchedGlobal
            ? {
                component: matchedGlobal.id,
                component_name: matchedGlobal.name,
                component_type: matchedGlobal.component_type,
                value: parseFloat(newComp.value) || 0
              }
            : {
                component_name: newComp.name.trim(),
                component_type: newComp.component_type,
                value: parseFloat(newComp.value) || 0,
                // No linked global component — will be saved as an inline entry
              };

        setItems([...items, newItem]);
        setNewComp({ name: '', component_type: 'EARNING', value: '' });
        setShowAddForm(false);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = {
                employee: parseInt(employeeId),
                effective_date: new Date().toISOString().split('T')[0],
                components: items.map(item => ({
                    ...(item.component ? { component: item.component } : {}),
                    component_name: item.component_name,
                    component_type: item.component_type,
                    value: item.value
                }))
            };

            if (myStructure && myStructure.id) {
                await payrollApi.updateSalaryStructure(myStructure.id, data);
            } else {
                await payrollApi.saveSalaryStructure(data);
            }

            showToast('Salary structure updated successfully!', 'success');
            if (onUpdate) onUpdate();
            fetchData();
        } catch (err: any) {
            console.error('Failed to save structure', err);
            showToast(err.message || 'Failed to save salary structure.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Calculations
    const earnings = items.filter(i => i.component_type === 'EARNING').reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
    const deductions = items.filter(i => i.component_type === 'DEDUCTION').reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
    const gross = (baseSalary || 0) + earnings;
    const net = gross - deductions;

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Compensation & Benefits</h3>
                    <p className="text-gray-500 text-sm">Manage recurring allowances and deductions for this employee.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Components List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Component Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="bg-orange-50/30">
                                    <td className="px-6 py-4 font-medium text-gray-900 italic">Base Salary</td>
                                    <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">Basic</span></td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">${baseSalary.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center text-gray-400 text-xs">-</td>
                                </tr>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.component_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                item.component_type === 'EARNING' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.component_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {item.component_type === 'DEDUCTION' ? '-' : '+'}${parseFloat(item.value).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => removeItem(idx)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                            No additional components added yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50/30 transition-all font-black uppercase tracking-widest text-xs group"
                        >
                            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Add Allowance or Deduction
                        </button>
                    ) : (
                        <div className="bg-white border-2 border-orange-100 rounded-[2rem] p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Component Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Label Name</label>
                                    <input
                                        type="text"
                                        list="comp-suggestions"
                                        autoFocus
                                        value={newComp.name}
                                        onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                                        placeholder="e.g. Health Allowance"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-bold text-gray-800 transition-all"
                                    />
                                    <datalist id="comp-suggestions">
                                        {allComponents.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Amount */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recurring Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={newComp.value}
                                            onChange={(e) => setNewComp({ ...newComp, value: e.target.value })}
                                            className="w-full p-3 pl-8 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none font-black text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Type toggle */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewComp({ ...newComp, component_type: 'EARNING' })}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                                            newComp.component_type === 'EARNING'
                                            ? 'border-green-500 bg-green-50 text-green-700 shadow-lg shadow-green-500/10'
                                            : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                                        }`}
                                    >
                                        + Allowance
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewComp({ ...newComp, component_type: 'DEDUCTION' })}
                                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                                            newComp.component_type === 'DEDUCTION'
                                            ? 'border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-500/10'
                                            : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                                        }`}
                                    >
                                        − Deduction
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleAddItem}
                                    className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-500 transition-all shadow-xl shadow-gray-900/10 hover:shadow-orange-500/20"
                                >
                                    Add Entry
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-3 bg-white text-gray-400 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Summary Card */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 text-gray-800 shadow-2xl relative overflow-hidden group">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                        
                        <div className="relative z-10">
                            <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 border-b border-gray-50 pb-4">Net Pay Estimation</h4>
                            
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Base Salary</span>
                                    <span className="font-black text-gray-900">${baseSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Total Benefits</span>
                                    <span className="text-green-500 font-black">+{earnings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-5 border-y border-gray-50 my-2">
                                    <span className="text-gray-900 font-black uppercase text-xs tracking-widest">Gross Pay</span>
                                    <span className="text-2xl font-black text-gray-900 tracking-tighter">${gross.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Deductions</span>
                                    <span className="text-red-500 font-black">-{deductions.toLocaleString()}</span>
                                </div>
                                
                                <div className="pt-8 mt-4 border-t-4 border-orange-500 flex flex-col items-end">
                                    <span className="text-orange-500 font-black uppercase text-[10px] tracking-[0.4em] mb-1">Take-Home Pay</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-gray-900 tracking-tighter">${net.toLocaleString()}</span>
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">/mo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50/50 border border-orange-100 rounded-3xl p-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 flex-shrink-0">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                                <strong>System Note:</strong> Recurring structures are applied automatically during generation. For one-time bonuses, navigate to the Payroll processing module.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompensationTab;
