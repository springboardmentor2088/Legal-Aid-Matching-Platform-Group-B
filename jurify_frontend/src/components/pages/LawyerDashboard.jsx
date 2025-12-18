/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { caseService } from '../../services/caseService';
import Logo from '../../assets/logo.png';

import {
    FaHome,
    FaFolderOpen,
    FaUserCheck,
    FaCalendarAlt,
    FaEnvelope,
    FaCog,
    FaSignOutAlt,
    FaEdit,
    FaSave,
    FaTimes
} from 'react-icons/fa';

// List of Indian States
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

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

const LawyerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // const location = useLocation(); // Not needed for tab nav

    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Dynamic Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalCases: 0, activeCases: 0, pendingCases: 0, resolvedCases: 0 });
    const [recentCases, setRecentCases] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [profileRes, statsRes, casesRes] = await Promise.all([
                    authService.getProfile(),
                    caseService.getCaseStats().catch(() => ({ totalCases: 0, activeCases: 0, pendingCases: 0, resolvedCases: 0 })),
                    caseService.getMyCases().catch(() => [])
                ]);

                setProfile(profileRes);
                setEditForm(profileRes || {});
                setStats(statsRes);
                setRecentCases(casesRes);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
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

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleUpdateProfile = async () => {
        // Validation
        const phone = editForm.phone || editForm.phoneNumber || '';
        if (phone && !/^\d{10}$/.test(phone)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }

        setIsSaving(true);
        try {
            // Robust Payload Construction
            // We map generic names to lawyer-specific names and vice versa to ensure backend acceptance
            const payload = {
                ...editForm,
                // Ensure Integers
                yearsOfExperience: editForm.yearsOfExperience ? parseInt(editForm.yearsOfExperience) : 0,
                enrollmentYear: editForm.enrollmentYear ? parseInt(editForm.enrollmentYear) : 0,

                // Polyfill Phone
                phone: editForm.phone || editForm.phoneNumber,
                phoneNumber: editForm.phone || editForm.phoneNumber,

                // Polyfill Address
                addressLine1: editForm.addressLine1 || editForm.officeAddressLine1,
                officeAddressLine1: editForm.addressLine1 || editForm.officeAddressLine1,

                // Polyfill Law Firm
                lawFirmName: editForm.lawFirmName,
                lawFirm: editForm.lawFirmName,
                firmName: editForm.lawFirmName,
            };

            await authService.updateProfile(payload);
            setProfile(payload); // Optimistic update with the full payload
            setEditForm(payload); // Sync edit form
            setIsEditing(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleEditMode = () => {
        if (isEditing) {
            setEditForm(profile); // Revert
        }
        setIsEditing(!isEditing);
    };

    const MaterialIcon = ({ name, className = "" }) => (
        <span className={`material-symbols-outlined align-middle ${className}`}>
            {name}
        </span>
    );

    // Sidebar links (ids match activeTab)
    const links = [
        { id: 'overview', name: 'Overview', icon: FaHome },
        { id: 'cases', name: 'My Cases', icon: FaFolderOpen },
        { id: 'verification', name: 'Verification', icon: FaUserCheck },
        { id: 'schedule', name: 'Schedule', icon: FaCalendarAlt },
        { id: 'messages', name: 'Messages', icon: FaEnvelope },
        { id: 'profile', name: 'Profile', icon: FaUserCheck },
        { id: 'settings', name: 'Settings', icon: FaCog },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900 font-sans relative">

            {/* Custom Success Modal */}
            <SuccessModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

            {/* Sidebar */}
            <aside className="bg-[#11676a] text-white w-64 min-h-screen p-6 flex flex-col justify-between sticky top-0 md:relative shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <img src={Logo} alt="Jurify Logo" className="h-20 w-auto object-contain" />
                    </div>
                    {/* User info */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            {user?.firstName?.charAt(0).toUpperCase() || 'L'}
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{user?.firstName || 'Lawyer'}</p>
                            <p className="text-sm text-gray-200 capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <hr className="border-t border-white/30 mb-6" />

                    {/* Navigation links */}
                    <div className="flex flex-col gap-3">
                        {links.map(({ id, name, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-md transition w-full text-left ${activeTab === id ? 'bg-white/10 text-white font-medium shadow-sm' : 'text-blue-100 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Icon className="text-2xl" />
                                <span className="text-lg">{name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
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

            {/* Main Content */}
            <div className="flex-1">
                {/* Top Navigation */}
                <nav className="bg-white shadow-sm border-b border-[#0f5a5d] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0f5a5d] to-[#11676a] capitalize">
                        {links.find(l => l.id === activeTab)?.name || 'Dashboard'}
                    </h2>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative">
                        <MaterialIcon name="notifications" className="text-2xl" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                </nav>

                {/* Dashboard Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-[#11676a] to-[#0f5a5d] rounded-2xl p-8 text-white shadow-lg mb-8">
                                <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h2>
                                <p className="text-blue-100 max-w-xl">
                                    You have {stats.activeCases} active cases. Manage your cases and schedule efficiently.
                                </p>
                                <button
                                    onClick={() => setActiveTab('verification')}
                                    className="mt-6 bg-white text-[#11676a] px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow flex items-center gap-2"
                                >
                                    <MaterialIcon name="verified" /> Check Verification Status
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[
                                    { label: 'Active Cases', value: stats.activeCases, icon: 'gavel', color: 'bg-blue-50 text-[#11676a]' },
                                    { label: 'Pending Requests', value: stats.pendingCases, icon: 'pending_actions', color: 'bg-yellow-50 text-[#11676a]' },
                                    { label: 'Total Cases', value: stats.totalCases, icon: 'folder', color: 'bg-purple-50 text-[#11676a]' },
                                    { label: 'Verification', value: profile?.isVerified ? 'Verified' : 'Pending', icon: 'verified_user', color: profile?.isVerified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 flex flex-col justify-between h-40">
                                        <div className={`p-2 rounded-lg inline-flex ${stat.color}`}>
                                            <MaterialIcon name={stat.icon} />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-gray-800">Recent Cases</h2>
                                        <button className="text-sm text-[#11676a] font-medium hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentCases.length > 0 ? (
                                            recentCases.slice(0, 5).map((c, i) => (
                                                <div key={c.id || i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-800">Case ID: {c.caseNumber || c.id}</p>
                                                        <p className="text-sm text-gray-600">Title: {c.title}</p>
                                                        <p className="text-xs text-gray-500">Status: {c.status}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold mb-2 inline-block ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                            c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>{c.status}</span>
                                                        <button className="block text-sm text-[#11676a] font-medium hover:underline">View Case</button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">No cases found.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800">Upcoming Schedule</h3>
                                            <button className="text-xs text-[#11676a] font-medium hover:underline">Full Calendar</button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center min-w-[3.5rem]">
                                                    <span className="block text-xs font-bold uppercase">Oct</span>
                                                    <span className="block text-xl font-bold">25</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">Hearing: Doe v. State</p>
                                                    <p className="text-xs text-gray-500">9:00 AM - 11:00 AM</p>
                                                    <p className="text-xs text-gray-400">City Courthouse, Room 3B</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center min-w-[3.5rem]">
                                                    <span className="block text-xs font-bold uppercase">Oct</span>
                                                    <span className="block text-xl font-bold">26</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">Meeting with John</p>
                                                    <p className="text-xs text-gray-500">2:30 PM - Virtual</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-8 border-b pb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {user?.role === 'NGO' ? 'NGO Profile' : 'Lawyer Profile'}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profile?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {profile?.verificationStatus || 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-gray-500">Manage your details and contact information.</p>
                                    {profile?.documentUrl && (
                                        <a
                                            href={profile.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#11676a] text-sm font-semibold hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            <FaUserCheck className="text-sm" /> View Verification Document
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {isEditing ? (
                                        <>
                                            <button onClick={toggleEditMode} disabled={isSaving} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                                <FaTimes /> Cancel
                                            </button>
                                            <button onClick={handleUpdateProfile} disabled={isSaving} className="bg-[#11676a] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-md flex items-center gap-2">
                                                {isSaving ? (
                                                    <>
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave /> Save Changes
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="bg-[#11676a] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-sm flex items-center gap-2">
                                            <FaEdit /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Info / Organization Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {user?.role === 'NGO' ? 'Organization Name' : 'First Name'}
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={isEditing ? editForm.firstName || '' : profile?.firstName || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                {user?.role !== 'NGO' && (
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
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400">(Read-only)</span></label>
                                    <input
                                        type="text"
                                        value={profile?.email || ''}
                                        disabled
                                        className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>

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
                                                setEditForm(prev => ({ ...prev, phone: val, phoneNumber: val }));
                                            }}
                                            disabled={!isEditing}
                                            placeholder="9876543210"
                                            className={`w-full pl-24 p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                        />
                                    </div>
                                    {isEditing && (editForm.phone || editForm.phoneNumber) && String(editForm.phone || editForm.phoneNumber).length !== 10 && (
                                        <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
                                    )}
                                </div>

                                {/* Professional Details Section */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 mt-4 border-b pb-1">Professional Details</h3>
                                </div>

                                {/* LAWYER FIELDS */}
                                {user?.role !== 'NGO' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council Number</label>
                                            <input
                                                type="text"
                                                value={profile?.barCouncilNumber || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bar Council State</label>
                                            <input
                                                type="text"
                                                value={profile?.barCouncilState || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Year</label>
                                            <input
                                                type="number"
                                                value={profile?.enrollmentYear || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                            <input
                                                type="number"
                                                name="yearsOfExperience"
                                                value={isEditing ? editForm.yearsOfExperience || '' : profile?.yearsOfExperience || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Law Firm / Chamber</label>
                                            <input
                                                type="text"
                                                name="lawFirmName"
                                                value={isEditing ? editForm.lawFirmName || '' : profile?.lawFirmName || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                                            <input
                                                type="text"
                                                name="languages"
                                                value={isEditing ? editForm.languages || '' : profile?.languages || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* NGO FIELDS */}
                                {user?.role === 'NGO' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                            <input
                                                type="text"
                                                value={profile?.registrationNumber || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                            <input
                                                type="text"
                                                name="contactPersonName"
                                                value={isEditing ? editForm.contactPersonName || '' : profile?.contactPersonName || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Year</label>
                                            <input
                                                type="number"
                                                value={profile?.registrationYear || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Type</label>
                                            <input
                                                type="text"
                                                value={profile?.registrationType || ''}
                                                disabled
                                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                            <input
                                                type="url"
                                                name="websiteUrl"
                                                value={isEditing ? editForm.websiteUrl || '' : profile?.websiteUrl || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Areas</label>
                                            <input
                                                type="text"
                                                name="serviceAreas"
                                                value={isEditing ? editForm.serviceAreas || '' : profile?.serviceAreas || ''}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full p-2 border rounded-lg ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {user?.role === 'NGO' ? 'Description' : 'Bio'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        name="bio"
                                        value={isEditing ? editForm.bio || '' : profile?.bio || ''}
                                        onChange={handleProfileChange}
                                        disabled={!isEditing}
                                        className={`w-full p-2 border rounded-lg resize-none ${isEditing ? 'border-primary bg-white focus:ring-2 ring-primary/20' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                    />
                                </div>

                                {/* Office Address */}
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 mt-4 border-b pb-1">Office Location</h3>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                                    <textarea
                                        rows={2}
                                        name="addressLine1"
                                        value={isEditing ? editForm.addressLine1 || editForm.officeAddressLine1 || '' : profile?.addressLine1 || profile?.officeAddressLine1 || ''}
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
            </div>
        </div>
    );
};

export default LawyerDashboard;

