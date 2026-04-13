import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Edge, 
    Node, 
    Position,
    ConnectionLineType,
    Handle,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { employeesApi } from '../services/employeesApi';
import { 
    Users, 
    Search, 
    Maximize2, 
    LayoutGrid,
    ChevronRight,
    Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom Node Component
const EmployeeNode = ({ data }: any) => {
    const navigate = useNavigate();
    return (
        <div className="px-4 py-3 shadow-md rounded-xl bg-white border border-gray-100 min-w-[200px] group hover:border-orange-200 transition-all">
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-orange-300 border-none" />
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                    {data.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{data.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight truncate">{data.designation}</p>
                </div>
                <button 
                    onClick={() => navigate(`/admin/employees/edit/${data.id}`)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-orange-50 rounded-lg transition-all"
                >
                    <ChevronRight className="w-4 h-4 text-orange-500" />
                </button>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-orange-400 border-none" />
        </div>
    );
};

const nodeTypes = {
    employeeNode: EmployeeNode,
};

const OrganizationChart: React.FC = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await employeesApi.list();
                setEmployees(data);
            } catch (err) {
                console.error('Failed to fetch employees for org chart:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Manual hierarchy mapping for layout
        // For a simple version, we'll just stack them. 
        // A complex layout would require dagre, but we'll use a basic level-based positioning.
        
        const levels: { [key: string]: number } = {};
        const getLevel = (id: string): number => {
            if (levels[id] !== undefined) return levels[id];
            const emp = employees.find(e => e.id === id);
            if (!emp || !emp.reportsTo) {
                levels[id] = 0;
                return 0;
            }
            levels[id] = getLevel(emp.reportsTo.id) + 1;
            return levels[id];
        };

        employees.forEach(emp => getLevel(emp.id));

        const levelCounts: { [key: number]: number } = {};
        
        employees.forEach((emp) => {
            const level = levels[emp.id] || 0;
            const xOffset = levelCounts[level] || 0;
            levelCounts[level] = xOffset + 1;

            nodes.push({
                id: emp.id,
                type: 'employeeNode',
                data: { 
                    name: emp.name, 
                    designation: emp.designation,
                    id: emp.id 
                },
                position: { x: xOffset * 280, y: level * 150 },
            });

            if (emp.reportsTo) {
                edges.push({
                    id: `e${emp.reportsTo.id}-${emp.id}`,
                    source: emp.reportsTo.id,
                    target: emp.id,
                    type: ConnectionLineType.SmoothStep,
                    animated: true,
                    style: { stroke: '#f97316', strokeWidth: 2 },
                });
            }
        });

        return { nodes, edges };
    }, [employees]);

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium tracking-wide">Drawing Org Structure...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-7 h-7 text-orange-500" />
                        Organization Chart
                    </h1>
                    <p className="text-sm text-gray-500">Visualize the workforce hierarchy and reporting lines in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                        <Maximize2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="h-[700px] bg-gray-50/50 rounded-2xl border border-gray-100 shadow-inner overflow-hidden relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    connectionLineType={ConnectionLineType.SmoothStep}
                >
                    <Background color="#ccc" gap={20} />
                    <Controls />
                    <Panel position="top-right" className="flex flex-col gap-2">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 space-y-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legend</h4>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                Reporting Line
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
                                Employee Node
                            </div>
                        </div>
                    </Panel>
                    <Panel position="bottom-left">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-lg text-sm font-medium text-gray-500 flex items-center gap-3">
                            <LayoutGrid className="w-4 h-4 text-orange-500" />
                            Total Nodes: {nodes.length}
                            <span className="w-px h-4 bg-gray-200"></span>
                            <Building className="w-4 h-4 text-orange-500" />
                            Total Depth: {Math.max(...nodes.map(n => n.position.y / 150), 0) + 1}
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

export default OrganizationChart;
