import React, { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";
import { FaHome, FaUserCheck, FaCog, FaSignOutAlt, FaBell, FaTimes } from "react-icons/fa"; // Import standard icons matching Lawyer dashboard
import { MdOutlineGavel } from "react-icons/md";
import { verificationService } from "../../services/verificationService";
import { useAuth } from "../../context/AuthContext";
import AdminDirectory from "../admin/AdminDirectory";
import Logo from "../common/Logo";
import { useNotifications } from "../notifications/useNotifications";
import NotificationPage from "../notifications/NotificationPage";
import NotificationPanel from "../notifications/NotificationPanel";
import DarkModeToggle from "../common/DarkModeToggle";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FaBell className="text-gray-400 dark:text-gray-500 text-sm" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
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

function usePolling(fetcher, interval = 8000, mapper = (d) => d) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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

function StatsCard({ title, value, icon, delta }) {
    return (
        <div className="bg-white/6 dark:bg-slate-800/60 border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs text-slate-400">{title}</p>
                    <h3 className="text-xl font-semibold mt-1">{value}</h3>
                    {delta && <p className="text-sm text-slate-400 mt-1">{delta}</p>}
                </div>
                <div className="text-2xl text-primary-500">{icon}</div>
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
    );
}

export default function AdminDashboard() {
    // const { theme } = useTheme(); // Removed for light-mode only
    const { logout } = useAuth();
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
        logout();
        window.location.href = "/login";
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.read) {
            markAsRead([notification.id]);
        }

        // Close dropdown
        setShowNotificationDropdown(false);

        // Admin doesn't have a messages tab, so just close the dropdown
        // Could navigate to a relevant admin section based on notification type
    };

    const statsPoll = usePolling(verificationService.fetchStats, 12000);
    const activitiesPoll = usePolling(verificationService.fetchActivities, 10000);

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

    const verificationsPoll = usePolling(fetchVerificationsUnified, 9000);

    const casesPoll = usePolling(verificationService.fetchCases, 14000);

    // Users table state
    const [usersPage, setUsersPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [usersSearch, setUsersSearch] = useState("");
    const [usersData, setUsersData] = useState({ total: 0, items: [] });
    const [usersLoading, setUsersLoading] = useState(false);

    // Modals and selections
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [bulkSelection, setBulkSelection] = useState(new Set());
    const [notificationMessage, setNotificationMessage] = useState("");
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [currentView, setCurrentView] = useState("dashboard");

    // Fetch users
    useEffect(() => {
        let mounted = true;
        (async () => {
            setUsersLoading(true);
            try {
                const res = await verificationService.fetchUsers({
                    page: usersPage,
                    perPage: usersPerPage,
                    search: usersSearch,
                });
                if (mounted) setUsersData(res);
            } catch (e) {
                console.error(e);
            } finally {
                if (mounted) setUsersLoading(false);
            }
        })();
        return () => (mounted = false);
    }, [usersPage, usersPerPage, usersSearch]);

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

    const toggleUserStatus = async (id) => {
        try {
            await verificationService.toggleUserStatus(id);
            // refresh table
            const res = await verificationService.fetchUsers({
                page: usersPage,
                perPage: usersPerPage,
                search: usersSearch,
            });
            setUsersData(res);
            setNotificationMessage(`Toggled status for ${id}`);
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
            for (const id of ids) {
                await verificationService.approveVerification(id);
            }
            setBulkSelection(new Set());
            setNotificationMessage(`Bulk approved ${ids.length} items`);
        } catch (error) {
            console.error("Error in bulk approve:", error);
            setNotificationMessage("Failed to bulk approve items");
        }
    };

    // Simple in-memory charts (SVG bars)
    const caseStatusSummary = useMemo(() => {
        const items = casesPoll.data || [];
        const counts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, ESCALATED: 0 };
        items.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));
        return counts;
    }, [casesPoll.data]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans transition-colors duration-300">
            {/* --- SIDEBAR --- */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary dark:bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 shadow-xl border-r border-transparent dark:border-gray-700`}
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
                    <div className="p-6 border-b border-primary-dark dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                A
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate text-white dark:text-gray-200">Admin User</p>
                                <p className="text-xs text-blue-100 dark:text-gray-400">Administrator</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => setCurrentView("dashboard")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium shadow-sm transition ${currentView === "dashboard"
                                ? "bg-white/10 dark:bg-gray-700 text-white border-l-4 border-white dark:border-primary"
                                : "text-blue-100 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <FaHome /> Dashboard
                        </button>
                        <button
                            onClick={() => setCurrentView("directory")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === "directory"
                                ? "bg-white/10 dark:bg-gray-700 text-white border-l-4 border-white dark:border-primary"
                                : "text-blue-100 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <FiDatabase /> Directory
                        </button>
                        <button
                            onClick={() => setShowComingSoon(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-700 hover:text-white transition duration-200"
                        >
                            <FiSettings /> Settings
                        </button>
                    </nav>
                </div>

                {/* Bottom Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-dark dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-left text-base text-white bg-primary-dark dark:bg-gray-700 hover:bg-red-600 dark:hover:bg-red-900/50 transition"
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
                <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 hover:text-primary"
                        >
                            <FiMenu className="w-6 h-6 dark:text-gray-200" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-[#11676a] dark:text-white">
                            {currentView === "directory"
                                ? "Directory Management"
                                : "Admin Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 relative">
                        <DarkModeToggle />
                        <button
                            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                            className="p-2 text-gray-400 hover:text-primary transition relative"
                        >
                            <FiBell className="text-xl" />
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
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {currentView === "directory" ? (
                        <AdminDirectory />
                    ) : (
                        <>
                            {/* Welcome Banner */}
                            <div className="bg-linear-to-r from-primary to-primary-dark rounded-2xl p-6 md:p-8 text-white shadow-lg mb-6">
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                    {currentView === "directory"
                                        ? "Directory Management"
                                        : "Admin Dashboard"}
                                </h2>
                                <p className="text-blue-100 max-w-xl text-sm md:text-base">
                                    Manage users, verifications, cases and system settings. You
                                    have {statsPoll.data?.pendingVerifications || 0} pending
                                    verifications.
                                </p>
                                <button className="mt-4 md:mt-6 bg-white text-primary px-4 md:px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow text-sm md:text-base">
                                    View Pending
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                                <div className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm border flex items-center gap-3 md:gap-4 transition-colors duration-300">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <FiUsers />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            {statsPoll.loading ? (
                                                <Spinner />
                                            ) : (
                                                statsPoll.data?.totalUsers ?? "—"
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">
                                            Total Users
                                        </p>
                                        <p className="text-xs text-green-600">+4.2% this month</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm border flex items-center gap-3 md:gap-4 transition-colors duration-300">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <MdOutlineGavel />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            {statsPoll.loading ? (
                                                <Spinner />
                                            ) : (
                                                statsPoll.data?.totalLawyers ?? "—"
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">
                                            Lawyers
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm border flex items-center gap-3 md:gap-4 transition-colors duration-300">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                        <FiUsers />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            {statsPoll.loading ? (
                                                <Spinner />
                                            ) : (
                                                statsPoll.data?.totalNGOs ?? "—"
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">
                                            NGOs
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm border flex items-center gap-3 md:gap-4 transition-colors duration-300">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                                        <FiCheckCircle />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            {statsPoll.loading ? (
                                                <Spinner />
                                            ) : (
                                                statsPoll.data?.pendingVerifications ?? "—"
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">
                                            Pending Verifications
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 p-4 rounded-xl shadow-sm border flex items-center gap-3 md:gap-4 transition-colors duration-300">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                        <FiFileText />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                            {statsPoll.loading ? (
                                                <Spinner />
                                            ) : (
                                                statsPoll.data?.resolvedCases ?? "—"
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">
                                            Resolved Cases
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left column: Activity + Verifications */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Activity Feed */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
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
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {a ? new Date(a.time).toLocaleString() : ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Verification Management */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                Verification Requests
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={bulkApprove}
                                                    className="px-3 py-1 rounded-md bg-primary text-white text-sm hover:bg-primary-dark transition"
                                                >
                                                    Approve Selected
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="text-gray-500 dark:text-gray-400 text-xs border-b border-gray-200 dark:border-gray-700">
                                                    <tr>
                                                        <th className="pb-3 pr-4">
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
                                                <tbody>
                                                    {(verificationsPoll.loading
                                                        ? Array.from({ length: 4 })
                                                        : verificationsPoll.data || []
                                                    ).map((v, i) => (
                                                        <tr
                                                            key={v?.id ?? i}
                                                            className="border-b border-gray-100 dark:border-gray-700"
                                                        >
                                                            <td className="py-3 pr-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={bulkSelection.has(v?.id)}
                                                                    onChange={(e) => {
                                                                        const next = new Set(bulkSelection);
                                                                        if (e.target.checked) next.add(v.id);
                                                                        else next.delete(v.id);
                                                                        setBulkSelection(next);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {v?.name ?? (
                                                                        <span className="text-gray-400">
                                                                            Loading...
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {v?.type}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${v?.status === "PENDING"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : v?.status === "APPROVED"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-red-100 text-red-700"
                                                                        }`}
                                                                >
                                                                    {v?.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {v
                                                                        ? new Date(
                                                                            v.submittedAt
                                                                        ).toLocaleDateString()
                                                                        : ""}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedVerification(v)}
                                                                        className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    {v?.status === "PENDING" && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => setSelectedVerification(v)}
                                                                                className="px-2 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition"
                                                                            >
                                                                                Approve
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setSelectedVerification(v)}
                                                                                className="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition"
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Cases Panel */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Cases</h3>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Total {casesPoll.data?.length ?? "—"}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(casesPoll.loading
                                                ? Array.from({ length: 4 })
                                                : casesPoll.data || []
                                            )
                                                .slice(0, 6)
                                                .map((c, i) => (
                                                    <div
                                                        key={c?.id ?? i}
                                                        className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {c?.title ?? "Loading..."}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {c
                                                                        ? new Date(c.createdAt).toLocaleDateString()
                                                                        : ""}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${c?.status === "OPEN"
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : c?.status === "IN_PROGRESS"
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : c?.status === "RESOLVED"
                                                                                ? "bg-green-100 text-green-700"
                                                                                : "bg-red-100 text-red-700"
                                                                        }`}
                                                                >
                                                                    {c?.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right column: Users + Analytics + Quick Actions */}
                                <aside className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Users</h3>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {usersData.total} total
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={usersSearch}
                                                onChange={(e) => setUsersSearch(e.target.value)}
                                                placeholder="Search users"
                                                className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary focus:outline-none"
                                            />
                                            <button
                                                onClick={() => setUsersPage(1)}
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
                                                    className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                                >
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {u?.name ?? "Loading..."}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {u?.email}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className={`text-xs px-2 py-1 rounded-full font-semibold ${u?.role === "LAWYER"
                                                                        ? "bg-purple-100 text-purple-700"
                                                                        : u?.role === "NGO"
                                                                            ? "bg-orange-100 text-orange-700"
                                                                            : "bg-blue-100 text-blue-700"
                                                                        }`}
                                                                >
                                                                    {u?.role}
                                                                </div>
                                                                {u?.isVerified && (
                                                                    <div className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                                                        <FiCheckCircle className="text-[10px]" />{" "}
                                                                        Verified
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedUser(u)}
                                                                className="flex-1 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                            >
                                                                Details
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(u.id)}
                                                                className={`flex-1 px-3 py-1 rounded-md text-white text-sm transition ${u?.status === "ACTIVE"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                                    }`}
                                                            >
                                                                {u?.status === "ACTIVE" ? "Suspend" : "Activate"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Page {usersPage}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setUsersPage((p) => Math.max(1, p - 1))
                                                    }
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Prev
                                                </button>
                                                <button
                                                    onClick={() => setUsersPage((p) => p + 1)}
                                                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4">
                                            Case Analytics
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(caseStatusSummary).map(([k, v]) => (
                                                <div key={k} className="flex items-center gap-3">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${k === "OPEN"
                                                            ? "bg-blue-500"
                                                            : k === "IN_PROGRESS"
                                                                ? "bg-yellow-500"
                                                                : k === "RESOLVED"
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {k.replaceAll("_", " ")}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {v} cases
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {v}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4">
                                            Quick Actions
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            <button className="px-3 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition">
                                                Create Announcement
                                            </button>
                                            <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                                Export Report
                                            </button>
                                            <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                                View Audit Logs
                                            </button>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Notification area */}
            {notificationMessage && (
                <div className="fixed right-6 bottom-6 p-3 rounded-lg bg-primary text-white shadow-md">
                    {notificationMessage}{" "}
                    <button
                        className="ml-3 underline"
                        onClick={() => setNotificationMessage("")}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Modals */}
            {selectedUser && (
                <div
                    role="dialog"
                    aria-modal
                    className="fixed inset-0 flex items-center justify-center p-4 z-50"
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setSelectedUser(null)}
                    />
                    <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedUser.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
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
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Role: {selectedUser.role}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Status: {selectedUser.status}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Joined: {new Date(selectedUser.joinedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Activity
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Recent actions: {selectedUser.activity} points
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={() => toggleUserStatus(selectedUser.id)}
                                className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                Toggle Status
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedVerification && (
                <div
                    role="dialog"
                    aria-modal
                    className="fixed inset-0 flex items-center justify-center p-4 z-50"
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setSelectedVerification(null)}
                    />
                    <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Verification: {selectedVerification.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                            <div className="text-sm font-medium text-gray-900">
                                                {d.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {Math.round(d.size / 1024)} KB
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => previewDocument(d)}
                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
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
            )}

            {/* Coming Soon Modal */}
            {showComingSoon && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
                >
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowComingSoon(false)}
                    />
                    <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 text-center transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                        <div className="relative mb-6">
                            <div className="bg-linear-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 w-20 h-20 shadow-lg border-4 border-white dark:border-gray-700">
                                <FiSettings className="w-10 h-10 text-white animate-pulse" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Settings
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-lg">
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
            )}

            {/* Notification Panel Overlay */}
            {showNotificationPanel && (
                <NotificationPanel onClose={() => setShowNotificationPanel(false)}>
                    <NotificationPage onClose={() => setShowNotificationPanel(false)} />
                </NotificationPanel>
            )}
        </div>
    );
}
