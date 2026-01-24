import React, { useState, useEffect } from "react";
import { formatRelativeTime } from "../../utils/timeUtils";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/Logo";
import logo1 from "../../assets/logo1.png";
import logo4 from "../../assets/logo4.png";
import { caseService } from "../../services/caseService";
import { authService } from "../../services/authService";
import api from "../../services/api";
import { analyticsService } from "../../services/analyticsService";
import { FiMenu, FiX } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { useToast } from "../common/ToastContext";

import Select from "react-select";
import { useTheme } from "../../context/ThemeContext";

// Language Options (Same as Registration)
const languageOptions = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Tamil", label: "Tamil" },
    { value: "Telugu", label: "Telugu" },
    { value: "Kannada", label: "Kannada" },
    { value: "Malayalam", label: "Malayalam" },
    { value: "Marathi", label: "Marathi" },
    { value: "Gujarati", label: "Gujarati" },
    { value: "Bengali", label: "Bengali" },
    { value: "Punjabi", label: "Punjabi" },
    { value: "Urdu", label: "Urdu" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Spanish", label: "Spanish" },
];

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
    FaSearch,
    FaPlus,
    FaAddressBook,
    FaBell,
    FaTimes,
} from "react-icons/fa";
import { FiTrendingUp, FiBriefcase, FiClock, FiFolder, FiCheckCircle } from "react-icons/fi";

import CaseSubmissionForm from "../case/caseSubmissionForm";
import DirectorySearch from "../directory/DirectorySearch";
import MyCases from "./myCase";
import ResolutionDetailsModal from "../case/ResolutionDetailsModal";
import CitizenChat from "../chat/views/CitizenChat";
import ScheduleDashboard from "./ScheduleDashboard";
import { useNotifications } from "../notifications/useNotifications";
import NotificationPage from "../notifications/NotificationPage";
import NotificationPanel from "../notifications/NotificationPanel";
import DarkModeToggle from "../common/DarkModeToggle";
import CaseDistributionChart from "../analytics/CaseDistributionChart";
import ResolutionTrendChart from "../analytics/ResolutionTrendChart";
import StatsCard from "../analytics/StatsCard";
import { CitizenSettings } from "../settings";

const NotificationDropdown = ({ show, onClose, notifications, onNotificationClick, onViewAll }) => {
    if (!show) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-950 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-50">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-primary transition"
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
                                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer ${!notification.read ? 'bg-primary-light border-l-4 border-l-primary dark:bg-blue-900/10' : ''
                                    }`}
                                onClick={() => onNotificationClick && onNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <FaBell className="text-primary text-xs" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
                                            {notification.title || "New Notification"}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                                            {notification.message || notification.description}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatRelativeTime(notification.createdAt || notification.timestamp)}
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
                    <button
                        onClick={() => {
                            onClose();
                            onViewAll && onViewAll();
                        }}
                        className="w-full text-center text-xs text-primary font-medium hover:text-primary-dark transition"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl transform transition-all scale-100 animate-bounceIn border border-gray-100 dark:border-slate-700">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-green-600">
                        check
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Profile Updated!
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-center mb-6">
                    Your profile details have been successfully saved.
                </p>
                <button
                    onClick={onClose}
                    className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-md w-full"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
// Navigation items for the sidebar
const CITIZEN_MENU_ITEMS = [
    { id: "overview", label: "Overview", icon: FaHome },
    { id: "submit-case", label: "Submit Case", icon: FaPlus },
    { id: "cases", label: "My Cases", icon: FaFolderOpen },
    { id: "directory", label: "Directory", icon: FaAddressBook },
    { id: "schedule", label: "Schedule", icon: FaCalendarAlt },
    { id: "messages", label: "Messages", icon: FaEnvelope },
    { id: "profile", label: "Profile", icon: FaUserCheck },
    { id: "settings", label: "Settings", icon: FaCog },
];

const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined align-middle ${className}`}>
        {name}
    </span>
);

const ComingSoonModal = ({ show, onClose, feature }) => {
    if (!show) return null;

    const getFeatureIcon = () => {
        switch (feature) {
            case "schedule":
                return (
                    <FaCalendarAlt className="w-10 h-10 text-white animate-pulse" />
                );
            case "messages":
                return <FaEnvelope className="w-10 h-10 text-white animate-pulse" />;
            case "settings":
                return <FaCog className="w-10 h-10 text-white animate-pulse" />;
            default:
                return <FaCog className="w-10 h-10 text-white animate-pulse" />;
        }
    };

    const getFeatureTitle = () => {
        switch (feature) {
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
            case "schedule":
                return "This feature is coming soon! We're working hard to bring you advanced scheduling capabilities.";
            case "messages":
                return "This feature is coming soon! We're working hard to bring you a secure messaging system.";
            case "settings":
                return "This feature is coming soon! We're working hard to bring you comprehensive citizen settings.";
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
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-8 text-center transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                <div className="relative mb-6">
                    <div className="bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 w-20 h-20 shadow-lg border-4 border-white dark:border-slate-800">
                        {getFeatureIcon()}
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {getFeatureTitle()}
                </h2>
                <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed text-lg">
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

// Helper to parse dates that might be in array format [yyyy, MM, dd, HH, mm]
const parseAppointmentDate = (dateData) => {
    if (!dateData) return null;
    if (Array.isArray(dateData)) {
        const [year, month, day, hour = 0, minute = 0] = dateData;
        return new Date(year, month - 1, day, hour, minute);
    }
    return new Date(dateData);
};

const CitizenDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useTheme();
    const { showToast } = useToast();

    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        // If tab is specified and valid, use it
        if (tab && CITIZEN_MENU_ITEMS.some(item => item.id === tab)) return tab;
        // If caseId is present but no tab, default to schedule
        if (params.get("caseId")) return "schedule";
        return "overview";
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        const caseId = params.get("caseId");

        if (tab) {
            setActiveTab(tab);
        } else if (caseId) {
            // Auto-switch to schedule if caseId is present but no tab
            setActiveTab("schedule");
        }
    }, [location.search]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] =
        useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);

    // Use notifications hook for single source of truth
    const {
        notifications,
        unreadCount,
        markAsRead
    } = useNotifications();
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState("");
    const [stats, setStats] = useState({
        totalCases: 0,
        activeCases: 0,
        pendingCases: 0,
        resolvedCases: 0,
    });
    const [recentCases, setRecentCases] = useState([]);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [resolutionTrend, setResolutionTrend] = useState([]);
    const [caseDistribution, setCaseDistribution] = useState([]);

    // Upcoming Appointments State
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [consultations, setConsultations] = useState([]);
    const [loadingConsultations, setLoadingConsultations] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchUpcomingAppointments();
        }
    }, [user?.id]);

    const fetchUpcomingAppointments = async () => {
        try {
            const response = await api.get('/appointments/upcoming');
            console.log("Fetched upcoming appointments:", response);
            setUpcomingAppointments(response || []);
        } catch (error) {
            console.error("Error fetching upcoming appointments:", error);
            setUpcomingAppointments([]); // Set empty array on error
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchConsultations = async () => {
        try {
            const response = await caseService.getMyConsultations();
            setConsultations(response || []);
        } catch (error) {
            console.error("Error fetching consultations:", error);
            setConsultations([]);
        } finally {
            setLoadingConsultations(false);
        }
    };

    // New states for custom loading/success UI
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Resolution modal state
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState(null);
    const [resolutionData, setResolutionData] = useState(null);
    const [loadingResolution, setLoadingResolution] = useState(false);

    const fetchDashboardData = async () => {
        try {
            // Fetch fresh profile data to ensure we have latest details
            const profileRes = await authService.getProfile();

            const [statsRes, casesRes, insightsRes, consultationsRes] = await Promise.all([
                caseService.getCaseStats(),
                caseService.getMyCases(),
                analyticsService.getCitizenInsights().catch(() => null),
                caseService.getMyConsultations().catch(() => []),
            ]);
            setStats(statsRes);
            setRecentCases(casesRes);
            setConsultations(consultationsRes);

            if (insightsRes) {
                setResolutionTrend(insightsRes.resolutionTrend);
                // Format status distribution for better display if needed, or usage raw
                setCaseDistribution(insightsRes.statusDistribution);
            }

            // We'll update a local 'profile' state to show the details
            setProfile(profileRes);
            setEditForm(profileRes || {});
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time refresh listener
    useEffect(() => {
        const handleRefresh = (event) => {
            console.log("Real-time refresh triggered for citizen dashboard:", event.detail);
            fetchDashboardData();
            fetchUpcomingAppointments();
        };

        window.addEventListener('JURIFY_REFRESH_DATA', handleRefresh);
        return () => window.removeEventListener('JURIFY_REFRESH_DATA', handleRefresh);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    useEffect(() => {
        // Show coming soon modal for specific tabs
        // Settings is now implemented
        if (false) {
            setShowComingSoon(true);
            setComingSoonFeature(activeTab);
        }
    }, [activeTab]);

    const handleLogout = () => {
        showToast({ message: "Logged out successfully", type: "info" });
        logout();
        navigate("/login");
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            markAsRead([notification.id]);
        }

        // Close dropdown
        setShowNotificationDropdown(false);

        // Navigate to messages tab
        navigate("?tab=messages");
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async () => {
        // Validation
        const phone = editForm.phone || "";
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



    // Handle viewing resolution details
    const handleViewResolution = async (caseItem) => {
        setSelectedResolution(caseItem);
        setShowResolutionModal(true);
        setLoadingResolution(true);
        try {
            const resolution = await caseService.getResolution(caseItem.id);
            setResolutionData(resolution);
        } catch (error) {
            console.error("Failed to fetch resolution:", error);
            showToast({ message: "Failed to load resolution details", type: "error" });
        } finally {
            setLoadingResolution(false);
        }
    };

    // Handle accepting resolution
    const handleAcceptResolution = async (reviewData) => {
        if (!selectedResolution) return;

        try {
            await caseService.acknowledgeResolution(selectedResolution.id, reviewData);
            showToast({ message: "Case resolution accepted successfully!", type: "success" });
            setShowResolutionModal(false);
            setSelectedResolution(null);
            setResolutionData(null);
            // Refresh dashboard data
            fetchDashboardData();
        } catch (error) {
            console.error("Failed to accept resolution:", error);
            showToast({ message: "Failed to accept resolution", type: "error" });
        }
    };




    return (
        <>
            <div className="h-screen bg-gray-50 dark:bg-black flex font-sans relative">
                <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

                {/* Custom Success Modal */}
                <SuccessModal
                    show={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                />

                {/* --- SIDEBAR --- */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary dark:bg-slate-950 text-white transform transition-transform duration-300 ease-in-auto overflow-y-auto scrollbar-hide ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        } lg:translate-x-0 shadow-xl flex flex-col justify-between`}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo Area */}
                        <div className="h-30 flex items-center px-5 border-b border-primary-dark gap-5 shrink-0">
                            {/* Logo */}
                            <div className="flex items-center">
                                <Logo src={isDarkMode ? logo4 : logo1} />
                            </div>

                            {/* Close button - Mobile only */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden ml-auto text-white hover:text-gray-200"
                            >
                                <FiX className="w-6 h-6" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-6 border-b border-primary-dark dark:border-slate-700 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                    {user?.firstName?.charAt(0).toUpperCase() || "C"}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate">
                                        {user?.firstName || "Citizen User"}
                                    </p>
                                    <p className="text-xs text-blue-100 dark:text-slate-400 capitalize">
                                        {user?.role?.toLowerCase() || "citizen"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation - Scrollable */}
                        <nav className="p-4 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
                            {CITIZEN_MENU_ITEMS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        navigate(`?tab=${id}`);
                                        setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === id
                                        ? "bg-white/10 dark:bg-slate-900 text-white border-l-4 border-white dark:border-primary"
                                        : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-800 hover:text-white"
                                        }`}
                                >
                                    <Icon /> {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Bottom Logout Button */}
                    <div className="p-4 border-t border-primary-dark dark:border-slate-700 shrink-0">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-left text-base text-white bg-primary-dark dark:bg-slate-900 hover:bg-red-600 dark:hover:bg-red-900/50 transition"
                        >
                            <FaSignOutAlt className="text-xl shrink-0" />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64">
                    {/* Top Header */}
                    {/* Top Header - Redesigned */}
                    <header className="bg-white dark:bg-slate-950 shadow-sm border-b border-gray-200 dark:border-slate-800 h-30 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                            >
                                <FiMenu className="w-6 h-6" />
                            </button>

                            {/* Icon Box */}
                            <div className="hidden md:flex w-12 h-12 bg-linear-to-br from-[#11676a] to-[#0e5658] rounded-xl items-center justify-center shadow-lg shadow-[#11676a]/20 shrink-0">
                                {(() => {
                                    const ItemIcon = CITIZEN_MENU_ITEMS.find(i => i.id === activeTab)?.icon || FaHome;
                                    return <ItemIcon className="text-xl text-white" />;
                                })()}
                            </div>

                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {CITIZEN_MENU_ITEMS.find((i) => i.id === activeTab)?.label || "Dashboard"}
                                </h1>
                                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                                    {(() => {
                                        const subtitles = {
                                            overview: "Welcome back, here's what's happening today",
                                            "submit-case": "File a new case to get legal assistance",
                                            cases: "Track and manage your ongoing cases",
                                            directory: "Find and connect with legal professionals",
                                            schedule: "Manage your upcoming appointments",
                                            messages: "Chat with your legal representatives",
                                            profile: "Manage your personal information",
                                            settings: "Configure your account preferences"
                                        };
                                        return subtitles[activeTab] || "Manage your legal matters";
                                    })()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 relative">
                            <DarkModeToggle />
                            <button
                                onClick={() =>
                                    setShowNotificationDropdown(!showNotificationDropdown)
                                }
                                className="p-2 text-gray-400 hover:text-primary transition relative"
                            >
                                <div className="relative">
                                    <MaterialIcon name="notifications" className="text-2xl" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                                    )}
                                </div>
                            </button>

                            <NotificationDropdown
                                show={showNotificationDropdown}
                                onClose={() => setShowNotificationDropdown(false)}
                                notifications={notifications}
                                onNotificationClick={handleNotificationClick}
                                onViewAll={() => setShowNotificationPanel(true)}
                            />
                        </div>
                    </header>

                    {/* Dashboard Content */}
                    <div className={`flex-1 ${activeTab === 'messages' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                        {/* Dynamic Content based on activeTab */}
                        {activeTab === "submit-case" && <CaseSubmissionForm />}
                        {activeTab === "directory" && <DirectorySearch />}
                        {activeTab === "cases" && (
                            <MyCases
                                userRole="CITIZEN"
                                user={user}
                                onNewCase={() => navigate("?tab=submit-case")}
                                onTabChange={(tab) => navigate(`?tab=${tab}`)}
                            />
                        )}
                        {activeTab === "messages" && (
                            <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8">
                                <CitizenChat />
                            </div>
                        )}
                        {activeTab === "schedule" && (
                            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <ScheduleDashboard
                                    userRole="CITIZEN"
                                    user={user}
                                />
                            </div>
                        )}
                        {activeTab === "settings" && (
                            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <CitizenSettings />
                            </div>
                        )}
                        {activeTab === "overview" && (
                            <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-8">
                                {/* Zone 1: Smart Welcome Banner with CTA */}
                                <div className="bg-linear-to-r from-primary to-primary-dark rounded-2xl dark:[#134E4A] p-6 md:p-8 text-white shadow-lg">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                        Welcome back, {user?.firstName}!
                                    </h2>
                                    <p className="text-blue-100 max-w-xl text-sm md:text-base mb-4">
                                        You have {stats.activeCases} active cases. We've updated the
                                        lawyer matching algorithm for better results.
                                    </p>
                                    <button
                                        onClick={() => navigate("?tab=submit-case")}
                                        className="bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow text-sm md:text-base"
                                    >
                                        Submit New Case
                                    </button>
                                </div>

                                {/* Zone 2: Case KPI Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatsCard
                                        title="Total Cases"
                                        value={stats.totalCases}
                                        icon={FiFolder}
                                        color="blue"
                                    />
                                    <StatsCard
                                        title="Pending"
                                        value={stats.pendingCases}
                                        icon={FiClock}
                                        color="yellow"
                                    />
                                    <StatsCard
                                        title="Active"
                                        value={stats.activeCases}
                                        icon={FiBriefcase}
                                        color="green"
                                    />
                                    <StatsCard
                                        title="Resolved"
                                        value={stats.resolvedCases}
                                        icon={FiCheckCircle}
                                        color="purple"
                                    />
                                </div>

                                {/* Zone 3: Action Required Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <MaterialIcon name="priority_high" className="text-orange-500" />
                                        Your Upcoming Actions
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                                        {/* Pending Resolutions Section - Full Width if exists */}
                                        {recentCases.filter(c => c.status === "PENDING_RESOLUTION").length > 0 && (
                                            <div className="lg:col-span-10">
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md p-4 md:p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                            <MaterialIcon name="task_alt" className="text-green-600 dark:text-green-400" />
                                                            Pending Resolutions
                                                            <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                                                                {recentCases.filter(c => c.status === "PENDING_RESOLUTION").length}
                                                            </span>
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                                            Review and accept completed work
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {recentCases
                                                            .filter(c => c.status === "PENDING_RESOLUTION")
                                                            .map((caseItem) => (
                                                                <div
                                                                    key={caseItem.id}
                                                                    className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition"
                                                                >
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                                                            <MaterialIcon name="gavel" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h5 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                                                {caseItem.title} <span className="text-[10px] font-normal text-gray-400">({caseItem.caseNumber || `#${caseItem.id}`})</span>
                                                                            </h5>
                                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                                                Resolution submitted
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleViewResolution(caseItem)}
                                                                        className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all duration-300 shadow hover:shadow-lg flex items-center justify-center gap-2"
                                                                    >
                                                                        <MaterialIcon name="visibility" />
                                                                        View Resolution
                                                                    </button>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Active Consultation Requests Section */}
                                        {consultations.filter(c => c.matchStatus === "CONTACTED").length > 0 && (
                                            <div className="lg:col-span-10">
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md p-4 md:p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                                            <MaterialIcon name="quick_reference" className="text-blue-600 dark:text-blue-400" />
                                                            Active Consultations
                                                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                                                {consultations.filter(c => c.matchStatus === "CONTACTED").length}
                                                            </span>
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                                            Professionals currently reviewing your case
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {consultations
                                                            .filter(c => c.matchStatus === "CONTACTED")
                                                            .map((consultation) => (
                                                                <div
                                                                    key={`${consultation.caseId}-${consultation.providerId}`}
                                                                    className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition"
                                                                >
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                            <MaterialIcon name="person_search" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h5 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                                                {consultation.providerName}
                                                                            </h5>
                                                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                                                Reviewing: {consultation.caseTitle}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase">
                                                                            Pending Response
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {formatRelativeTime(consultation.requestedAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Left: Recent Cases (primary content) */}
                                        <div className="lg:col-span-7">
                                            <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 md:p-6">
                                                <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-4 text-lg flex items-center gap-2">
                                                    <MaterialIcon name="description" className="text-blue-500" />
                                                    Recent Cases
                                                </h4>
                                                <div className="space-y-3">
                                                    {recentCases.length > 0 ? (
                                                        recentCases.slice(0, 3).map((legalCase) => (
                                                            <div
                                                                key={legalCase.id}
                                                                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                        <MaterialIcon name="description" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                                            {legalCase.title} <span className="text-[10px] font-normal text-gray-400 text-xs">({legalCase.caseNumber || legalCase.displayId || `#${legalCase.id}`})</span>
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                            Updated{" "}
                                                                            {parseAppointmentDate(
                                                                                legalCase.updatedAt
                                                                            )?.toLocaleDateString() || "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-semibold rounded shrink-0 ${legalCase.status === "PENDING"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : legalCase.status === "ACTIVE"
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : "bg-green-100 text-green-700"
                                                                        }`}
                                                                >
                                                                    {legalCase.status}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                                                            No recent cases found.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Stack of Pending Appointments and Upcoming Schedule */}
                                        <div className="lg:col-span-3 space-y-6">
                                            {/* Pending Appointments */}
                                            <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 md:p-6">
                                                <h4 className="font-bold text-gray-800 dark:text-slate-200 text-lg flex items-center gap-2 mb-4">
                                                    <MaterialIcon name="pending_actions" className="text-orange-500" />
                                                    Pending Appointments
                                                </h4>
                                                {loadingAppointments ? (
                                                    <div className="text-center py-4 text-gray-500 dark:text-slate-400">Loading...</div>
                                                ) : !upcomingAppointments || upcomingAppointments.filter(app => app.status === 'PENDING').length === 0 ? (
                                                    <p className="text-sm text-gray-500 dark:text-slate-400 italic text-center py-2">No pending requests</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {upcomingAppointments
                                                            .filter(app => app.status === 'PENDING')
                                                            .slice(0, 3)
                                                            .map(app => (
                                                                <div key={app.id} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">
                                                                            {parseAppointmentDate(app.date)?.toLocaleDateString() || "Invalid Date"}
                                                                        </p>
                                                                        <span className="text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-medium">
                                                                            {app.time}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 dark:text-slate-400 mb-2 line-clamp-1">
                                                                        {app.providerName ? `With ${app.providerName}` : 'Consultation'} {app.caseId ? `• Case #${app.caseId}` : ''}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => navigate("?tab=schedule")}
                                                                        className="w-full py-1.5 bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded text-xs font-bold hover:bg-orange-100 dark:hover:bg-gray-700 transition"
                                                                    >
                                                                        View Request
                                                                    </button>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upcoming Schedule */}
                                            <div className="bg-white dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 md:p-6">
                                                <h4 className="font-bold text-gray-800 dark:text-slate-200 text-lg flex items-center gap-2 mb-4">
                                                    <MaterialIcon name="event" className="text-blue-500" />
                                                    Upcoming Schedule
                                                </h4>
                                                {loadingAppointments ? (
                                                    <div className="text-center py-4 text-gray-500">Loading...</div>
                                                ) : !upcomingAppointments || upcomingAppointments.filter(app => app.status === 'CONFIRMED').length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic text-center py-2">No confirmed appointments</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {upcomingAppointments
                                                            .filter(app => app.status === 'CONFIRMED')
                                                            .slice(0, 3)
                                                            .map(app => (
                                                                <div key={app.id} className="flex gap-3 items-start">
                                                                    <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-center min-w-[3rem] shrink-0">
                                                                        <span className="block text-[10px] font-bold uppercase">
                                                                            {parseAppointmentDate(app.date)?.toLocaleString('default', { month: 'short' }) || 'ERR'}
                                                                        </span>
                                                                        <span className="block text-lg font-bold leading-none">
                                                                            {parseAppointmentDate(app.date)?.getDate() || '0'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-bold text-gray-800 truncate">
                                                                            {app.providerName || 'Consultation'}
                                                                        </p>
                                                                        {app.caseId && (
                                                                            <p className="text-xs text-gray-500 font-medium truncate">
                                                                                Case #{app.caseId} {app.caseTitle && `- ${app.caseTitle}`}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-gray-500 mb-1">
                                                                            {app.time} • Virtual
                                                                        </p>
                                                                        {app.meetLink && (
                                                                            <a
                                                                                href={app.meetLink}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-[10px] inline-block bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700"
                                                                            >
                                                                                Join
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Zone 4: Personal Analytics Section */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <FiTrendingUp className="text-blue-500" />
                                        Your Case Insights
                                    </h3>

                                    {/* Two equal cards: Case Status Distribution and Resolution Timeline */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Case Status Distribution */}
                                        <div className="bg-white dark:bg-slate-950 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                                <FiBriefcase className="text-blue-500" />
                                                Case Status Distribution
                                            </h4>
                                            <div className="h-full min-h-[300px]">
                                                <CaseDistributionChart
                                                    data={caseDistribution && caseDistribution.length > 0 ? caseDistribution : [
                                                        { name: 'Pending', value: stats.pendingCases || 0 },
                                                        { name: 'Active', value: stats.activeCases || 0 },
                                                        { name: 'Resolved', value: stats.resolvedCases || 0 }
                                                    ]}
                                                    title=""
                                                    legendPosition="bottom"
                                                />
                                            </div>
                                        </div>

                                        {/* Resolution Timeline */}
                                        <div className="bg-white dark:bg-slate-950 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                                <FiClock className="text-green-500" />
                                                Resolution Timeline
                                            </h4>
                                            <div className="h-full min-h-[300px]">
                                                <ResolutionTrendChart
                                                    data={resolutionTrend && resolutionTrend.length > 0 ? resolutionTrend : []}
                                                    title=""
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* profile card */}
                        {activeTab === "profile" && (
                            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <div className="w-full bg-white dark:bg-slate-950 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
                                    {/* HEADER */}
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* LEFT: avatar + title area */}
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                                                {profile?.firstName?.[0]?.toUpperCase() || "C"}
                                            </div>

                                            {/* Title + pill + subtitle + link */}
                                            <div className="flex flex-col gap-1">
                                                {/* Row: My Profile + Pending */}
                                                <div className="flex items-center gap-1">
                                                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                                        My Profile
                                                    </h2>

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
                                                </div>

                                                {/* Subtitle */}
                                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    Manage your personal details and contact information
                                                    used across the citizen services dashboard.
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

                                        {/* RIGHT: only buttons (no link here now) */}
                                        <div className="flex items-center gap-3">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={toggleEditMode}
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-slate-800 rounded-lg transition-colors"
                                                        disabled={isSaving}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleUpdateProfile}
                                                        type="button"
                                                        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e5658] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-colors"
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                <span>Saving…</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MaterialIcon name="save" className="text-sm" />
                                                                <span>Save changes</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    type="button"
                                                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e5658] shadow-sm transition-colors"
                                                >
                                                    <MaterialIcon name="edit" className="text-sm" />
                                                    <span>Edit profile</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* PROFILE FIELDS */}
                                    <div className=" mt-2 px-6 pt-4 pb-6 space-y-6">
                                        {/* BASIC INFORMATION */}
                                        <section>
                                            <div className="mb-3 flex items-center gap-3">
                                                <h3 className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                                    Basic information
                                                </h3>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                {/* First Name */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
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
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                                            }`}
                                                    />
                                                </div>

                                                {/* Last Name */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
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
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                                            }`}
                                                    />
                                                </div>

                                                {/* Email (read-only) */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Email
                                                        <span className="ml-2 text-xs font-normal text-gray-400">
                                                            (read‑only)
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profile?.email || ""}
                                                        disabled
                                                        className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed shadow-sm"
                                                    />
                                                </div>

                                                {/* Phone */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Phone number
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-slate-300 shadow-sm">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 36 27"
                                                                    className="w-5 h-3.5 rounded-[1px]"
                                                                >
                                                                    <rect width="36" height="9" fill="#FF9933" />
                                                                    <rect width="36" height="9" y="9" fill="#FFFFFF" />
                                                                    <rect width="36" height="9" y="18" fill="#138808" />
                                                                    <circle cx="18" cy="13.5" r="3.6" fill="#000080" />
                                                                    <circle cx="18" cy="13.5" r="3.2" fill="#FFFFFF" />
                                                                    <circle cx="18" cy="13.5" r="0.8" fill="#000080" />
                                                                    <g fill="#000080">
                                                                        {[...Array(24)].map((_, i) => {
                                                                            const angle = ((i * 15 - 90) * Math.PI) / 180;
                                                                            const x1 = 18 + 1.2 * Math.cos(angle);
                                                                            const y1 = 13.5 + 1.2 * Math.sin(angle);
                                                                            const x2 = 18 + 2.8 * Math.cos(angle);
                                                                            const y2 = 13.5 + 2.8 * Math.sin(angle);
                                                                            return (
                                                                                <line
                                                                                    key={i}
                                                                                    x1={x1}
                                                                                    y1={y1}
                                                                                    x2={x2}
                                                                                    y2={y2}
                                                                                    stroke="#000080"
                                                                                    strokeWidth="0.3"
                                                                                />
                                                                            );
                                                                        })}
                                                                    </g>
                                                                </svg>
                                                                <span className="font-semibold text-[11px] text-gray-700 dark:text-gray-300">
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
                                                                ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                                : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                                {isEditing &&
                                                    editForm.phone &&
                                                    editForm.phone.length !== 10 && (
                                                        <p className="text-xs text-red-500 mt-1">
                                                            Phone number must be 10 digits.
                                                        </p>
                                                    )}

                                                <div className="space-y-1.5 md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Languages Spoken
                                                    </label>
                                                    {isEditing ? (
                                                        <Select
                                                            isMulti
                                                            name="languages"
                                                            options={languageOptions}
                                                            className="basic-multi-select text-sm"
                                                            classNamePrefix="select"
                                                            value={
                                                                editForm.languages
                                                                    ? editForm.languages.split(", ").map((lang) => ({
                                                                        value: lang,
                                                                        label: lang,
                                                                    }))
                                                                    : []
                                                            }
                                                            onChange={(selectedOptions) => {
                                                                const value = selectedOptions
                                                                    ? selectedOptions.map((opt) => opt.value).join(", ")
                                                                    : "";
                                                                handleProfileChange({
                                                                    target: { name: "languages", value: value },
                                                                });
                                                            }}
                                                            styles={{
                                                                control: (base, state) => ({
                                                                    ...base,
                                                                    backgroundColor: isDarkMode ? "#374151" : "#ffffff", // gray-700 : white
                                                                    borderColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                                                                    color: isDarkMode ? "#ffffff" : "#111827",
                                                                    borderRadius: "0.5rem",
                                                                    paddingTop: "2px",
                                                                    paddingBottom: "2px",
                                                                    boxShadow: "none",
                                                                    "&:hover": {
                                                                        borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                                                                    },
                                                                }),
                                                                menu: (base) => ({
                                                                    ...base,
                                                                    zIndex: 9999,
                                                                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff", // gray-800
                                                                    border: isDarkMode ? "1px solid #374151" : "none",
                                                                }),
                                                                option: (base, state) => ({
                                                                    ...base,
                                                                    backgroundColor: state.isSelected
                                                                        ? "#11676a"
                                                                        : state.isFocused
                                                                            ? (isDarkMode ? "#374151" : "#f3f4f6")
                                                                            : "transparent",
                                                                    color: state.isSelected
                                                                        ? "#ffffff"
                                                                        : (isDarkMode ? "#e5e7eb" : "#111827"),
                                                                    cursor: "pointer",
                                                                }),
                                                                singleValue: (base) => ({
                                                                    ...base,
                                                                    color: isDarkMode ? "#ffffff" : "#111827",
                                                                }),
                                                                input: (base) => ({
                                                                    ...base,
                                                                    color: isDarkMode ? "#ffffff" : "#111827",
                                                                }),
                                                            }}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            name="languages"
                                                            value={profile?.languages || "Not specified"}
                                                            disabled
                                                            className="w-full text-sm px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed shadow-sm"
                                                        />
                                                    )}
                                                </div>

                                                {/* Date of Birth */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Date of birth
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            name="dob"
                                                            value={
                                                                isEditing
                                                                    ? (editForm.dob || "").split("T")[0]
                                                                    : (profile?.dob || "").split("T")[0]
                                                            }
                                                            onChange={(e) => {
                                                                let v = e.target.value; // "yyyy-mm-dd" or ""
                                                                if (!v) {
                                                                    handleProfileChange({
                                                                        target: { name: "dob", value: "" },
                                                                    });
                                                                    return;
                                                                }
                                                                let [y, m, d] = v.split("-");

                                                                // Hard‑limit year to 4 digits
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
                                                                ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                                : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                                                                }`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Gender */}
                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Gender
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            name="gender"
                                                            value={
                                                                isEditing
                                                                    ? editForm.gender || ""
                                                                    : profile?.gender || ""
                                                            }
                                                            onChange={handleProfileChange}
                                                            disabled={!isEditing}
                                                            className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                                ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                                : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                                                                }`}
                                                        >
                                                            <option value="">Select gender</option>
                                                            <option value="MALE">Male</option>
                                                            <option value="FEMALE">Female</option>
                                                            <option value="OTHER">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* ADDRESS DETAILS */}
                                        <section className="pt-2">
                                            <div className="mb-3 flex items-center gap-3">
                                                <h3 className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
                                                    Address details
                                                </h3>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        Street address
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
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                                            }`}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={
                                                            isEditing
                                                                ? editForm.city || ""
                                                                : profile?.city || ""
                                                        }
                                                        onChange={handleProfileChange}
                                                        disabled={!isEditing}
                                                        className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
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
                                                            className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:text-white"
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
                                                            className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                                                        />
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
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
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                                            }`}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-sm font-medium text-gray-800 dark:text-slate-200">
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
                                                            ? "border-primary/60 bg-white dark:bg-slate-800 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                            : "bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Coming Soon Tabs */}
                        {activeTab === "verification" && (
                            <div className="w-full">
                                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                                    <div className="text-center py-8">
                                        <FaUserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-slate-300">
                                            Verification management coming soon...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ResolutionDetailsModal
                    show={showResolutionModal}
                    onClose={() => {
                        setShowResolutionModal(false);
                        setSelectedResolution(null);
                        setResolutionData(null);
                    }}
                    caseData={selectedResolution}
                    resolution={resolutionData}
                    loading={loadingResolution}
                    onAccept={handleAcceptResolution}
                />

                <ComingSoonModal
                    show={showComingSoon}
                    onClose={() => setShowComingSoon(false)}
                    feature={comingSoonFeature}
                />

                {showNotificationPanel && (
                    <NotificationPanel onClose={() => setShowNotificationPanel(false)}>
                        <NotificationPage onClose={() => setShowNotificationPanel(false)} />
                    </NotificationPanel>
                )}
            </div>
        </>
    );
};

export default CitizenDashboard;
