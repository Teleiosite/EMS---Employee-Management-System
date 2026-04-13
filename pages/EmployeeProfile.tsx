import React, { useState, useEffect } from 'react';
import {
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    Building,
    Briefcase,
    Calendar,
    Hash,
    DollarSign,
    Loader2,
    AlertCircle,
    Shield
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface EmployeeProfileData {
    id: string;
    employeeId: string;
    department: string;
    designation: string;
    baseSalary: number;
    joiningDate: string;
    phoneNumber: string;
    address: string;
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    reportsTo?: { id: string; name: string; designation: string } | null;
}

const EmployeeProfile: React.FC = () => {
    const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Fetch the current employee's own profile via the /me/ endpoint
            const p = await api.get<any>('/employees/profiles/me/');

            if (p && !p.detail) {
                setProfile({
                    id: String(p.id),
                    employeeId: p.employee_id || '',
                    department: p.department?.name || p.department || 'N/A',
                    designation: p.designation?.title || p.designation || 'N/A',
                    baseSalary: parseFloat(p.base_salary) || 0,
                    joiningDate: p.joining_date || '',
                    phoneNumber: p.phone_number || '',
                    address: p.address || '',
                    status: p.status || 'ACTIVE',
                    firstName: p.user?.first_name || '',
                    lastName: p.user?.last_name || '',
                    email: p.user?.email || '',
                    role: p.user?.role || '',
                    reportsTo: p.reports_to ? {
                        id: String(p.reports_to.id),
                        name: p.reports_to.name,
                        designation: p.reports_to.designation
                    } : null,
                });
            }
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile data from the server.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700';
            case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-700';
            case 'TERMINATED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading profile...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const displayName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : user?.firstName + ' ' + (user?.lastName || '');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
                <p className="text-sm text-gray-500">View your personal and employment details.</p>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-24 relative">
                    <div className="absolute inset-0 bg-white/10 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                </div>
                <div className="px-6 pb-6 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
                        <div className="w-20 h-20 rounded-full bg-white border border-white shadow-md flex flex-shrink-0 items-center justify-center text-2xl font-bold text-orange-500 overflow-hidden relative">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                displayName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 sm:pb-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{displayName}</h2>
                                {profile && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(profile.status)}`}>
                                        {profile.status.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                            {profile && (
                                <p className="text-gray-500 text-sm flex items-center gap-2">
                                    <span className="font-medium text-gray-700">{profile.designation}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span>{profile.department}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {profile ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-orange-500" />
                            Personal Information
                        </h3>
                        <div className="space-y-2">
                            <InfoRow icon={Mail} label="Email Address" value={profile.email} />
                            <InfoRow icon={Phone} label="Phone Number" value={profile.phoneNumber || 'Not provided'} />
                            <InfoRow icon={MapPin} label="Home Address" value={profile.address || 'Not provided'} />
                            <InfoRow icon={Shield} label="System Role" value={profile.role} />
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-orange-500" />
                            Employment Details
                        </h3>
                        <div className="space-y-2">
                            <InfoRow icon={Hash} label="Employee ID" value={profile.employeeId} />
                            <InfoRow icon={Building} label="Department" value={profile.department} />
                            <InfoRow icon={Briefcase} label="Designation" value={profile.designation} />
                            <InfoRow
                                icon={Calendar}
                                label="Joining Date"
                                value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                }) : 'N/A'}
                            />
                            <InfoRow
                                icon={DollarSign}
                                label="Base Salary"
                                value={`$${profile.baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            />
                            {profile.reportsTo && (
                                <InfoRow 
                                    icon={UserIcon} 
                                    label="Reports To" 
                                    value={`${profile.reportsTo.name} (${profile.reportsTo.designation})`} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900">No Profile Found</h3>
                    <p className="text-sm text-gray-500 mt-1">Your employee profile has not been set up yet. Contact an administrator.</p>
                </div>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 group p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
        <div className="p-2 bg-white border border-gray-100 shadow-sm rounded-lg text-gray-400 group-hover:text-orange-500 group-hover:border-orange-200 transition-colors">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
            <p className="text-sm text-gray-900 font-medium truncate">{value}</p>
        </div>
    </div>
);

export default EmployeeProfile;
