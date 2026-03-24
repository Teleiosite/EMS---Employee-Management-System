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
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-orange-200 hover:text-orange-500 hover:bg-orange-50/30 transition-all font-medium"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Add Allowance or Deduction
                        </button>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="grid sm:grid-cols-2 gap-3">
                                {/* Component Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Component Name</label>
                                    <input
                                        type="text"
                                        list="comp-suggestions"
                                        value={newComp.name}
                                        onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                                        placeholder="e.g. Housing Allowance"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <datalist id="comp-suggestions">
                                        {allComponents.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Amount */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newComp.value}
                                        onChange={(e) => setNewComp({ ...newComp, value: e.target.value })}
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-right font-bold"
                                    />
                                </div>
                            </div>

                            {/* Type toggle */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewComp({ ...newComp, component_type: 'EARNING' })}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 font-bold text-sm transition-all ${
                                            newComp.component_type === 'EARNING'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                        }`}
                                    >
                                        + Earning / Allowance
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewComp({ ...newComp, component_type: 'DEDUCTION' })}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 font-bold text-sm transition-all ${
                                            newComp.component_type === 'DEDUCTION'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                        }`}
                                    >
                                        − Deduction
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={handleAddItem}
                                    className="flex-1 sm:flex-none bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-all"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 sm:flex-none bg-white text-gray-500 border border-gray-200 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Summary Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calculator className="w-24 h-24" />
                        </div>
                        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-gray-700 pb-2">Payslip Preview</h4>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Monthly Base Salary</span>
                                <span className="font-medium">${baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Total Allowances</span>
                                <span className="text-green-400 font-medium">+{earnings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                <span className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">Gross Salary</span>
                                <span className="text-xl font-extrabold">${gross.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-4">
                                <span className="text-gray-400">Total Deductions</span>
                                <span className="text-red-400 font-medium">-{deductions.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-orange-500/30">
                                <span className="text-orange-400 font-black uppercase text-xs tracking-widest">Estimated Net</span>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-white">${net.toLocaleString()}</span>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Calculated per month</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex gap-3">
                            <ArrowRight className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Note:</strong> Changes saved here will be automatically applied every month when you generate payroll for this employee. Use the Payroll page for one-time bonuses or adjustments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompensationTab;
