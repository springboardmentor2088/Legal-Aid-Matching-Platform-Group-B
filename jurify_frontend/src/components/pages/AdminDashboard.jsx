import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
    FiUsers,
    FiCheckCircle,
    FiBell,
    FiSettings,
    FiSearch,
    FiLogOut,
    FiFileText,
    FiDatabase,
    FiMenu,
    FiX,
    FiClock,
    FiTrendingUp,
    FiBriefcase,
    FiArrowRight,
    FiFilter,
    FiActivity,
    FiAlertTriangle,
} from "react-icons/fi";
import { FaHome, FaUserCheck, FaCog, FaSignOutAlt, FaBell, FaTimes } from "react-icons/fa";
import { MdOutlineGavel } from "react-icons/md";
import { verificationService } from "../../services/verificationService";
import { useAuth } from "../../context/AuthContext";
import AdminDirectory from "../admin/AdminDirectory";
import Logo from "../common/Logo";
import { useNotifications } from "../notifications/useNotifications";
import NotificationPage from "../notifications/NotificationPage";
import NotificationPanel from "../notifications/NotificationPanel";
import DarkModeToggle from "../common/DarkModeToggle";
import { AdminSettings } from "../settings";
import AuditLogViewer from "../admin/AuditLogViewer";
import Leaderboard from "../analytics/Leaderboard";
import CasesTable from "../admin/CasesTable";
import ReportsDashboard from "../admin/ReportsDashboard";
import VerificationRequest from "../admin/VerificationRequest";
import { analyticsService } from "../../services/analyticsService";
import ResolutionTrendChart from "../analytics/ResolutionTrendChart";
import CaseDistributionChart from "../analytics/CaseDistributionChart";
import GeographicMapChart from "../analytics/GeographicMapChart";
import StatsCard from "../analytics/StatsCard";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const CITY_TO_STATE = {
    "Mumbai": "Maharashtra", "Pune": "Maharashtra", "Nagpur": "Maharashtra", "Thane": "Maharashtra",
    "Nashik": "Maharashtra", "Aurangabad": "Maharashtra", "Solapur": "Maharashtra",
    "Kalyan-Dombivli": "Maharashtra", "Vasai-Virar": "Maharashtra", "Navi Mumbai": "Maharashtra",
    "Delhi": "Delhi", "New Delhi": "Delhi",
    "Bangalore": "Karnataka", "Bengaluru": "Karnataka", "Mysore": "Karnataka", "Mysuru": "Karnataka",
    "Hubli": "Karnataka", "Hubballi": "Karnataka", "Mangalore": "Karnataka", "Mangaluru": "Karnataka",
    "Chennai": "Tamil Nadu", "Coimbatore": "Tamil Nadu", "Madurai": "Tamil Nadu",
    "Salem": "Tamil Nadu", "Tiruchirappalli": "Tamil Nadu", "Trichy": "Tamil Nadu",
    "Tirunelveli": "Tamil Nadu", "Vellore": "Tamil Nadu", "Erode": "Tamil Nadu",
    "Tiruppur": "Tamil Nadu", "Thoothukudi": "Tamil Nadu", "Dindigul": "Tamil Nadu",
    "Hyderabad": "Telangana", "Warangal": "Telangana",
    "Visakhapatnam": "Andhra Pradesh", "Vijayawada": "Andhra Pradesh",
    "Kolkata": "West Bengal", "Howrah": "West Bengal",
    "Ahmedabad": "Gujarat", "Surat": "Gujarat", "Vadodara": "Gujarat", "Rajkot": "Gujarat",
    "Jaipur": "Rajasthan", "Udaipur": "Rajasthan", "Jodhpur": "Rajasthan", "Kota": "Rajasthan",
    "Lucknow": "Uttar Pradesh", "Kanpur": "Uttar Pradesh", "Varanasi": "Uttar Pradesh",
    "Noida": "Uttar Pradesh", "Agra": "Uttar Pradesh", "Ghaziabad": "Uttar Pradesh",
    "Meerut": "Uttar Pradesh", "Bareilly": "Uttar Pradesh", "Aligarh": "Uttar Pradesh",
    "Moradabad": "Uttar Pradesh", "Allahabad": "Uttar Pradesh", "Prayagraj": "Uttar Pradesh",
    "Chandigarh": "Punjab", "Ludhiana": "Punjab", "Amritsar": "Punjab", "Jalandhar": "Punjab",
    "Gurgaon": "Haryana", "Gurugram": "Haryana", "Faridabad": "Haryana",
    "Bhopal": "Madhya Pradesh", "Indore": "Madhya Pradesh", "Gwalior": "Madhya Pradesh", "Jabalpur": "Madhya Pradesh",
    "Patna": "Bihar",
    "Ranchi": "Jharkhand", "Dhanbad": "Jharkhand",
    "Raipur": "Chhattisgarh",
    "Bhubaneswar": "Odisha",
    "Guwahati": "Assam",
    "Thiruvananthapuram": "Kerala", "Trivandrum": "Kerala", "Kochi": "Kerala", "Cochin": "Kerala",
    "Kozhikode": "Kerala", "Calicut": "Kerala", "Thrissur": "Kerala",
    "Dehradun": "Uttarakhand",
    "Shimla": "Himachal Pradesh",
    "Srinagar": "Jammu and Kashmir", "Jammu": "Jammu and Kashmir",
    "Panaji": "Goa", "Goa": "Goa",
    "Puducherry": "Puducherry", "Pondy": "Puducherry"
};

const NotificationDropdown = ({ show, onClose, notifications, onNotificationClick, onViewAll }) => {
    if (!show) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-50">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
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
                                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!notification.read ? 'bg-primary-light/30 dark:bg-teal-900/10 border-l-4 border-l-primary' : ''
                                    }`}
                                onClick={() => onNotificationClick && onNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <FaBell className="text-primary text-xs" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
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
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBell className="text-gray-400 dark:text-gray-500 text-sm" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No notifications</p>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>

            {notifications && notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 dark:border-slate-800">
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

function usePolling(fetcher, interval = 8000, mapper = (d) => d) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!interval || interval <= 0) return; // Stop polling if disabled

        let mounted = true;
        let id;
        const run = async () => {
            try {
                // Don't show loading on subsequent polls
                if (!data) setLoading(true);
                const res = await fetcher();
                if (mounted) setData(mapper ? mapper(res) : res);
            } catch (e) {
                if (mounted) setError(e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        run();
        id = setInterval(run, interval);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [fetcher, interval]);

    return { data, loading, error };
}

function IconWrapper({ children }) {
    return (
        <div className="p-2 rounded-md bg-white/5 inline-flex items-center justify-center">
            {children}
        </div>
    );
}


function Spinner() {
    return (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
    );
}

import { useToast } from "../common/ToastContext"; // Ensure import

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const { showToast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);

    // Use notifications hook for single source of truth
    const {
        notifications,
        unreadCount,
        markAsRead
    } = useNotifications();

    // Logout handler
    const handleLogout = () => {
        showToast({ message: "Logged out successfully", type: "info" });
        logout();
        window.location.href = "/login";
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            markAsRead([notification.id]);
        }
        setShowNotificationDropdown(false);
    };

    // Tab persistence using URL params
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentView, setCurrentView] = useState(() => {
        return searchParams.get('view') || 'dashboard';
    });

    // Update URL when view changes
    useEffect(() => {
        setSearchParams({ view: currentView }, { replace: true });
    }, [currentView, setSearchParams]);

    const isDashboard = currentView === 'dashboard';
    const isVerifications = currentView === 'verifications';

    const statsPoll = usePolling(verificationService.fetchStats, isDashboard ? 12000 : null);
    const activitiesPoll = usePolling(verificationService.fetchActivities, isDashboard ? 10000 : null);

    // Unified Fetcher for Verifications (Requests + Unverified Users)
    const fetchVerificationsUnified = async () => {
        const [requests, unverifiedUsers] = await Promise.all([
            verificationService.getPendingRequests().catch(() => []),
            verificationService.getUnverifiedUsers().catch(() => []),
        ]);

        // Group requests by User ID to consolidate documents
        const groupedRequests = {};
        const rawRequests = Array.isArray(requests) ? requests : [];

        rawRequests.forEach((req) => {
            const u = req.user;
            if (!u) return;
            const userId = u.id;

            if (!groupedRequests[userId]) {
                // Name resolution
                let name = "Unknown User";
                if (u.name) {
                    name = u.name;
                } else if (u.role === "LAWYER" && u.lawyer) {
                    name = `${u.lawyer.firstName || u.firstName || ""} ${u.lawyer.lastName || u.lastName || ""}`;
                } else if (u.role === "NGO" && u.ngo) {
                    name = u.ngo.ngoName || u.ngo.organizationName || u.firstName || "NGO Organization";
                } else if (u.role === "CITIZEN" && u.citizen) {
                    name = `${u.citizen.firstName || u.firstName || ""} ${u.citizen.lastName || u.lastName || ""}`;
                } else if (u.firstName || u.lastName) {
                    name = `${u.firstName || ""} ${u.lastName || ""}`;
                }
                if ((!name || name.trim() === "") && u.email) {
                    name = u.email;
                }

                groupedRequests[userId] = {
                    id: req.id, // Primary ID (first one found)
                    userId: userId,
                    allRequestIds: [],
                    name: name.trim() || "Unknown User",
                    type: u.role || "LAWYER",
                    status: req.status || "PENDING",
                    submittedAt: req.submittedAt,
                    isVerified: u.isVerified,
                    documents: [], // Aggregated documents
                    rejectionReason: null,
                    isUserEntity: false,
                };
            }

            groupedRequests[userId].allRequestIds.push(req.id);
            groupedRequests[userId].documents.push({
                name: req.documentType || "Document",
                size: 0,
                url: req.documentUrl,
                originalRequestId: req.id
            });
        });

        const mappedRequests = Object.values(groupedRequests);

        // Deduplicate: If a user has a pending request, don't show them as raw unverified user
        const requestUserIds = new Set(mappedRequests.map((r) => r.userId));
        const uniqueUnverifiedUsers = unverifiedUsers.filter(
            (u) => !requestUserIds.has(u.userId)
        );

        return [...mappedRequests, ...uniqueUnverifiedUsers];
    };

    // Poll verifications if on dashboard OR verifications tab
    const verificationsPoll = usePolling(fetchVerificationsUnified, (isDashboard || isVerifications) ? 9000 : null);
    const insightsPoll = usePolling(analyticsService.getAdminInsights, isDashboard ? 15000 : null);

    const casesPoll = usePolling(verificationService.fetchCases, isDashboard ? 14000 : null);

    // Users table state
    const [usersPage, setUsersPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [usersSearch, setUsersSearch] = useState("");
    const [usersData, setUsersData] = useState({ total: 0, items: [] });
    const [usersLoading, setUsersLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const data = await verificationService.fetchUsers({
                page: usersPage,
                perPage: usersPerPage,
                search: usersSearch,
            });
            setUsersData(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setUsersLoading(false);
        }
    }, [usersPage, usersPerPage, usersSearch]);

    // Fetch users when dashboard is active or page changes
    useEffect(() => {
        if (isDashboard) {
            fetchUsers();
        }
    }, [isDashboard, usersPage]); // Don't include usersSearch to avoid live search, only on page change or mount

    // Modals and selections
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [bulkSelection, setBulkSelection] = useState(new Set());
    const [notificationMessage, setNotificationMessage] = useState("");
    const [showComingSoon, setShowComingSoon] = useState(false);

    // Filters
    const [verificationFilter, setVerificationFilter] = useState("ALL");
    const [caseFilter, setCaseFilter] = useState("ALL");
    const [selectedState, setSelectedState] = useState("All India");

    // Actions
    const approveVerification = async (item) => {
        try {
            if (item.isUserEntity) {
                await verificationService.verifyUser(item.id);
            } else if (item.allRequestIds && item.allRequestIds.length > 0) {
                // Batch approve all requests for this user
                await Promise.all(item.allRequestIds.map(id => verificationService.approveVerification(id)));
            } else {
                await verificationService.approveVerification(item.id);
            }

            // optimistic UI: refresh list
            const updated = await fetchVerificationsUnified();
            setSelectedVerification(null);
            setNotificationMessage(`Approved ${item.name}`);
            verificationsPoll.data = updated;
        } catch (error) {
            console.error("Error approving verification:", error);
            setNotificationMessage("Failed to approve verification");
        }
    };

    const rejectVerification = async (itemOrId, reason) => {
        try {
            const isItem = typeof itemOrId === 'object' && itemOrId !== null;
            const id = isItem ? itemOrId.id : itemOrId;
            const name = isItem ? itemOrId.name : id;

            if (isItem && itemOrId.allRequestIds && itemOrId.allRequestIds.length > 0) {
                await Promise.all(itemOrId.allRequestIds.map(reqId =>
                    verificationService.rejectVerification(reqId, reason)
                ));
            } else {
                await verificationService.rejectVerification(id, reason);
            }

            const updated = await fetchVerificationsUnified();
            setSelectedVerification(null);
            setNotificationMessage(`Rejected ${name}`);
            verificationsPoll.data = updated;
        } catch (error) {
            console.error("Error rejecting verification:", error);
            setNotificationMessage("Failed to reject verification");
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            await verificationService.toggleUserStatus(user.id, user.accountStatus);
            // refresh table
            const res = await verificationService.fetchUsers({
                page: usersPage,
                perPage: usersPerPage,
                search: usersSearch,
            });
            setUsersData(res);
            const action = user.accountStatus === 'SUSPENDED' ? 'activated' : 'suspended';
            setNotificationMessage(`User ${user.name} ${action} successfully`);
        } catch (error) {
            console.error("Error toggling user status:", error);
            setNotificationMessage("Failed to toggle user status");
        }
    };

    const previewDocument = (document) => {
        if (document.url) {
            window.open(document.url, "_blank");
        } else {
            setNotificationMessage(`Preview mocked: ${document.name}`);
        }
    };

    const bulkApprove = async () => {
        try {
            const ids = Array.from(bulkSelection);
            if (ids.length === 0) {
                setNotificationMessage("No items selected");
                return;
            }
            for (const id of ids) {
                await verificationService.approveVerification(id);
            }
            setBulkSelection(new Set());
            const updated = await fetchVerificationsUnified();
            verificationsPoll.data = updated;
            setNotificationMessage(`Bulk approved ${ids.length} items`);
        } catch (error) {
            console.error("Error in bulk approve:", error);
            setNotificationMessage("Failed to bulk approve items");
        }
    };

    const bulkReject = async () => {
        try {
            const ids = Array.from(bulkSelection);
            if (ids.length === 0) {
                setNotificationMessage("No items selected");
                return;
            }
            for (const id of ids) {
                await verificationService.rejectVerification(id, "Bulk rejected by admin");
            }
            setBulkSelection(new Set());
            const updated = await fetchVerificationsUnified();
            verificationsPoll.data = updated;
            setNotificationMessage(`Bulk rejected ${ids.length} items`);
        } catch (error) {
            console.error("Error in bulk reject:", error);
            setNotificationMessage("Failed to bulk reject items");
        }
    };

    // Simple in-memory charts (SVG bars)
    const caseStatusSummary = useMemo(() => {
        const items = casesPoll.data || [];
        const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0 };
        items.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));
        return counts;
    }, [casesPoll.data]);

    // Geographic Intelligence Logic
    const geoIntelligence = useMemo(() => {
        const rawData = insightsPoll.data?.geoDistribution || [];
        const totalCasesSystem = insightsPoll.data?.impactStats?.casesHandled || 0;

        let filteredCities = rawData;

        if (selectedState !== "All India") {
            filteredCities = rawData.filter(city => {
                const state = CITY_TO_STATE[city.name] || "Unknown";
                return state === selectedState;
            });
        }

        // Aggregate stats for filtered view
        const currentCases = filteredCities.reduce((sum, c) => sum + (c.casesHandled || 0), 0);

        // Simulating other role counts based on case proportion since backend doesn't provide per-state breakdown yet
        const globalUsers = statsPoll.data?.totalUsers || 0;
        const globalLawyers = statsPoll.data?.totalLawyers || 0;
        const globalNGOs = statsPoll.data?.totalNGOs || 0;

        const proportion = totalCasesSystem > 0 ? (currentCases / totalCasesSystem) : 0;

        const metrics = {
            users: selectedState === "All India" ? globalUsers : Math.round(globalUsers * proportion),
            lawyers: selectedState === "All India" ? globalLawyers : Math.round(globalLawyers * proportion),
            ngos: selectedState === "All India" ? globalNGOs : Math.round(globalNGOs * proportion),
            cases: currentCases,
            citiesCovered: filteredCities.length
        };

        const roleData = [
            { name: 'Citizens', value: metrics.users },
            { name: 'Lawyers', value: metrics.lawyers },
            { name: 'NGOs', value: metrics.ngos },
        ].filter(d => d.value > 0);

        return { filteredCities, metrics, roleData };
    }, [insightsPoll.data, statsPoll.data, selectedState]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans transition-colors duration-300">
            {/* --- SIDEBAR --- */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary dark:bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 shadow-xl border-r border-transparent dark:border-slate-800`}
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
                    <div className="p-6 border-b border-primary-dark dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                A
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate text-white dark:text-slate-200">Admin User</p>
                                <p className="text-xs text-blue-100 dark:text-slate-400">Administrator</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => setCurrentView("dashboard")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "dashboard"
                                ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <FaHome /> Dashboard
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setCurrentView("directory")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "directory"
                                    ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                    : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                    }`}
                            >
                                <FiDatabase /> Directory
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => setCurrentView("verifications")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "verifications"
                                    ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                    : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                    }`}
                            >
                                <FiCheckCircle /> Verifications
                            </button>
                        )}
                        <button
                            onClick={() => setCurrentView("cases")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "cases"
                                ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <FiFileText /> Cases
                        </button>
                        <button
                            onClick={() => setCurrentView("reports")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "reports"
                                ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <FiAlertTriangle /> Reports
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setCurrentView("audit-logs")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "audit-logs"
                                    ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                    : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                    }`}
                            >
                                <FiBell /> Audit Logs
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={() => setCurrentView("settings")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${currentView === "settings"
                                    ? "bg-white/10 dark:bg-slate-800 text-white border-l-4 border-white dark:border-primary"
                                    : "text-blue-100 dark:text-slate-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                    }`}
                            >
                                <FiSettings /> Settings
                            </button>
                        )}
                    </nav>
                </div>

                {/* Bottom Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-dark dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-left text-base text-white bg-primary-dark dark:bg-slate-800 hover:bg-red-600 dark:hover:bg-red-900/50 transition"
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

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-64">
                {/* Top Header */}
                {/* Top Header - Redesigned */}
                <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 h-30 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>

                        {/* Icon Box */}
                        <div className="hidden md:flex w-12 h-12 bg-linear-to-br from-primary to-primary-dark rounded-xl items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            {(() => {
                                const icons = {
                                    directory: FiDatabase,
                                    settings: FiSettings,
                                    verifications: FiCheckCircle,
                                    cases: FiFileText,
                                    reports: FiAlertTriangle,
                                    "audit-logs": FiBell,
                                    dashboard: FaHome
                                };
                                const ViewIcon = icons[currentView] || FaHome;
                                return <ViewIcon className="text-xl text-white" />;
                            })()}
                        </div>

                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {(() => {
                                    const titles = {
                                        directory: "Directory Management",
                                        settings: "Platform Settings",
                                        verifications: "Verification Requests",
                                        cases: "Case Management",
                                        reports: "Reported Cases",
                                        "audit-logs": "System Audit Logs",
                                        dashboard: "Dashboard Overview"
                                    };
                                    return titles[currentView] || "Dashboard Overview";
                                })()}
                            </h1>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 hidden md:block">
                                {(() => {
                                    const subtitles = {
                                        directory: "Manage lawyers, NGOs, and citizens",
                                        settings: "Configure system parameters and preferences",
                                        verifications: "Review and approve professional credentials",
                                        cases: "Oversee all legal cases on the platform",
                                        reports: "Review flagged content and disputes",
                                        "audit-logs": "Monitor system security and activity",
                                        dashboard: "Platform performance and key metrics"
                                    };
                                    return subtitles[currentView] || "Welcome back, Admin";
                                })()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 relative">
                        <DarkModeToggle />
                        <button
                            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                            className="p-2 text-gray-400 hover:text-primary transition relative"
                        >
                            <div className="relative">
                                <FiBell className="text-2xl" />
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
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {currentView === "directory" && isAdmin ? (
                        <AdminDirectory />
                    ) : currentView === "settings" && isAdmin ? (
                        <AdminSettings />
                    ) : currentView === "verifications" && isAdmin ? (
                        <VerificationRequest
                            verificationsPoll={verificationsPoll}
                            approveVerification={approveVerification}
                            rejectVerification={rejectVerification}
                            bulkApprove={bulkApprove}
                            bulkReject={bulkReject}
                            bulkSelection={bulkSelection}
                            setBulkSelection={setBulkSelection}
                            setSelectedVerification={setSelectedVerification}
                        />
                    ) : currentView === "cases" ? (
                        <CasesTable />
                    ) : currentView === "reports" ? (
                        <ReportsDashboard />
                    ) : currentView === "audit-logs" && isAdmin ? (
                        <AuditLogViewer />
                    ) : (
                        <>
                            {/* 1. Admin Smart Banner */}
                            <div className="bg-linear-to-r from-primary to-primary-dark rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">
                                            Hello, Admin
                                        </h2>
                                        <p className="text-blue-100 max-w-xl text-base mb-4">
                                            Here is your daily action plan. <br className="hidden md:block" />
                                            You have <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-full text-sm">{statsPoll.data?.pendingVerifications || 0} pending verifications</span> requiring attention.
                                        </p>

                                        <div className="flex flex-wrap gap-2 text-sm font-medium">
                                            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-2">
                                                <FiUsers className="text-blue-200" />
                                                <span>{statsPoll.data?.totalUsers || 0} Comp Users</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-2">
                                                <MdOutlineGavel className="text-purple-200" />
                                                <span>{statsPoll.data?.totalLawyers || 0} Lawyers</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 flex items-center gap-2">
                                                <FiBriefcase className="text-orange-200" />
                                                <span>{statsPoll.data?.totalNGOs || 0} NGOs</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => document.getElementById('verification-section').scrollIntoView({ behavior: 'smooth' })}
                                            className="bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex items-center gap-2 whitespace-nowrap"
                                        >
                                            Review Verifications
                                            <FiArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 2. System Snapshot */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                    <FiTrendingUp className="text-primary" />
                                    System Snapshot
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <StatsCard
                                        title="Total Users"
                                        value={statsPoll.loading ? <Spinner /> : statsPoll.data?.totalUsers ?? "—"}
                                        icon={FiUsers}
                                        color="blue"
                                    />
                                    <StatsCard
                                        title="Lawyers"
                                        value={statsPoll.loading ? <Spinner /> : statsPoll.data?.totalLawyers ?? "—"}
                                        icon={MdOutlineGavel}
                                        color="purple"
                                    />
                                    <StatsCard
                                        title="NGOs"
                                        value={statsPoll.loading ? <Spinner /> : statsPoll.data?.totalNGOs ?? "—"}
                                        icon={FiUsers}
                                        color="orange"
                                    />
                                    <StatsCard
                                        title="Pending Verifs"
                                        value={statsPoll.loading ? <Spinner /> : statsPoll.data?.pendingVerifications ?? "—"}
                                        icon={FiCheckCircle}
                                        color="yellow"
                                    />
                                    <StatsCard
                                        title="Resolved Cases"
                                        value={statsPoll.loading ? <Spinner /> : statsPoll.data?.resolvedCases ?? "—"}
                                        icon={FiFileText}
                                        color="green"
                                    />
                                </div>
                            </div>

                            {/* 3. Moderation Workspace */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                                {/* Left Column: Verification Requests & Cases (60%) */}
                                <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
                                    {/* Activity Feed */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                Recent Activity
                                            </h3>
                                            <div className="text-sm text-green-600 font-medium">
                                                ● Live
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {(activitiesPoll.loading
                                                ? Array.from({ length: 4 })
                                                : activitiesPoll.data || []
                                            ).map((a, i) => (
                                                <div
                                                    key={a?.id ?? i}
                                                    className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                        {i % 2 === 0 ? <FiBell /> : <FiUsers />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {a ? (
                                                                a.text
                                                            ) : (
                                                                <span className="bg-gray-100 rounded px-2 py-1">
                                                                    Loading...
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            {a ? new Date(a.time).toLocaleString() : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Verification Requests Table */}
                                    {isAdmin && (
                                        <div id="verification-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                                <div className="flex justify-between items-start md:items-center mb-6">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                                                            <FiCheckCircle className="text-primary" />
                                                            Verification Requests
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">Pending approvals</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={bulkApprove}
                                                            disabled={bulkSelection.size === 0}
                                                            className={`px-3 py-1 rounded-md text-white  text-sm transition ${bulkSelection.size > 0 ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-300 cursor-not-allowed'}`}
                                                        >
                                                            Approve Selected
                                                        </button>
                                                        <button
                                                            onClick={bulkReject}
                                                            disabled={bulkSelection.size === 0}
                                                            className={`px-3 py-1 rounded-md text-white text-sm transition ${bulkSelection.size > 0 ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'}`}
                                                        >
                                                            Reject Selected
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Filter Tabs */}
                                                <div className="flex items-center gap-6 text-sm">
                                                    {['ALL', 'NGO', 'LAWYER'].map(filter => (
                                                        <button
                                                            key={filter}
                                                            onClick={() => setVerificationFilter(filter)}
                                                            className={`pb-2 border-b-2 font-medium transition ${verificationFilter === filter ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            {filter === 'ALL' ? 'All Requests' : filter === 'NGO' ? 'NGOs' : 'Lawyers'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="text-gray-500 dark:text-slate-400 text-xs border-b border-gray-200 dark:border-slate-800">
                                                        <tr>
                                                            <th className="pb-3 pr-4 p-4">
                                                                <input
                                                                    type="checkbox"
                                                                    onChange={(e) => {
                                                                        if (e.target.checked)
                                                                            setBulkSelection(
                                                                                new Set(
                                                                                    (verificationsPoll.data || []).map(
                                                                                        (v) => v.id
                                                                                    )
                                                                                )
                                                                            );
                                                                        else setBulkSelection(new Set());
                                                                    }}
                                                                />
                                                            </th>
                                                            <th className="pb-3 font-semibold">Name</th>
                                                            <th className="pb-3 font-semibold">Type</th>
                                                            <th className="pb-3 font-semibold">Status</th>
                                                            <th className="pb-3 font-semibold">Submitted</th>
                                                            <th className="pb-3 font-semibold">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                        {verificationsPoll.loading ? (
                                                            <tr><td colSpan="6" className="p-8 text-center"><Spinner /></td></tr>
                                                        ) : verificationsPoll.data?.filter(v =>
                                                            v.status === "PENDING" && (verificationFilter === 'ALL' || v.type === verificationFilter)
                                                        ).length === 0 ? (
                                                            <tr><td colSpan="6" className="p-8 text-center text-gray-500 text-sm">No pending verifications for selected filter</td></tr>
                                                        ) : (
                                                            verificationsPoll.data?.filter(v =>
                                                                v.status === "PENDING" && (verificationFilter === 'ALL' || v.type === verificationFilter)
                                                            ).slice(0, 5).map((v) => (
                                                                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                                                    <td className="p-4 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                            checked={bulkSelection.has(v.id)}
                                                                            onChange={() => {
                                                                                const newSet = new Set(bulkSelection);
                                                                                if (newSet.has(v.id)) newSet.delete(v.id);
                                                                                else newSet.add(v.id);
                                                                                setBulkSelection(newSet);
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="font-medium text-gray-900 dark:text-white">{v.name}</div>
                                                                        <div className="text-xs text-gray-500">{v.email}</div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${v.type === 'LAWYER' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                                                                            {v.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(v.submittedAt).toLocaleDateString()}</td>
                                                                    <td className="p-4"><span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold">Priority</span></td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button onClick={() => setSelectedVerification(v)} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">View</button>
                                                                            <button onClick={() => setSelectedVerification(v)} className="px-2 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition">Approve</button>
                                                                            <button onClick={() => setSelectedVerification(v)} className="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition">Reject</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>

                                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                                                    <button onClick={() => setCurrentView("verifications")} className="text-primary hover:text-primary-dark text-sm font-medium hover:underline transition">
                                                        View All Verification Requests
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Case Monitoring List */}
                                    {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex flex-col gap-4 mb-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">Case Monitoring</h3>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Total {casesPoll.data?.length ?? "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Case Filters */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(filter => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => setCaseFilter(filter)}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${caseFilter === filter ? 'bg-primary text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                                    >
                                                        {filter === 'ALL' ? 'All Cases' : filter.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {(casesPoll.loading ? Array.from({ length: 4 }) : casesPoll.data || [])
                                                .filter(c => caseFilter === 'ALL' || c?.status === caseFilter)
                                                .slice(0, 6).map((c, i) => (
                                                    <div key={c?.id ?? i} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{c?.citizen ?? "Loading..."}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{c?.regDate ?? ""}</div>
                                                            </div>
                                                            <div className="text-xs">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c?.status === "OPEN" ? "bg-blue-100 text-blue-700" : c?.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" : c?.status === "RESOLVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                                    {c?.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    {/* <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Users</h3>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                                    {usersData.total} total
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={usersSearch}
                                                onChange={(e) => setUsersSearch(e.target.value)}
                                                placeholder="Search users"
                                                className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    setUsersPage(1);
                                                    fetchUsers();
                                                }}
                                                className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition whitespace-nowrap"
                                            >
                                                Search
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {(usersLoading
                                                ? Array.from({ length: 3 })
                                                : usersData.items || []
                                            ).map((u, i) => (
                                                <div
                                                    key={u?.id ?? i}
                                                    className="p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {u?.name ?? "Loading..."}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                                                    <div
                                                                        className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${u?.role === "LAWYER"
                                                                            ? "bg-purple-100 text-purple-700"
                                                                            : u?.role === "NGO"
                                                                                ? "bg-orange-100 text-orange-700"
                                                                                : "bg-blue-100 text-blue-700"
                                                                        }`}
                                                                    >
                                                                        {u?.role}
                                                                    </div>
                                                                    {u?.isVerified && (
                                                                        <div className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1 whitespace-nowrap">
                                                                            <FiCheckCircle className="text-[10px]" />{" "}
                                                                            Verified
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">
                                                                    {u?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <button
                                                                onClick={() => setSelectedUser(u)}
                                                                className="flex-1 px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                            >
                                                                Details
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(u)}
                                                                className={`flex-1 px-3 py-2 rounded-md text-white text-sm transition ${u?.accountStatus === "ACTIVE"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                                    }`}
                                                            >
                                                                {u?.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                                Page {usersPage}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setUsersPage((p) => Math.max(1, p - 1))
                                                    }
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Prev
                                                </button>
                                                <button
                                                    onClick={() => setUsersPage((p) => p + 1)}
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                                {/* </div> */}

                                {/* Right Column: User Management & Admin Tools (40%) */}
                                <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Users</h3>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                                {usersData.total} total
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={usersSearch}
                                                onChange={(e) => setUsersSearch(e.target.value)}
                                                placeholder="Search users"
                                                className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    setUsersPage(1);
                                                    fetchUsers();
                                                }}
                                                className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition"
                                            >
                                                Search
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {(usersLoading
                                                ? Array.from({ length: 3 })
                                                : usersData.items || []
                                            ).map((u, i) => (
                                                <div
                                                    key={u?.id ?? i}
                                                    className="p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {u?.name ?? "Loading..."}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                                                    <div
                                                                        className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${u?.role === "LAWYER"
                                                                            ? "bg-purple-100 text-purple-700"
                                                                            : u?.role === "NGO"
                                                                                ? "bg-orange-100 text-orange-700"
                                                                                : "bg-blue-100 text-blue-700"
                                                                            }`}
                                                                    >
                                                                        {u?.role}
                                                                    </div>
                                                                    {u?.isVerified && (
                                                                        <div className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1 whitespace-nowrap">
                                                                            <FiCheckCircle className="text-[10px]" />{" "}
                                                                            Verified
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">
                                                                    {u?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <button
                                                                onClick={() => setSelectedUser(u)}
                                                                className="flex-1 px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                            >
                                                                Details
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(u)}
                                                                className={`flex-1 px-3 py-2 rounded-md text-white text-sm transition ${u?.accountStatus === "ACTIVE"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                                    }`}
                                                            >
                                                                {u?.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                                Page {usersPage}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setUsersPage((p) => Math.max(1, p - 1))
                                                    }
                                                    disabled={usersPage === 1}
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Prev
                                                </button>
                                                <button
                                                    onClick={() => setUsersPage((p) => p + 1)}
                                                    disabled={usersPage * usersPerPage >= usersData.total}
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>



                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors duration-300">
                                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4">
                                            Quick Actions
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <button className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition">
                                                Create Announcement
                                            </button>
                                            <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                                Export Report
                                            </button>
                                            <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                                View Audit Logs
                                            </button>
                                        </div>
                                    </div>


                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Leaderboards */}
                                <Leaderboard type="lawyers" limit={10} />
                                <Leaderboard type="ngos" limit={10} />
                            </div>

                            {/* 4. Platform Intelligence */}
                            <div className="mt-8 space-y-6 animate-fade-in-up">
                                <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-wider">Platform Intelligence</h2>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        <FiClock className="text-primary" />
                                        Last updated: {new Date().toLocaleTimeString()}
                                    </span>
                                </div>

                                {/* KPI Mini Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatsCard
                                        title="Total Cases"
                                        value={insightsPoll.data?.impactStats?.casesHandled ?? "—"}
                                        icon={FiBriefcase}
                                        color="blue"
                                    />
                                    <StatsCard
                                        title="Resolved"
                                        value={insightsPoll.data?.impactStats?.resolvedCases ?? "—"}
                                        icon={FiCheckCircle}
                                        color="green"
                                    />
                                    <StatsCard
                                        title="Avg Resolution"
                                        value={`${insightsPoll.data?.impactStats?.avgResolutionTime ?? "—"} days`}
                                        icon={FiClock}
                                        color="orange"
                                    />
                                    <StatsCard
                                        title="Success Rate"
                                        value={`${insightsPoll.data?.impactStats?.successRate ?? "—"}%`}
                                        icon={FiTrendingUp}
                                        color="purple"
                                    />
                                </div>

                                {/* Charts side-by-side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ResolutionTrendChart
                                        data={insightsPoll.data?.resolutionTrend || []}
                                        title="Case Resolution Trend"
                                    />
                                    <CaseDistributionChart
                                        data={insightsPoll.data?.caseDistribution || []}
                                        title="Case Distribution by Category"
                                    />
                                </div>
                            </div>

                            {/* 5. Geographic Intelligence Panel */}
                            <div className="mt-8 space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-3">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-wider">Geographic Intelligence</h2>

                                    {/* State Filter */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter Region:</label>
                                        <select
                                            value={selectedState}
                                            onChange={(e) => setSelectedState(e.target.value)}
                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 transition-colors duration-300"
                                        >
                                            <option value="All India">All India</option>
                                            {INDIAN_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* State Summary Metrics */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiUsers className="text-blue-500" />
                                            <p className="text-xs text-gray-500 uppercase font-bold">Total Citizens</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{geoIntelligence.metrics.users.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiBriefcase className="text-purple-500" />
                                            <p className="text-xs text-gray-500 uppercase font-bold">Lawyers</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{geoIntelligence.metrics.lawyers.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiActivity className="text-orange-500" />
                                            <p className="text-xs text-gray-500 uppercase font-bold">NGOs</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{geoIntelligence.metrics.ngos.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiCheckCircle className="text-green-500" />
                                            <p className="text-xs text-gray-500 uppercase font-bold">Total Cases</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{geoIntelligence.metrics.cases.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Role Distribution Card - Redesigned */}
                                    <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col transition-colors duration-300">
                                        <div className="mb-6">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Role Distribution</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Distribution for <span className="font-medium text-primary">{selectedState}</span>
                                            </p>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center gap-6">
                                            {geoIntelligence.roleData.length > 0 ? (
                                                (() => {
                                                    const maxVal = Math.max(...geoIntelligence.roleData.map(d => d.value));
                                                    const total = geoIntelligence.roleData.reduce((a, b) => a + b.value, 0);

                                                    return geoIntelligence.roleData.map((role) => {
                                                        const rawPercent = maxVal > 0 ? (role.value / maxVal) * 100 : 0;
                                                        // Ensure minimum visible width (6%) if there is any value, but capped at 100%
                                                        const widthPercent = role.value > 0 ? Math.max(rawPercent, 6) : 0;
                                                        const share = total > 0 ? ((role.value / total) * 100).toFixed(1) : 0;

                                                        let colorClass = "bg-blue-500";
                                                        let iconColor = "text-blue-500";
                                                        let bgTrack = "bg-blue-50 dark:bg-blue-900/10";
                                                        let IconComp = FiUsers;

                                                        if (role.name === "Citizens") {
                                                            colorClass = "bg-blue-600 dark:bg-blue-500";
                                                            iconColor = "text-blue-600 dark:text-blue-500";
                                                            bgTrack = "bg-blue-50 dark:bg-blue-900/10";
                                                            IconComp = FiUsers;
                                                        } else if (role.name === "Lawyers") {
                                                            colorClass = "bg-purple-600 dark:bg-purple-500";
                                                            iconColor = "text-purple-600 dark:text-purple-500";
                                                            bgTrack = "bg-purple-50 dark:bg-purple-900/10";
                                                            IconComp = FiBriefcase;
                                                        } else if (role.name === "NGOs") {
                                                            colorClass = "bg-orange-500 dark:bg-orange-500";
                                                            iconColor = "text-orange-500 dark:text-orange-500";
                                                            bgTrack = "bg-orange-50 dark:bg-orange-900/10";
                                                            IconComp = FiActivity;
                                                        }

                                                        return (
                                                            <div key={role.name} className="group cursor-default">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <IconComp className={`w-4 h-4 ${iconColor}`} />
                                                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{role.name}</span>
                                                                    </div>
                                                                    <div className="text-right flex items-baseline gap-1">
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{role.value.toLocaleString()}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Progress Bar Track with Analytics Style */}
                                                                <div className={`w-full ${bgTrack} rounded-md h-10 overflow-hidden relative shadow-inner`}>
                                                                    {/* Accurate Bar */}
                                                                    <div
                                                                        className={`h-full rounded-r-md ${colorClass} transition-all duration-700 ease-out flex items-center justify-end px-2`}
                                                                        style={{ width: `${widthPercent}%` }}
                                                                    >
                                                                        <span className="text-[12px] font-bold text-white leading-none tracking-wide drop-shadow-md">
                                                                            {share}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()
                                            ) : (
                                                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                                                    No data available
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Map Component */}
                                    <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 h-[550px] transition-colors duration-300">
                                        <GeographicMapChart
                                            data={geoIntelligence.filteredCities}
                                            title={`Case Heatmap: ${selectedState}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main >

            {/* Notification area */}
            {
                notificationMessage && (
                    <div className="fixed right-6 bottom-6 p-3 rounded-lg bg-primary text-white shadow-md">
                        {notificationMessage}{" "}
                        <button
                            className="ml-3 underline"
                            onClick={() => setNotificationMessage("")}
                        >
                            Dismiss
                        </button>
                    </div>
                )
            }

            {/* Modals */}
            {
                selectedUser && (
                    <div
                        role="dialog"
                        aria-modal
                        className="fixed inset-0 flex items-center justify-center p-4 z-50"
                    >
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setSelectedUser(null)}
                        />
                        <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {selectedUser.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">{selectedUser.email}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-2 py-1 text-gray-400 hover:text-gray-600"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h3>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                                        Role: {selectedUser.role}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Status: {selectedUser.status}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Joined: {new Date(selectedUser.joinedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Activity
                                    </h3>
                                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                                        Recent actions: {selectedUser.activity} points
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <button
                                    onClick={() => toggleUserStatus(selectedUser)}
                                    className={`px-3 py-2 rounded-md text-white transition ${selectedUser.accountStatus === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {selectedUser.accountStatus === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                                </button>

                                <button
                                    onClick={() => {
                                        setNotificationMessage(`Notification sent to ${selectedUser.name}`);
                                    }}
                                    className="px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    Send Notification
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                selectedVerification && (
                    <div
                        role="dialog"
                        aria-modal
                        className="fixed inset-0 flex items-center justify-center p-4 z-50"
                    >
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setSelectedVerification(null)}
                        />
                        <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 transition-colors duration-300">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Verification: {selectedVerification.name}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                        Type: {selectedVerification.type}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedVerification(null)}
                                    className="px-2 py-1 text-gray-400 hover:text-gray-600"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Documents</h3>
                                <div className="mt-2 space-y-2">
                                    {selectedVerification.documents.map((d, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {d.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                                    {Math.round(d.size / 1024)} KB
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => previewDocument(d)}
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        approveVerification(selectedVerification)
                                                    }
                                                    className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        rejectVerification(
                                                            selectedVerification,
                                                            "Invalid documents"
                                                        )
                                                    }
                                                    className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedVerification.rejectionReason && (
                                    <div className="mt-3 text-sm text-red-600">
                                        Rejection Reason: {selectedVerification.rejectionReason}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Coming Soon Modal */}
            {
                showComingSoon && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
                    >
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowComingSoon(false)}
                        />
                        <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-8 text-center transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                            <div className="relative mb-6">
                                <div className="bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 w-20 h-20 shadow-lg border-4 border-white dark:border-slate-800">
                                    <FiSettings className="w-10 h-10 text-white animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 bg-linear-to-r from-gray-900 to-gray-700 dark:from-primary dark:to-primary bg-clip-text text-transparent">
                                Settings
                            </h2>
                            <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed text-lg">
                                This feature is coming soon! We're working hard to bring you
                                comprehensive admin settings.
                            </p>

                            <button
                                onClick={() => setShowComingSoon(false)}
                                className="px-8 py-3 bg-linear-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:from-primary-dark hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Notification Panel Overlay */}
            {
                showNotificationPanel && (
                    <NotificationPanel onClose={() => setShowNotificationPanel(false)}>
                        <NotificationPage onClose={() => setShowNotificationPanel(false)} />
                    </NotificationPanel>
                )
            }
        </div >
    );
}
