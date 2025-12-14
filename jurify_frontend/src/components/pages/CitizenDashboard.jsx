import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { caseService } from '../../services/caseService';
import { authService } from '../../services/authService';

// List of Indian States
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

import {
    FaHome,
    FaFolderOpen,
    FaUserCheck,
    FaCalendarAlt,
    FaEnvelope,
    FaCog,
    FaSignOutAlt,
    FaSearch
} from 'react-icons/fa';

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl transform transition-all scale-100 animate-bounceIn">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-green-600">check</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Updated!</h3>
                <p className="text-gray-500 text-center mb-6">Your profile details have been successfully saved.</p>
                <button
                    onClick={onClose}
                    className="bg-[#11676a] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-md w-full"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

const CitizenDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({ totalCases: 0, activeCases: 0, pendingCases: 0, resolvedCases: 0 });
    const [recentCases, setRecentCases] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [loading, setLoading] = useState(true);

    // New states for custom loading/success UI
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch fresh profile data to ensure we have latest details
                const profileRes = await authService.getProfile();

                // Update local storage if needed or just use the response
                // For this component we can use the response or rely on the auth context updating
                // But since auth context might not update automatically, let's use a local user state or merge

                const [statsRes, casesRes] = await Promise.all([
                    caseService.getCaseStats(),
                    caseService.getMyCases()
                ]);
                setStats(statsRes);
                setRecentCases(casesRes);

                // We'll update a local 'profile' state to show the details
                setProfile(profileRes);
                setEditForm(profileRes || {});
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        // Validation
        const phone = editForm.phone || '';
        if (phone && !/^\d{10}$/.test(phone)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }

        setIsSaving(true);
        try {
            await authService.updateProfile(editForm);
            setProfile(editForm);
            setIsEditing(false);
            setIsSaving(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Failed to update profile", error);
            setIsSaving(false);
            alert("Failed to update profile.");
        }
    };

    const toggleEditMode = () => {
        if (isEditing) {
            // Cancel -> Revert
            setEditForm(profile);
        }
        setIsEditing(!isEditing);
    };

    const MaterialIcon = ({ name, className = "" }) => (
        <span className={`material-symbols-outlined align-middle ${className}`}>
            {name}
        </span>
    );

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: FaHome },
        { id: 'cases', label: 'My Cases', icon: FaFolderOpen },
        { id: 'verification', label: 'Verification', icon: FaUserCheck },
        { id: 'schedule', label: 'Schedule', icon: FaCalendarAlt },
        { id: 'messages', label: 'Messages', icon: FaEnvelope },
        { id: 'profile', label: 'Profile', icon: FaUserCheck },
        { id: 'settings', label: 'Settings', icon: FaCog },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans relative">

            {/* Custom Success Modal */}
            <SuccessModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

            {/* --- SIDEBAR --- */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#11676a] text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-xl flex flex-col justify-between p-6`}
            >
                <div>
                    {/* Logo Area */}
                    <div className="flex items-center gap-2 mb-6">
                        <Logo />
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            {user?.firstName?.charAt(0) || 'C'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-lg font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-sm text-gray-200 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <hr className="border-t border-white/30 mb-6" />

                    {/* Navigation */}
                    <nav className="flex flex-col gap-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-md transition w-full text-left ${activeTab === item.id
                                        ? 'bg-white/10 text-white font-medium shadow-sm'
                                        : 'text-blue-100 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon className="text-2xl" />
                                    <span className="text-lg">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-white/20 mt-6 pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 rounded-md w-full text-left text-lg text-blue-100 hover:bg-white/5 hover:text-red-400 transition"
                    >
                        <FaSignOutAlt className="text-2xl" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* --- MOBILE OVERLAY --- */}
            {
                sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )
            }

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Top Header (Mobile Only / Breadcrumbs) */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 md:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-gray-500 hover:text-[#11676a]"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <MaterialIcon name="menu" className="text-2xl" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 capitalize">
                            {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-[#11676a] transition relative">
                            <MaterialIcon name="notifications" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Dynamic Content based on activeTab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-[#11676a] to-[#0f5a5d] rounded-2xl p-8 text-white shadow-lg">
                                <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
                                <p className="text-blue-100 max-w-xl">
                                    You have {stats.activeCases} active cases. We've updated the lawyer matching algorithm for better results.
                                </p>
                                <button className="mt-6 bg-white text-[#11676a] px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow">
                                    Check Status
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Cases', value: stats.totalCases, icon: 'folder', color: 'bg-blue-50 text-blue-600' },
                                    { label: 'Pending', value: stats.pendingCases, icon: 'hourglass_empty', color: 'bg-yellow-50 text-yellow-600' },
                                    { label: 'Active', value: stats.activeCases, icon: 'play_circle', color: 'bg-green-50 text-green-600' },
                                    { label: 'Resolved', value: stats.resolvedCases, icon: 'check_circle', color: 'bg-purple-50 text-purple-600' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                                            <MaterialIcon name={stat.icon} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-bold text-gray-800 mb-4 text-lg">Recent Cases</h3>
                                <div className="space-y-3">
                                    {recentCases.length > 0 ? (
                                        recentCases.slice(0, 3).map((legalCase) => (
                                            <div key={legalCase.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <MaterialIcon name="description" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900">{legalCase.title}</p>
                                                        <p className="text-xs text-gray-500">Updated {new Date(legalCase.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded ${legalCase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    legalCase.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {legalCase.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No recent cases found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            {/* Profile Header with Status */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold">My Profile</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profile?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {profile?.verificationStatus || 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-gray-500">Manage your personal information and preferences.</p>
                                    {profile?.documentUrl && (
                                        <a
                                            href={profile.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#11676a] text-sm font-semibold hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            <MaterialIcon name="visibility" className="text-sm" /> View Identity Document
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {isEditing ? (
                                        <>
                                            <button onClick={toggleEditMode} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateProfile}
                                                className="bg-[#11676a] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-md flex items-center gap-2"
                                                disabled={isSaving}
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="bg-[#11676a] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-sm flex items-center gap-2">
                                            <MaterialIcon name="edit" className="text-sm" />
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Profile Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={isEditing ? editForm.firstName || '' : profile?.firstName || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={isEditing ? editForm.lastName || '' : profile?.lastName || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                {/* Email (Always Read Only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400">(Read-only)</span></label>
                                    <input
                                        type="text"
                                        value={profile?.email || ''}
                                        disabled
                                        className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-lg mr-1">🇮🇳</span>
                                            <span className="text-gray-500 font-medium text-sm">+91</span>
                                            <div className="h-4 w-px bg-gray-300 mx-2"></div>
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={isEditing ? editForm.phone || '' : profile?.phone || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setEditForm(prev => ({ ...prev, phone: val })); // Only update local state
                                            }}
                                            disabled={!isEditing}
                                            placeholder="9876543210"
                                            className={`w-full pl-24 p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                        />
                                    </div>
                                    {isEditing && editForm.phone && editForm.phone.length !== 10 && (
                                        <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={isEditing ? (editForm.dob || '').split('T')[0] : (profile?.dob || '').split('T')[0]}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={isEditing ? editForm.gender || '' : profile?.gender || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600 disabled:opacity-100'}`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                {/* Address Fields */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 mt-2 border-b pb-1">Address Details</h3>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                    <textarea
                                        rows={2}
                                        name="addressLine1"
                                        value={isEditing ? editForm.addressLine1 || '' : profile?.addressLine1 || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg resize-none ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={isEditing ? editForm.city || '' : profile?.city || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    {isEditing ? (
                                        <select
                                            name="state"
                                            value={editForm.state || ''}
                                            onChange={handleProfileChange}
                                            className="w-full p-2 border rounded-lg border-primary bg-white focus:ring-2 ring-primary/20"
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="state"
                                            value={profile?.state || ''}
                                            disabled
                                            className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={isEditing ? editForm.pincode || '' : profile?.pincode || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={isEditing ? editForm.country || '' : profile?.country || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div >
    );
};

export default CitizenDashboard;
