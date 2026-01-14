/* eslint-disable react-hooks/static-components */
import React, { useState, useEffect } from "react";
import { formatRelativeTime } from "../../utils/timeUtils";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { authService } from "../../services/authService";
import api from "../../services/api";
import Select from "react-select";

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
import { caseService } from "../../services/caseService";
import Logo from "../common/Logo";
import { FiMenu, FiX } from "react-icons/fi";
import NgoChat from "../chat/views/NgoChat";
import { useToast } from "../common/ToastContext";
import { useNotifications } from "../notifications/useNotifications";
import NotificationPage from "../notifications/NotificationPage";
import NotificationPanel from "../notifications/NotificationPanel";
import ScheduleDashboard from "./ScheduleDashboard";
import MyCases from "./myCase";
import DarkModeToggle from "../common/DarkModeToggle";

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
import { FiBriefcase } from "react-icons/fi";

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

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl transform transition-all scale-100 animate-bounceIn">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl text-green-600">
                        check
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Profile Updated!
                </h3>
                <p className="text-gray-500 text-center mb-6">
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

const NotificationDropdown = ({ show, onClose, notifications, onNotificationClick, onViewAll }) => {
    if (!show) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
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
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification, index) => (
                            <div
                                key={index}
                                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!notification.read ? 'bg-primary-light/30 dark:bg-primary/10 border-l-4 border-l-primary' : ''
                                    }`}
                                onClick={() => onNotificationClick && onNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <FaBell className="text-primary text-xs" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                                            {notification.title || "New Notification"}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
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
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBell className="text-gray-400 dark:text-gray-500 text-sm" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            No notifications
                        </p>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>

            {notifications && notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 dark:border-gray-700">
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

const NgoDashboard = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        return params.get("tab") || "overview";
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCases: 0,
        activeCases: 0,
        pendingCases: 0,
        resolvedCases: 0,
    });
    const [recentCases, setRecentCases] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState("");

    // Use notifications hook
    const {
        notifications,
        unreadCount,
        markAsRead
    } = useNotifications();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        if (user?.id) {
            fetchUpcomingAppointments();
        }
    }, [user?.id]);

    const fetchUpcomingAppointments = async () => {
        try {
            const response = await api.get('/appointments/upcoming');
            setUpcomingAppointments(response || []);
        } catch (error) {
            console.error("Error fetching upcoming appointments:", error);
            setUpcomingAppointments([]);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchLeads = async () => {
        if (!user?.email) return;
        try {
            const response = await api.get("/consultation/leads");
            setLeads(response || []);
        } catch (error) {
            console.error("Error fetching leads", error);
        }
    };

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
            fetchLeads();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead([notification.id]);
        }
        setShowNotificationDropdown(false);
        setActiveTab("messages");
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        if (
            ["phone", "phoneNumber", "contactPhone", "organizationPhone"].includes(name)
        ) {
            const clean = value.replace(/\D/g, "").slice(0, 10);
            setEditForm((prev) => ({ ...prev, [name]: clean }));
            return;
        }
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        // Show coming soon modal for specific tabs
        if (
            activeTab === "verification" ||
            activeTab === "settings"
        ) {
            setShowComingSoon(true);
            setComingSoonFeature(activeTab);
        }
    }, [activeTab]);

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
                    return <FaUserCheck className="w-10 h-10 text-white animate-pulse" />;
                case "settings":
                    return <FaCog className="w-10 h-10 text-white animate-pulse" />;
                default:
                    return <FaCog className="w-10 h-10 text-white animate-pulse" />;
            }
        };

        const getFeatureTitle = () => {
            switch (feature) {
                case "verification":
                    return "Verification";
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
                case "settings":
                    return "This feature is coming soon! We're working hard to bring you comprehensive settings.";
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

    // ... existing code

    const handleAcceptCase = async (caseId) => {
        try {
            const token = localStorage.getItem("accessToken");
            await api.post(`/consultation/accept/${caseId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeads(); // Refresh leads
            // Refresh other stats if needed
            showToast({ message: "Case Accepted Successfully!", type: "success" });
        } catch (err) {
            console.error(err);
            showToast({ message: "Failed to accept case", type: "error" });
        }
    };

    // ... existing code

    const handleStatusToggle = async () => {
        try {
            const newStatus = !profile?.isActive;
            setProfile((prev) => ({ ...prev, isActive: newStatus }));
            await authService.updateDirectoryStatus(newStatus);
            showToast({ message: "Visibility status updated", type: "success" });
        } catch (error) {
            console.error("Failed to update directory status", error);
            setProfile((prev) => ({ ...prev, isActive: !prev.isActive }));
            showToast({ message: "Failed to update visibility status.", type: "error" });
        }
    };

    const handleUpdateProfile = async () => {
        // Validation
        const phone = editForm.phone || editForm.phoneNumber || "";
        const contactPhone = editForm.contactPhone || "";
        const orgPhone = editForm.organizationPhone || "";

        const validatePhone = (num) => /^[6-9]\d{9}$/.test(num);

        // Optional: Lawyers use 'phone', NGOs use 'organizationPhone' and 'contactPhone'
        // We validate whichever fields are present and non-empty
        if (phone && !validatePhone(phone)) {
            showToast({
                message: "Main Phone number must be a valid 10-digit Indian number starting with 6-9.",
                type: "error"
            });
            return;
        }
        if (contactPhone && !validatePhone(contactPhone)) {
            showToast({
                message: "Contact Person Phone must be a valid 10-digit Indian number starting with 6-9.",
                type: "error"
            });
            return;
        }
        if (orgPhone && !validatePhone(orgPhone)) {
            showToast({
                message: "Organization Phone must be a valid 10-digit Indian number starting with 6-9.",
                type: "error"
            });
            return;
        }

        setIsSaving(true);
        try {
            // Robust Payload Construction
            // We map generic names to lawyer-specific names and vice versa to ensure backend acceptance
            const payload = {
                ...editForm,
                // Ensure Integers
                yearsOfExperience: editForm.yearsOfExperience
                    ? parseInt(editForm.yearsOfExperience)
                    : 0,
                enrollmentYear: editForm.enrollmentYear
                    ? parseInt(editForm.enrollmentYear)
                    : 0,
                registrationYear: editForm.registrationYear
                    ? parseInt(editForm.registrationYear)
                    : null,
                maxProBonoCases:
                    editForm.maxProBonoCases !== null &&
                        editForm.maxProBonoCases !== "" &&
                        editForm.maxProBonoCases !== undefined
                        ? parseInt(editForm.maxProBonoCases)
                        : null,

                // Polyfill Phone
                phone: editForm.phone || editForm.phoneNumber,
                phoneNumber: editForm.phone || editForm.phoneNumber,
                contactPhone: editForm.contactPhone,
                organizationPhone: editForm.organizationPhone,

                // Polyfill Address
                addressLine1: editForm.addressLine1 || editForm.officeAddressLine1,
                officeAddressLine1:
                    editForm.addressLine1 || editForm.officeAddressLine1,

                // Polyfill Law Firm
                lawFirmName: editForm.lawFirmName,
                lawFirm: editForm.lawFirmName,
                firmName: editForm.lawFirmName,

                // Mapping Front-end Aliases to Backend DTO
                organizationName: editForm.ngoName || editForm.organizationName,
                contactPersonName: editForm.repName || editForm.contactPersonName,
                contactPersonDesignation: editForm.repRole || editForm.contactPersonDesignation,
                contactEmail: editForm.repEmail || editForm.contactEmail,
                representativeGender: editForm.repGender || editForm.representativeGender,
                representativeDob: editForm.dob || editForm.representativeDob, // Map generic dob to representativeDob

                // NGO Fields
                organizationEmail: editForm.organizationEmail,
                proBonoCommitment:
                    editForm.proBonoCommitment === "true" ||
                    editForm.proBonoCommitment === true,

                // Fix: Ensure serviceAreas is always an array (backend expects List<String>)
                serviceAreas: Array.isArray(editForm.serviceAreas)
                    ? editForm.serviceAreas
                    : typeof editForm.serviceAreas === "string"
                        ? editForm.serviceAreas.split(",").map((s) => s.trim())
                        : [],
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
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex font-sans transition-colors duration-300">
            {/* Custom Success Modal */}
            <SuccessModal
                show={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary dark:bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 shadow-xl border-r border-transparent dark:border-gray-800`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-30 flex items-center px-5 border-b border-primary-dark dark:border-gray-800 gap-5 shrink-0">
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
                    <div className="p-6 border-b border-primary-dark dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                {user?.firstName?.charAt(0).toUpperCase() || "N"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate text-white dark:text-gray-200">
                                    {user?.firstName || "NGO User"}
                                </p>
                                <p className="text-xs text-blue-100 dark:text-gray-400 capitalize">
                                    {user?.role?.toLowerCase() || "ngo"}
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
                                    if (id === 'schedule') {
                                        setSearchParams({});
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === id
                                    ? "bg-white/10 dark:bg-gray-800 text-white border-l-4 border-white dark:border-primary"
                                    : "text-blue-100 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-800 hover:text-white"
                                    }`}
                            >
                                <Icon className="text-xl shrink-0" />
                                <span className="text-base truncate">{name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-dark dark:border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-left text-base text-white bg-primary-dark dark:bg-gray-800 hover:bg-red-600 dark:hover:bg-red-900/50 transition"
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
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-primary"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-[#11676a] dark:text-[#198f93]">
                            {links.find((l) => l.id === activeTab)?.name || "NGO Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 relative">
                        <DarkModeToggle />
                        <button
                            onClick={() =>
                                setShowNotificationDropdown(!showNotificationDropdown)
                            }
                            className="p-2 text-gray-400 hover:text-primary transition relative"
                        >
                            <MaterialIcon name="notifications" className="text-2xl" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
                            )}
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
                <div className={`flex-1 ${activeTab === 'messages' ? 'overflow-hidden' : 'overflow-y-auto'} p-4 md:p-6 lg:p-8`}>
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <>
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-[#11676a] to-[#0f5a5d] rounded-2xl p-8 text-white shadow-lg mb-8">
                                <h2 className="text-3xl font-bold mb-2">
                                    Welcome back, {user?.firstName}!
                                </h2>
                                <p className="text-blue-100 max-w-xl">
                                    You have {stats.activeCases} active cases. Manage your cases
                                    and schedule efficiently.
                                </p>
                                <button
                                    onClick={() => setActiveTab("verification")}
                                    className="mt-6 bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow flex items-center gap-2"
                                >
                                    <MaterialIcon name="verified" /> Check Verification Status
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[
                                    {
                                        label: "Active Cases",
                                        value: stats.activeCases,
                                        icon: "gavel",
                                        color: "bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400",
                                    },
                                    {
                                        label: "Pending Requests",
                                        value: stats.pendingCases,
                                        icon: "pending_actions",
                                        color: "bg-yellow-50 dark:bg-yellow-900/30 text-primary dark:text-yellow-400",
                                    },
                                    {
                                        label: "Total Cases",
                                        value: stats.totalCases,
                                        icon: "folder",
                                        color: "bg-purple-50 dark:bg-purple-900/30 text-primary dark:text-purple-400",
                                    },
                                    {
                                        label: "Verification",
                                        value: profile?.isVerified ? "Verified" : "Pending",
                                        icon: "verified_user",
                                        color: profile?.isVerified
                                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 flex flex-col justify-between h-40"
                                    >
                                        <div className={`p-2 rounded-lg inline-flex ${stat.color}`}>
                                            <MaterialIcon name={stat.icon} />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                                {stat.label}
                                            </p>
                                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                                {stat.value}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* NEW LEADS SECTION */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 mb-8 transition-colors duration-300">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                            <FiBriefcase className="text-primary dark:text-[#198f93]" /> New Consultation Leads
                                        </h2>
                                        {!leads || leads.length === 0 ? (
                                            <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-gray-600">
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">No new leads available at the moment.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {leads.map((lead) => (
                                                    <div key={lead.caseId} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-5 border border-slate-200 dark:border-gray-600 hover:shadow-md transition-all relative">
                                                        {lead.matchStatus === "CONTACTED" && (
                                                            <span className="absolute top-3 right-3 bg-primary/10 text-primary font-bold px-2 py-1 rounded-full text-[10px] uppercase tracking-wider">
                                                                Specific Request
                                                            </span>
                                                        )}
                                                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{lead.caseTitle}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">{lead.citizenName} • {lead.location}</p>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${lead.urgency === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                                {lead.urgency} Priority
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200 dark:bg-gray-600 text-slate-600 dark:text-gray-300 uppercase tracking-wider">
                                                                {new Date(lead.requestedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setSelectedLead(lead)}
                                                                className="px-3 py-2 bg-slate-100 dark:bg-gray-600 text-slate-600 dark:text-gray-200 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-500 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <MaterialIcon name="visibility" className="text-lg" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAcceptCase(lead.caseId)}
                                                                className="flex-1 py-2 bg-slate-900 dark:bg-[#11676a] text-white rounded-lg font-bold text-sm hover:bg-primary dark:hover:bg-[#0e5658] transition-colors">
                                                                Accept Case
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedLead && (
                                        <CaseDetailsModal
                                            lead={selectedLead}
                                            onClose={() => setSelectedLead(null)}
                                            onAccept={(id) => {
                                                handleAcceptCase(id);
                                                setSelectedLead(null);
                                            }}
                                        />
                                    )}


                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-6 transition-colors duration-300">
                                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-lg">
                                            Recent Cases
                                        </h3>
                                        <div className="space-y-3">
                                            {recentCases.length > 0 ? (
                                                recentCases.slice(0, 3).map((legalCase) => (
                                                    <div
                                                        key={legalCase.id}
                                                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                <MaterialIcon name="description" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                                    {legalCase.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Updated{" "}
                                                                    {new Date(
                                                                        legalCase.updatedAt
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded shrink-0 ${legalCase.status === "PENDING"
                                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                : legalCase.status === "ACTIVE"
                                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                }`}
                                                        >
                                                            {legalCase.status}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    No recent cases found.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {/* PENDING APPOINTMENTS SECTION */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                                                <MaterialIcon name="pending_actions" className="text-orange-500" />
                                                Pending Appointments
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab("schedule")}
                                                className="text-sm text-primary dark:text-[#198f93] font-medium hover:underline"
                                            >
                                                Manage
                                            </button>
                                        </div>
                                        {loadingAppointments ? (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
                                        ) : !upcomingAppointments || upcomingAppointments.filter(app => app.status === 'PENDING').length === 0 ? (
                                            <div className="text-center py-6 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-gray-600">
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">No pending appointment requests.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {upcomingAppointments
                                                    .filter(app => app.status === 'PENDING')
                                                    .slice(0, 3)
                                                    .map(app => (
                                                        <div key={app.id} className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <p className="font-bold text-gray-800 dark:text-white text-sm">
                                                                    {new Date(app.date).toLocaleDateString()}
                                                                </p>
                                                                <span className="text-xs bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 font-medium">
                                                                    {app.time}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                                                                {app.caseId ? `Case #${app.caseId}` : 'Consultation'}
                                                            </p>
                                                            <button
                                                                onClick={() => setActiveTab("schedule")}
                                                                className="w-full py-1.5 bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 rounded text-xs font-bold hover:bg-orange-100 dark:hover:bg-gray-600 transition"
                                                            >
                                                                View Request
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* UPCOMING SCHEDULE SECTION */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                                                <MaterialIcon name="event" className="text-blue-500" />
                                                Upcoming Schedule
                                            </h3>
                                        </div>
                                        {loadingAppointments ? (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
                                        ) : !upcomingAppointments || upcomingAppointments.filter(app => app.status === 'CONFIRMED').length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-2">No confirmed appointments</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {upcomingAppointments
                                                    .filter(app => app.status === 'CONFIRMED')
                                                    .slice(0, 3)
                                                    .map(app => (
                                                        <div key={app.id} className="flex gap-3 items-start">
                                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-center min-w-[3rem] shrink-0">
                                                                <span className="block text-[10px] font-bold uppercase">
                                                                    {new Date(app.date).toLocaleString('default', { month: 'short' })}
                                                                </span>
                                                                <span className="block text-lg font-bold leading-none">
                                                                    {new Date(app.date).getDate()}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                                                    {app.providerName || 'Consultation'}
                                                                </p>
                                                                {app.caseId && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                        Case #{app.caseId}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
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
                        </>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* GREEN HEADER BAND */}
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 px-5 sm:px-6 py-4 flex items-center justify-between transition-colors duration-300">
                                    {/* LEFT: avatar + title + description */}
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* Avatar */}
                                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#11676a] text-white flex items-center justify-center text-sm font-semibold">
                                            {(profile?.firstName || user?.name || "N").charAt(0)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                                                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                                    NGO Profile
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
                                                    <span className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-300">
                                                        {profile?.isActive
                                                            ? "Available for cases"
                                                            : "Offline"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs sm:text-[13px] text-emerald-900/80 dark:text-emerald-200/80">
                                                Manage your professional information, office address,
                                                and public visibility.
                                            </p>

                                            <div className="mt-3 space-y-2">
                                                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Supporting documents
                                                </h3>

                                                {profile?.registrationCertificateUrl && (
                                                    <a
                                                        href={profile.registrationCertificateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100"
                                                    >
                                                        <FaUserCheck className="text-emerald-600" />
                                                        <span>Registration Certificate</span>
                                                    </a>
                                                )}

                                                {profile?.ngoDarpanCertificateUrl && (
                                                    <a
                                                        href={profile.ngoDarpanCertificateUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100"
                                                    >
                                                        <FaUserCheck className="text-emerald-600" />
                                                        <span>NGO Darpan Certificate</span>
                                                    </a>
                                                )}

                                                {profile?.ngoPanCardUrl && (
                                                    <a
                                                        href={profile.ngoPanCardUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100"
                                                    >
                                                        <FaUserCheck className="text-emerald-600" />
                                                        <span>NGO PAN Card</span>
                                                    </a>
                                                )}

                                                {profile?.authorizedIdProofUrl && (
                                                    <a
                                                        href={profile.authorizedIdProofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                                    >
                                                        <FaUserCheck className="text-emerald-600 dark:text-emerald-400" />
                                                        <span>Authorized Person ID Proof</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: action buttons */}
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={toggleEditMode}
                                                    disabled={isSaving}
                                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-emerald-900 font-medium bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg flex items-center gap-2 disabled:opacity-60"
                                                >
                                                    <FaTimes className="text-xs" />
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleUpdateProfile}
                                                    disabled={isSaving}
                                                    className="bg-[#11676a] text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0e5658] transition shadow-md flex items-center gap-2 disabled:opacity-70"
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaSave className="text-xs" />
                                                            Save changes
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-[#11676a] text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#0e5658] transition shadow-sm flex items-center gap-2"
                                            >
                                                <FaEdit className="text-xs" />
                                                Edit profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* WHITE BODY WITH ONLY YOUR FIELDS */}
                                <div className="bg-white dark:bg-gray-800 border-t border-emerald-100 dark:border-gray-700 p-6 lg:p-8 transition-colors duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                        {/* Registration */}
                                        <div className="md:col-span-2">
                                            <h3 className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Registration details
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                NGO name
                                            </label>
                                            <input
                                                type="text"
                                                name="ngoName"
                                                value={
                                                    isEditing
                                                        ? editForm.ngoName || ""
                                                        : profile?.ngoName || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Darpan ID
                                            </label>
                                            <input
                                                type="text"
                                                name="darpanId"
                                                value={
                                                    isEditing
                                                        ? editForm.darpanId || ""
                                                        : profile?.darpanId || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Registration number
                                            </label>
                                            <input
                                                type="text"
                                                name="registrationNumber"
                                                value={
                                                    isEditing
                                                        ? editForm.registrationNumber || ""
                                                        : profile?.registrationNumber || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Registration year
                                            </label>
                                            <input
                                                type="number"
                                                name="registrationYear"
                                                value={
                                                    isEditing
                                                        ? editForm.registrationYear || ""
                                                        : profile?.registrationYear || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        {/* Official contact */}
                                        <div className="md:col-span-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 border-b pb-1 mb-3">
                                                Official contact
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Official email
                                            </label>
                                            <input
                                                type="email"
                                                name="officialEmail"
                                                value={
                                                    isEditing
                                                        ? editForm.officialEmail || ""
                                                        : profile?.officialEmail || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Official phone
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300">
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
                                                        ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
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

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                                        control: (base) => ({
                                                            ...base,
                                                            borderColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                                                            borderRadius: "0.5rem",
                                                            paddingTop: "2px",
                                                            paddingBottom: "2px",
                                                            boxShadow: "none",
                                                            backgroundColor: isDarkMode ? "#374151" : "white",
                                                            color: isDarkMode ? "white" : "inherit",
                                                            "&:hover": {
                                                                borderColor: isDarkMode ? "#9ca3af" : "#d1d5db",
                                                            },
                                                        }),
                                                        menu: (base) => ({
                                                            ...base,
                                                            zIndex: 9999,
                                                            backgroundColor: isDarkMode ? "#1f2937" : "white",
                                                        }),
                                                        option: (base, { isFocused, isSelected }) => ({
                                                            ...base,
                                                            backgroundColor: isSelected
                                                                ? "#11676a"
                                                                : isFocused
                                                                    ? isDarkMode
                                                                        ? "#374151"
                                                                        : "#f3f4f6"
                                                                    : "transparent",
                                                            color: isSelected ? "white" : isDarkMode ? "white" : "gray",
                                                        }),
                                                        singleValue: (base) => ({
                                                            ...base,
                                                            color: isDarkMode ? "white" : "gray",
                                                        }),
                                                        multiValue: (base) => ({
                                                            ...base,
                                                            backgroundColor: isDarkMode ? "#374151" : "#e5e7eb",
                                                        }),
                                                        multiValueLabel: (base) => ({
                                                            ...base,
                                                            color: isDarkMode ? "white" : "gray",
                                                        }),
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="languages"
                                                    value={profile?.languages || "Not specified"}
                                                    disabled
                                                    className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                                                />
                                            )}
                                        </div>

                                        {/* Representative */}
                                        <div className="md:col-span-2">
                                            <h3 className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Authorized representative
                                            </h3>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                name="repName"
                                                value={
                                                    isEditing
                                                        ? editForm.repName || ""
                                                        : profile?.repName || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Role / designation
                                            </label>
                                            <input
                                                type="text"
                                                name="repRole"
                                                value={
                                                    isEditing
                                                        ? editForm.repRole || ""
                                                        : profile?.repRole || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Representative email
                                            </label>
                                            <input
                                                type="email"
                                                name="repEmail"
                                                value={
                                                    isEditing
                                                        ? editForm.repEmail || ""
                                                        : profile?.repEmail || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Representative phone
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300">
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
                                                        ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
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

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Rep date of birth
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
                                                        ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Rep gender
                                            </label>
                                            <select
                                                name="repGender"
                                                value={
                                                    isEditing
                                                        ? editForm.repGender || ""
                                                        : profile?.repGender || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                <option value="">Select</option>
                                                <option value="female">Female</option>
                                                <option value="male">Male</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        {/* Address */}
                                        <div className="md:col-span-2">
                                            <h3 className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Office address
                                            </h3>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Address
                                            </label>
                                            <textarea
                                                rows={2}
                                                name="officeAddress"
                                                value={
                                                    isEditing
                                                        ? editForm.officeAddress || ""
                                                        : profile?.officeAddress || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                State
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    name="state"
                                                    value={editForm.state || ""}
                                                    onChange={handleProfileChange}
                                                    className="w-full p-2 border rounded-lg border-primary bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 ring-primary/20 dark:text-white"
                                                >
                                                    <option value="">Select state</option>
                                                    {INDIAN_STATES.map((s) => (
                                                        <option key={s} value={s} className="dark:bg-gray-800">
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={profile?.state || ""}
                                                    disabled
                                                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>

                                        {/* Areas of work & location */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Areas of work
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="areasOfWork"
                                                    value={editForm.serviceAreas || ""}
                                                    onChange={handleProfileChange}
                                                    disabled={!isEditing}
                                                    placeholder="Legal aid, child rights, community outreach..."
                                                    className="w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile?.caseTypes && profile.caseTypes.length > 0 ? (
                                                        profile.caseTypes.map((type, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                            >
                                                                {type}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-500 italic">
                                                            {profile?.serviceAreas || "No areas of work listed."}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Location (optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={
                                                    isEditing
                                                        ? editForm.location || ""
                                                        : profile?.location || ""
                                                }
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                className={`w-full text-sm rounded-lg border px-3 py-2.5 shadow-sm focus:outline-none transition ${isEditing
                                                    ? "border-primary/60 bg-white dark:bg-gray-700 dark:border-primary/40 focus:ring-2 focus:ring-primary/20 dark:text-white"
                                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "cases" && (
                        <div className="w-full">
                            <MyCases userRole="NGO" user={user} onTabChange={setActiveTab} />
                        </div>
                    )}

                    {/* Coming Soon Tabs */}
                    {activeTab === "verification" && (
                        <div className="w-full">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <div className="text-center py-8">
                                    <FaUserCheck className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Verification management coming soon...
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "schedule" && (
                        <div className="w-full">
                            <ScheduleDashboard userRole="NGO" user={user} />
                        </div>
                    )}
                    {activeTab === "messages" && (
                        <div className="w-full h-full">
                            <NgoChat />
                        </div>
                    )}
                    {activeTab === "settings" && (
                        <div className="w-full">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                                <div className="text-center py-8">
                                    <FaCog className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
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

            {/* Notification Panel Overlay */}
            {showNotificationPanel && (
                <NotificationPanel onClose={() => setShowNotificationPanel(false)}>
                    <NotificationPage onClose={() => setShowNotificationPanel(false)} />
                </NotificationPanel>
            )}
        </div>
    );
};

const CaseDetailsModal = ({ lead, onClose, onAccept }) => {
    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl transform transition-all scale-100 animate-bounceIn relative border border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                    <FaTimes className="text-xl" />
                </button>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{lead.caseTitle}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{lead.caseId}</span>
                    <span>•</span>
                    <span className="text-primary dark:text-[#198f93] font-bold">{lead.category}</span>
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                            {lead.description || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Citizen</h4>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{lead.citizenName}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</h4>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{lead.location}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Urgency</h4>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${lead.urgency === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {lead.urgency} Priority
                            </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received</h4>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{new Date(lead.requestedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onAccept(lead.caseId)}
                        className="px-6 py-2 bg-slate-900 dark:bg-[#11676a] text-white font-bold text-sm rounded-lg hover:bg-primary dark:hover:bg-[#0e5658] transition shadow-md"
                    >
                        Accept Case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NgoDashboard;
