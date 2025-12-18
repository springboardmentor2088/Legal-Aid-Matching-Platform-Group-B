import React, { useEffect, useMemo, useState } from "react";
import { FiUsers, FiCheckCircle, FiBell, FiSettings, FiSearch, FiLogOut, FiFileText } from "react-icons/fi";
import { FaHome, FaUserCheck, FaCog, FaSignOutAlt } from 'react-icons/fa'; // Import standard icons matching Lawyer dashboard
import { MdOutlineGavel } from "react-icons/md";
import { verificationService } from "../../services/verificationService";
import { useAuth } from "../../context/AuthContext";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// -------------------------------
// Custom hooks
// -------------------------------
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

// -------------------------------
// Small presentational components
// -------------------------------
function IconWrapper({ children }) {
    return <div className="p-2 rounded-md bg-white/5 inline-flex items-center justify-center">{children}</div>;
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
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />;
}

// -------------------------------
// Main AdminDashboard Component
// -------------------------------
// -------------------------------
// Main AdminDashboard Component
// -------------------------------
export default function AdminDashboard() {
    // const { theme } = useTheme(); // Removed for light-mode only
    const { logout } = useAuth();

    // Logout handler
    const handleLogout = () => {
        logout();
        // window.location.href = '/login'; // Optional: force redirect if AuthContext doesn't auto-redirect
    };

    const statsPoll = usePolling(verificationService.fetchStats, 12000);
    const activitiesPoll = usePolling(verificationService.fetchActivities, 10000);

    // Unified Fetcher for Verifications (Requests + Unverified Users)
    const fetchVerificationsUnified = async () => {
        const [requests, unverifiedUsers] = await Promise.all([
            verificationService.getPendingRequests().catch(() => []),
            verificationService.getUnverifiedUsers().catch(() => [])
        ]);

        // Map requests
        const mappedRequests = (Array.isArray(requests) ? requests : []).map(req => {
            let name = 'Unknown User';
            const u = req.user;
            if (u) {
                // Priority 1: Backend provided name
                if (u.name) {
                    name = u.name;
                }
                // Priority 2: Role-specific details
                else if (u.role === 'LAWYER' && u.lawyer) {
                    name = `${u.lawyer.firstName || u.firstName || ''} ${u.lawyer.lastName || u.lastName || ''}`;
                } else if (u.role === 'NGO' && u.ngo) {
                    name = u.ngo.ngoName || u.ngo.organizationName || u.firstName || 'NGO Organization';
                } else if (u.role === 'CITIZEN' && u.citizen) {
                    name = `${u.citizen.firstName || u.firstName || ''} ${u.citizen.lastName || u.lastName || ''}`;
                } else if (u.firstName || u.lastName) {
                    name = `${u.firstName || ''} ${u.lastName || ''}`;
                }

                // Priority 3: Email Fallback
                if ((!name || name.trim() === '') && u.email) {
                    name = u.email;
                }
            }

            return {
                id: req.id,
                userId: req.user?.id,
                name: name.trim() || 'Unknown User',
                type: req.user?.role || 'LAWYER',
                status: req.status || 'PENDING',
                submittedAt: req.submittedAt,
                isVerified: req.user?.isVerified,
                documents: [{
                    name: req.documentType || 'Document',
                    size: 0,
                    url: req.documentUrl
                }],
                rejectionReason: null,
                isUserEntity: false
            };
        });

        // Deduplicate: If a user has a pending request, don't show them as raw unverified user
        const requestUserIds = new Set(mappedRequests.map(r => r.userId));
        const uniqueUnverifiedUsers = unverifiedUsers.filter(u => !requestUserIds.has(u.userId));

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

    // Fetch users
    useEffect(() => {
        let mounted = true;
        (async () => {
            setUsersLoading(true);
            try {
                const res = await verificationService.fetchUsers({ page: usersPage, perPage: usersPerPage, search: usersSearch });
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
            } else {
                await verificationService.approveVerification(item.id);
            }

            // optimistic UI: refresh list
            const updated = await fetchVerificationsUnified();
            setSelectedVerification(null);
            setNotificationMessage(`Approved ${item.name}`);
            verificationsPoll.data = updated;
        } catch (error) {
            console.error('Error approving verification:', error);
            setNotificationMessage('Failed to approve verification');
        }
    };

    const rejectVerification = async (id, reason) => {
        try {
            await verificationService.rejectVerification(id, reason);
            const updated = await verificationService.fetchVerifications();
            setSelectedVerification(null);
            setNotificationMessage(`Rejected ${id}`);
            verificationsPoll.data = updated;
        } catch (error) {
            console.error('Error rejecting verification:', error);
            setNotificationMessage('Failed to reject verification');
        }
    };

    const toggleUserStatus = async (id) => {
        try {
            await verificationService.toggleUserStatus(id);
            // refresh table
            const res = await verificationService.fetchUsers({ page: usersPage, perPage: usersPerPage, search: usersSearch });
            setUsersData(res);
            setNotificationMessage(`Toggled status for ${id}`);
        } catch (error) {
            console.error('Error toggling user status:', error);
            setNotificationMessage('Failed to toggle user status');
        }
    };



    const previewDocument = (document) => {
        if (document.url) {
            window.open(document.url, '_blank');
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
            console.error('Error in bulk approve:', error);
            setNotificationMessage('Failed to bulk approve items');
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
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-[#11676a] text-white transform transition-transform duration-300 ease-in-out translate-x-0 md:relative shadow-xl flex flex-col justify-between p-6">
                <div>
                    {/* Logo Area */}
                    <div className="flex items-center gap-2 mb-6">
                        <h2 className="text-xl font-bold">Jurify Admin</h2>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                            A
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-lg font-semibold truncate">Admin User</p>
                            <p className="text-sm text-gray-200 capitalize">Administrator</p>
                        </div>
                    </div>
                    <hr className="border-t border-white/30 mb-6" />

                    {/* Navigation */}
                    <nav className="flex flex-col gap-3">
                        <button className="flex items-center gap-4 px-4 py-3 rounded-md w-full text-left bg-white/10 text-white font-medium shadow-sm">
                            <FaHome className="text-2xl" />
                            <span className="text-lg">Dashboard</span>
                        </button>
                        <button
                            onClick={() => setShowComingSoon(true)}
                            className="flex items-center gap-4 px-4 py-3 rounded-md transition w-full text-left text-blue-100 hover:bg-white/5 hover:text-white"
                        >
                            <FaCog className="text-2xl" />
                            <span className="text-lg">Settings</span>
                        </button>
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

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 md:px-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-[#11676a] transition relative">
                            <FiBell />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-[#11676a] transition"
                            title="Sign Out"
                        >
                            <FiLogOut />
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">

                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-[#11676a] to-[#0f5a5d] rounded-2xl p-8 text-white shadow-lg mb-6">
                        <h2 className="text-3xl font-bold mb-2">Welcome back, Admin!</h2>
                        <p className="text-blue-100 max-w-xl">
                            Manage users, verifications, cases and system settings. You have {statsPoll.data?.pendingVerifications || 0} pending verifications.
                        </p>
                        <button className="mt-6 bg-white text-[#11676a] px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow">
                            View Pending
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border-gray-100 p-4 rounded-xl shadow-sm border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FiUsers />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{statsPoll.loading ? <Spinner /> : statsPoll.data?.totalUsers ?? "—"}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Users</p>
                                <p className="text-xs text-green-600">+4.2% this month</p>
                            </div>
                        </div>
                        <div className="bg-white border-gray-100 p-4 rounded-xl shadow-sm border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                <MdOutlineGavel />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{statsPoll.loading ? <Spinner /> : statsPoll.data?.totalLawyers ?? "—"}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Lawyers</p>
                            </div>
                        </div>
                        <div className="bg-white border-gray-100 p-4 rounded-xl shadow-sm border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <FiUsers />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{statsPoll.loading ? <Spinner /> : statsPoll.data?.totalNGOs ?? "—"}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">NGOs</p>
                            </div>
                        </div>
                        <div className="bg-white border-gray-100 p-4 rounded-xl shadow-sm border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                                <FiCheckCircle />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{statsPoll.loading ? <Spinner /> : statsPoll.data?.pendingVerifications ?? "—"}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending Verifications</p>
                            </div>
                        </div>
                        <div className="bg-white border-gray-100 p-4 rounded-xl shadow-sm border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                <FiFileText />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{statsPoll.loading ? <Spinner /> : statsPoll.data?.resolvedCases ?? "—"}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Resolved Cases</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column: Activity + Verifications */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Activity Feed */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>
                                    <div className="text-sm text-green-600 font-medium">● Live</div>
                                </div>
                                <div className="space-y-3">
                                    {(activitiesPoll.loading ? Array.from({ length: 4 }) : activitiesPoll.data || []).map((a, i) => (
                                        <div key={a?.id ?? i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                {i % 2 === 0 ? <FiBell /> : <FiUsers />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">{a ? a.text : <span className="bg-gray-100 rounded px-2 py-1">Loading...</span>}</div>
                                                <div className="text-xs text-gray-500 mt-1">{a ? new Date(a.time).toLocaleString() : ""}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Verification Management */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800 text-lg">Verification Requests</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={bulkApprove}
                                            className="px-3 py-1 rounded-md bg-[#11676a] text-white text-sm hover:bg-[#0f5a5d] transition"
                                        >
                                            Approve Selected
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="text-gray-500 text-xs border-b border-gray-200">
                                            <tr>
                                                <th className="pb-3 pr-4">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) setBulkSelection(new Set((verificationsPoll.data || []).map(v => v.id)));
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
                                            {(verificationsPoll.loading ? Array.from({ length: 4 }) : verificationsPoll.data || []).map((v, i) => (
                                                <tr key={v?.id ?? i} className="border-b border-gray-100">
                                                    <td className="py-3 pr-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={bulkSelection.has(v?.id)}
                                                            onChange={(e) => {
                                                                const next = new Set(bulkSelection);
                                                                if (e.target.checked) next.add(v.id); else next.delete(v.id);
                                                                setBulkSelection(next);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="font-medium text-gray-900">{v?.name ?? <span className="text-gray-400">Loading...</span>}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="text-sm text-gray-600">{v?.type}</span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            v?.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {v?.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="text-sm text-gray-500">{v ? new Date(v.submittedAt).toLocaleDateString() : ""}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedVerification(v)}
                                                                className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
                                                            >
                                                                View
                                                            </button>
                                                            {v?.status === 'PENDING' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => approveVerification(v)}
                                                                        className="px-2 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 transition"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => rejectVerification(v.id, 'Invalid documents')}
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800 text-lg">Cases</h3>
                                    <div className="text-sm text-gray-500">Total {casesPoll.data?.length ?? "—"}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(casesPoll.loading ? Array.from({ length: 4 }) : casesPoll.data || []).slice(0, 6).map((c, i) => (
                                        <div key={c?.id ?? i} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{c?.title ?? 'Loading...'}</div>
                                                    <div className="text-xs text-gray-500">{c ? new Date(c.createdAt).toLocaleDateString() : ''}</div>
                                                </div>
                                                <div className="text-xs">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c?.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                                        c?.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                                                            c?.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800 text-lg">Users</h3>
                                    <div className="text-xs text-gray-500">{usersData.total} total</div>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={usersSearch}
                                        onChange={(e) => setUsersSearch(e.target.value)}
                                        placeholder="Search users"
                                        className="flex-1 p-2 rounded-lg border border-gray-200 focus:border-[#11676a] focus:outline-none text-gray-900 placeholder-gray-500"
                                    />
                                    <button
                                        onClick={() => setUsersPage(1)}
                                        className="px-3 py-2 rounded-md bg-[#11676a] text-white hover:bg-[#0f5a5d] transition"
                                    >
                                        Search
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(usersLoading ? Array.from({ length: 3 }) : usersData.items || []).map((u, i) => (
                                        <div key={u?.id ?? i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{u?.name ?? 'Loading...'}</div>
                                                <div className="text-xs text-gray-500">{u?.email}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs px-2 py-1 rounded-full font-semibold ${u?.role === 'LAWYER' ? 'bg-purple-100 text-purple-700' :
                                                    u?.role === 'NGO' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {u?.role}
                                                </div>
                                                {u?.isVerified && (
                                                    <div className="text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                                        <FiCheckCircle className="text-[10px]" /> Verified
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedUser(u)}
                                                    className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(u.id)}
                                                    className={`px-2 py-1 rounded-md text-white text-sm transition ${u?.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                >
                                                    {u?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-500">Page {usersPage}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                                            className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setUsersPage((p) => p + 1)}
                                            className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 text-lg mb-4">Case Analytics</h3>
                                <div className="space-y-3">
                                    {Object.entries(caseStatusSummary).map(([k, v]) => (
                                        <div key={k} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${k === 'OPEN' ? 'bg-blue-500' :
                                                k === 'IN_PROGRESS' ? 'bg-yellow-500' :
                                                    k === 'RESOLVED' ? 'bg-green-500' :
                                                        'bg-red-500'
                                                }`} />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">{k.replaceAll('_', ' ')}</div>
                                                <div className="text-xs text-gray-500">{v} cases</div>
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">{v}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Actions</h3>
                                <div className="flex flex-col gap-2">
                                    <button className="px-3 py-2 rounded-md bg-[#11676a] text-white hover:bg-[#0f5a5d] transition">Create Announcement</button>
                                    <button className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Export Report</button>
                                    <button className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition">View Audit Logs</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* Notification area */}
            {notificationMessage && (
                <div className="fixed right-6 bottom-6 p-3 rounded-lg bg-[#11676a] text-white shadow-md">
                    {notificationMessage} <button className="ml-3 underline" onClick={() => setNotificationMessage("")}>Dismiss</button>
                </div>
            )}

            {/* Modals (simple) */}
            {selectedUser && (
                <div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedUser(null)} />
                    <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selectedUser.name}</h2>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="px-2 py-1 text-gray-400 hover:text-gray-600">Close</button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
                                <div className="text-sm text-gray-500 mt-2">Role: {selectedUser.role}</div>
                                <div className="text-sm text-gray-500 mt-1">Status: {selectedUser.status}</div>
                                <div className="text-sm text-gray-500 mt-1">Joined: {new Date(selectedUser.joinedAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                                <div className="text-sm text-gray-500 mt-2">Recent actions: {selectedUser.activity} points</div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button onClick={() => toggleUserStatus(selectedUser.id)} className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Toggle Status</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedVerification && (
                <div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedVerification(null)} />
                    <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Verification: {selectedVerification.name}</h2>
                                <p className="text-sm text-gray-500">Type: {selectedVerification.type}</p>
                            </div>
                            <button onClick={() => setSelectedVerification(null)} className="px-2 py-1 text-gray-400 hover:text-gray-600">Close</button>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
                            <div className="mt-2 space-y-2">
                                {selectedVerification.documents.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{d.name}</div>
                                            <div className="text-xs text-gray-500">{Math.round(d.size / 1024)} KB</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => previewDocument(d)}
                                                className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                            >
                                                Preview
                                            </button>
                                            <button onClick={() => approveVerification(selectedVerification)} className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition">Approve</button>
                                            <button onClick={() => rejectVerification(selectedVerification.id, 'Not valid')} className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedVerification.rejectionReason && (
                                <div className="mt-3 text-sm text-red-600">Rejection Reason: {selectedVerification.rejectionReason}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Coming Soon Modal */}
            {showComingSoon && (
                <div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowComingSoon(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-linear-to-br from-[#11676a] to-[#0f5a5d] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiSettings className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
                        <p className="text-gray-600 mb-6">This feature is coming soon! We're working hard to bring you comprehensive admin settings.</p>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="px-6 py-2 bg-[#11676a] text-white rounded-lg font-bold hover:bg-[#0f5a5d] transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
