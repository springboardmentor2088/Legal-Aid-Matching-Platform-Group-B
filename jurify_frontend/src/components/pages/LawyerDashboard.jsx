/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { caseService } from "../../services/caseService";
import {
    FiUsers,
    FiCheckCircle,
    FiBell,
    FiSettings,
    FiSearch,
    FiLogOut,
    FiFileText,
    FiMenu,
    FiX,
    FiUserCheck,
} from "react-icons/fi";
// import Logo from '../../assets/logo.png';
import Logo from "../common/Logo";

// List of Indian States
const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Delhi",
    "Puducherry",
    "Ladakh",
    "Jammu and Kashmir",
];

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
    FaTimes,
    FaBell,
} from "react-icons/fa";

const NotificationDropdown = ({ show, onClose, notifications }) => {
    if (!show) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification, index) => (
                            <div
                                key={index}
                                className="p-3 hover:bg-gray-50 transition cursor-pointer"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <FaBell className="text-blue-600 text-xs" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">
                                            {notification.title || "New Notification"}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {notification.message || notification.description}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {notification.time || "Just now"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBell className="text-gray-400 text-sm" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            No notifications
                        </p>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>

            {notifications && notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                    <button className="w-full text-center text-xs text-primary font-medium hover:text-primary-dark transition">
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

const LawyerDashboard = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    // const location = useLocation(); // Not needed for tab nav

    const [activeTab, setActiveTab] = useState("overview");
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Dynamic Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCases: 0,
        activeCases: 0,
        pendingCases: 0,
        resolvedCases: 0,
    });
    const [recentCases, setRecentCases] = useState([]);
    const [showNotificationDropdown, setShowNotificationDropdown] =
        useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState("");

    useEffect(() => {
        // Show coming soon modal for specific tabs
        if (
            activeTab === "verification" ||
            activeTab === "schedule" ||
            activeTab === "messages" ||
            activeTab === "settings"
        ) {
            setShowComingSoon(true);
            setComingSoonFeature(activeTab);
        }
    }, [activeTab]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [profileRes, statsRes, casesRes] = await Promise.all([
                    authService.getProfile(),
                    caseService.getCaseStats().catch(() => ({
                        totalCases: 0,
                        activeCases: 0,
                        pendingCases: 0,
                        resolvedCases: 0,
                    })),
                    caseService.getMyCases().catch(() => []),
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
        navigate("/login");
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            await authService.updateProfile(editForm);
            setProfile(editForm);
            setIsEditing(false);
            // alert("Profile updated successfully!"); // Removed alert
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusToggle = async () => {
        try {
            // optimistically update
            const newStatus = !profile?.isActive;
            setProfile((prev) => ({ ...prev, isActive: newStatus }));

            await authService.updateDirectoryStatus(newStatus);
            // setProfile(prev => ({ ...prev, isActive: newStatus })); // already done
        } catch (error) {
            console.error("Failed to update directory status", error);
            // revert
            setProfile((prev) => ({ ...prev, isActive: !prev.isActive }));
            alert("Failed to update visibility status.");
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

    const ComingSoonModal = ({ show, onClose, feature }) => {
        if (!show) return null;

        const getFeatureIcon = () => {
            switch (feature) {
                case "verification":
                    return <FiUserCheck className="w-10 h-10 text-white animate-pulse" />;
                case "schedule":
                    return (
                        <FaCalendarAlt className="w-10 h-10 text-white animate-pulse" />
                    );
                case "messages":
                    return <FaEnvelope className="w-10 h-10 text-white animate-pulse" />;
                case "settings":
                    return <FaCog className="w-10 h-10 text-white animate-pulse" />;
                default:
                    return <FiSettings className="w-10 h-10 text-white animate-pulse" />;
            }
        };

        const getFeatureTitle = () => {
            switch (feature) {
                case "verification":
                    return "Verification";
                case "schedule":
                    return "Schedule";
                case "messages":
                    return "Messages";
                case "settings":
                    return "Settings";
                default:
                    return "Feature";
            }
        };

        const getFeatureDescription = () => {
            switch (feature) {
                case "verification":
                    return "This feature is coming soon! We're working hard to bring you comprehensive verification management.";
                case "schedule":
                    return "This feature is coming soon! We're working hard to bring you advanced scheduling capabilities.";
                case "messages":
                    return "This feature is coming soon! We're working hard to bring you a secure messaging system.";
                case "settings":
                    return "This feature is coming soon! We're working hard to bring you comprehensive lawyer settings.";
                default:
                    return "This feature is coming soon! We're working hard to bring you this functionality.";
            }
        };

        return (
            <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
            >
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 text-center transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                    <div className="relative mb-6">
                        <div className="bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 w-20 h-20 shadow-lg border-4 border-white">
                            {getFeatureIcon()}
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {getFeatureTitle()}
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        {getFeatureDescription()}
                    </p>

                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-linear-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                    >
                        Got it
                    </button>
                </div>
            </div>
        );
    };

    // Sidebar links (ids match activeTab)
    const links = [
        { id: "overview", name: "Overview", icon: FaHome },
        { id: "cases", name: "My Cases", icon: FaFolderOpen },
        { id: "verification", name: "Verification", icon: FaUserCheck },
        { id: "schedule", name: "Schedule", icon: FaCalendarAlt },
        { id: "messages", name: "Messages", icon: FaEnvelope },
        { id: "profile", name: "Profile", icon: FaUserCheck },
        { id: "settings", name: "Settings", icon: FaCog },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    // className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 shadow-xl`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-30 flex items-center px-5 border-b border-primary-dark gap-5 shrink-0">
                        {/* Logo */}
                        <div className="flex items-center w-2rem h-10">
                            <Logo />
                        </div>





                        {/* Close button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden ml-auto text-white hover:text-gray-200"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                    {/* User Info */}
                    <div className="p-6 border-b border-primary-dark">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                {user?.firstName?.charAt(0).toUpperCase() || "L"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate">
                                    {user?.firstName || "Lawyer User"}
                                </p>
                                <p className="text-xs text-blue-100 capitalize">
                                    {user?.role?.toLowerCase() || "lawyer"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        {links.map(({ id, name, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setActiveTab(id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === id
                                        ? "bg-white/10 text-white"
                                        : "text-blue-100 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon className="text-xl shrink-0" />
                                <span className="text-base truncate">{name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-dark">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-left text-base text-white bg-primary-dark hover:bg-red-600 transition"
                    >
                        <FaSignOutAlt className="text-xl shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-64">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 hover:text-primary"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-[#11676a] capitalize">
                            {links.find((l) => l.id === activeTab)?.name || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 relative">
                        <button
                            onClick={() =>
                                setShowNotificationDropdown(!showNotificationDropdown)
                            }
                            className="p-2 text-gray-400 hover:text-primary transition relative"
                        >
                            <MaterialIcon name="notifications" />
                            {notifications && notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>

                        <NotificationDropdown
                            show={showNotificationDropdown}
                            onClose={() => setShowNotificationDropdown(false)}
                            notifications={notifications}
                        />
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <>
                            <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        Good morning, {user?.firstName}
                                    </h1>
                                    <p className="text-gray-500 mt-1">
                                        Welcome to your dashboard
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveTab("verification")}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-semibold text-sm w-full sm:w-auto"
                                >
                                    <MaterialIcon name="verified" /> Verification Status
                                </button>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                                {[
                                    {
                                        label: "Active Cases",
                                        value: stats.activeCases,
                                        icon: "gavel",
                                        color: "bg-blue-50 text-primary",
                                    },
                                    {
                                        label: "Pending Requests",
                                        value: stats.pendingCases,
                                        icon: "pending_actions",
                                        color: "bg-yellow-50 text-primary",
                                    },
                                    {
                                        label: "Total Cases",
                                        value: stats.totalCases,
                                        icon: "folder",
                                        color: "bg-purple-50 text-primary",
                                    },
                                    {
                                        label: "Verification",
                                        value: profile?.isVerified ? "Verified" : "Pending",
                                        icon: "verified_user",
                                        color: profile?.isVerified
                                            ? "bg-green-50 text-green-700"
                                            : "bg-yellow-50 text-yellow-700",
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 flex flex-col justify-between min-h-[140px]"
                                    >
                                        <div
                                            className={`p-2 rounded-lg inline-flex w-fit ${stat.color}`}
                                        >
                                            <MaterialIcon name={stat.icon} />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">
                                                {stat.label}
                                            </p>
                                            <h3 className="text-2xl sm:text-2xl font-bold text-gray-900">
                                                {stat.value}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                            Recent Cases
                                        </h2>
                                        <button className="text-sm text-primary font-medium hover:underline">
                                            View All
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentCases.length > 0 ? (
                                            recentCases.slice(0, 5).map((c, i) => (
                                                <div
                                                    key={c.id || i}
                                                    className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-800 truncate">
                                                            Case ID: {c.caseNumber || c.id}
                                                        </p>
                                                        <p className="text-sm text-gray-600 truncate">
                                                            Title: {c.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Status: {c.status}
                                                        </p>
                                                    </div>
                                                    <div className="flex sm:flex-col items-center sm:items-end gap-2">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-semibold ${c.status === "ACTIVE"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : c.status === "PENDING"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : "bg-gray-100 text-gray-600"
                                                                }`}
                                                        >
                                                            {c.status}
                                                        </span>
                                                        <button className="text-sm text-primary font-medium hover:underline whitespace-nowrap">
                                                            View Case
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">No cases found.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800">
                                                Upcoming Schedule
                                            </h3>
                                            <button className="text-xs text-primary font-medium hover:underline">
                                                Full Calendar
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-3 sm:gap-4 items-start">
                                                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center min-w-12 shrink-0">
                                                    <span className="block text-xs font-bold uppercase">
                                                        Oct
                                                    </span>
                                                    <span className="block text-xl font-bold">25</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800">
                                                        Hearing: Doe v. State
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        9:00 AM - 11:00 AM
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        City Courthouse, Room 3B
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 sm:gap-4 items-start">
                                                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center min-w-12 shrink-0">
                                                    <span className="block text-xs font-bold uppercase">
                                                        Oct
                                                    </span>
                                                    <span className="block text-xl font-bold">26</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800">
                                                        Meeting with John
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        2:30 PM - Virtual
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Lawyer Profile Part */}
                    {activeTab === "profile" && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* GREEN HEADER BAND */}
                                <div className="bg-emerald-50 px-5 sm:px-6 py-4 flex items-center justify-between">
                                    {/* LEFT: avatar + title + description */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* Avatar */}
                                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#11676a] text-white flex items-center justify-center text-sm font-semibold">
                                            {(profile?.firstName || user?.name || "L").charAt(0)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                                    Lawyer Profile
                                                </h2>

                                                {/* Verification badge */}
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${profile?.isVerified
                                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                                        }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${profile?.isVerified
                                                                ? "bg-emerald-500"
                                                                : "bg-amber-500"
                                                            }`}
                                                    />
                                                    {profile?.verificationStatus || "Pending"}
                                                </span>

                                                {/* Active Status Toggle */}
                                                <div className="flex items-center gap-2 pl-4 ml-2 sm:ml-4 border-l border-emerald-100">
                                                    <button
                                                        onClick={handleStatusToggle}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#11676a] focus:ring-offset-1 ${profile?.isActive ? "bg-[#11676a]" : "bg-gray-200"
                                                            }`}
                                                        title="Toggle public visibility"
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${profile?.isActive
                                                                    ? "translate-x-6"
                                                                    : "translate-x-1"
                                                                }`}
                                                        />
                                                    </button>
                                                    <span className="text-xs sm:text-sm font-medium text-emerald-900">
                                                        {profile?.isActive
                                                            ? "Available for cases"
                                                            : "Offline"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs sm:text-[13px] text-emerald-900/80">
                                                Manage your professional information, office address,
                                                and public visibility.
                                            </p>

                                            {/* View document LINK just below subtitle */}
                                            {profile?.documentUrl && (
                                                <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5">
                                                    <a
                                                        href={profile.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-800 hover:text-emerald-900"
                                                    >
                                                        <FaUserCheck className="text-sm text-emerald-600" />
                                                        <span className="hover:underline hover:underline-offset-2">
                                                            View verification document
                                                        </span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT: action buttons */}
                                    <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={toggleEditMode}
                                                    disabled={isSaving}
                                                    className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
                                                >
                                                    <FaTimes className="text-xs" />
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleUpdateProfile}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-[#11676a] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0e5658] disabled:opacity-70"
                                                >
                                                    {isSaving ? (
                                                        <span className="material-symbols-outlined text-lg animate-spin">
                                                            progress_activity
                                                        </span>
                                                    ) : (
                                                        <FaSave className="text-xs" />
                                                    )}
                                                    {isSaving ? "Saving..." : "Save changes"}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#11676a] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0e5658]"
                                            >
                                                <FaEdit className="text-xs" />
                                                Edit profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* BODY */}
                                <div className="bg-white p-4 sm:p-6 lg:p-8">
                                    {/* BIO */}
                                    <div className="mb-6 md:mb-8">
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Bio
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                rows={4}
                                                name="bio"
                                                value={editForm.bio || ""}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        ) : (
                                            <p className="w-full text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700 min-h-[80px]">
                                                {profile?.bio || "No bio added yet."}
                                            </p>
                                        )}
                                    </div>

                                    {/* FORM BODY */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 text-sm">
                                        {/* BASIC INFO */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                First name
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={
                                                    isEditing
                                                        ? editForm.firstName || ""
                                                        : profile?.firstName || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Last name
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={
                                                    isEditing
                                                        ? editForm.lastName || ""
                                                        : profile?.lastName || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                <span>Email</span>
                                                <span className="text-[11px] font-normal text-gray-400">
                                                    (Read‑only)
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={profile?.email || ""}
                                                disabled
                                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Date of birth
                                            </label>
                                            <input
                                                type="date"
                                                name="dob"
                                                value={
                                                    isEditing
                                                        ? (editForm.dob || "").split("T")[0]
                                                        : (profile?.dob || "").split("T")[0]
                                                }
                                                onChange={(e) => {
                                                    let v = e.target.value;
                                                    if (!v) {
                                                        handleProfileChange({
                                                            target: { name: "dob", value: "" },
                                                        });
                                                        return;
                                                    }
                                                    let [y, m, d] = v.split("-");
                                                    if (y && y.length > 4) {
                                                        y = y.slice(0, 4);
                                                        v = [y, m, d].join("-");
                                                    }
                                                    handleProfileChange({
                                                        target: { name: "dob", value: v },
                                                    });
                                                }}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Official phone
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-600">
                                                        <span className="text-[11px] font-medium">IN</span>
                                                        <span className="h-3 w-px bg-gray-300" />
                                                        <span className="font-semibold text-[11px]">
                                                            +91
                                                        </span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={
                                                        isEditing
                                                            ? editForm.phone || ""
                                                            : profile?.phone || ""
                                                    }
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                            .replace(/\D/g, "")
                                                            .slice(0, 10);
                                                        setEditForm((prev) => ({ ...prev, phone: val }));
                                                    }}
                                                    disabled={!isEditing}
                                                    placeholder="9845693235"
                                                    className={`w-full text-sm rounded-lg border px-3 py-2.5 pl-20 shadow-sm focus:outline-none transition ${isEditing
                                                            ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                            : "bg-gray-50 border-gray-200 text-gray-700"
                                                        }`}
                                                />
                                            </div>
                                            {isEditing &&
                                                editForm.phone &&
                                                editForm.phone.length !== 10 && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        Phone number must be 10 digits.
                                                    </p>
                                                )}
                                        </div>

                                        {/* PROFESSIONAL DETAILS TITLE */}
                                        <div className="md:col-span-2 pt-2">
                                            <h3 className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Professional details
                                            </h3>
                                        </div>

                                        {/* LAWYER FIELDS */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Bar Council number
                                            </label>
                                            <input
                                                type="text"
                                                value={profile?.barCouncilNumber || ""}
                                                disabled
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Bar Council state
                                            </label>
                                            <input
                                                type="text"
                                                value={profile?.barCouncilState || ""}
                                                disabled
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Enrollment year
                                            </label>
                                            <input
                                                type="number"
                                                value={profile?.enrollmentYear || ""}
                                                disabled
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Years of experience
                                            </label>
                                            <input
                                                type="number"
                                                name="yearsOfExperience"
                                                value={
                                                    isEditing
                                                        ? editForm.yearsOfExperience || ""
                                                        : profile?.yearsOfExperience || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Law firm / chamber
                                            </label>
                                            <input
                                                type="text"
                                                name="lawFirmName"
                                                value={
                                                    isEditing
                                                        ? editForm.lawFirmName || ""
                                                        : profile?.lawFirmName || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Languages
                                            </label>
                                            <input
                                                type="text"
                                                name="languages"
                                                value={
                                                    isEditing
                                                        ? editForm.languages || ""
                                                        : profile?.languages || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        {/* OFFICE LOCATION TITLE */}
                                        <div className="md:col-span-2 pt-2">
                                            <h3 className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Office location
                                            </h3>
                                        </div>

                                        {/* ADDRESS */}
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Address line 1
                                            </label>
                                            <textarea
                                                rows={2}
                                                name="addressLine1"
                                                value={
                                                    isEditing
                                                        ? editForm.addressLine1 || ""
                                                        : profile?.addressLine1 || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={
                                                    isEditing ? editForm.city || "" : profile?.city || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                State
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    name="state"
                                                    value={editForm.state || ""}
                                                    onChange={handleProfileChange}
                                                    className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none border-primary/60 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="">Select state</option>
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
                                                    value={profile?.state || ""}
                                                    disabled
                                                    className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm bg-gray-50 border-gray-200 text-gray-700"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Pincode
                                            </label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={
                                                    isEditing
                                                        ? editForm.pincode || ""
                                                        : profile?.pincode || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={
                                                    isEditing
                                                        ? editForm.country || ""
                                                        : profile?.country || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                        ? "border-primary/60 bg-white focus:ring-2 focus:ring-primary/20"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Coming Soon Tabs */}
                    {activeTab === "verification" && (
                        <div className="w-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="text-center py-8">
                                    <FiUserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        Verification management coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "schedule" && (
                        <div className="w-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="text-center py-8">
                                    <FaCalendarAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        Schedule management coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "messages" && (
                        <div className="w-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="text-center py-8">
                                    <FaEnvelope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        Messaging system coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "settings" && (
                        <div className="w-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="text-center py-8">
                                    <FaCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        Settings management coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Coming Soon Modal */}
            <ComingSoonModal
                show={showComingSoon}
                onClose={() => setShowComingSoon(false)}
                feature={comingSoonFeature}
            />
        </div>
    );
};

export default LawyerDashboard;
