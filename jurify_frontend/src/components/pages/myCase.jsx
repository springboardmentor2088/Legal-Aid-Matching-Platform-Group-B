import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiGrid, FiList } from "react-icons/fi";
import { caseService } from "../../services/caseService";
import { authService } from "../../services/authService";
import { format } from "date-fns";
import { useToast } from "../common/ToastContext";
import ResolveCaseModal from "../case/ResolveCaseModal";
import ResolutionDetailsModal from "../case/ResolutionDetailsModal";
import ReportCaseModal from "../case/ReportCaseModal";


const MyCases = ({ onTabChange, onNewCase, userRole: initialUserRole }) => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, closed: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [viewMode, setViewMode] = useState("compact");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const currentUser = authService.getCurrentUser();

    // Helper Mappers for UI Styling
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return "bg-amber-100 text-amber-700";
            case 'ACTIVE': return "bg-blue-100 text-blue-700";
            case 'RESOLVED':
            case 'CLOSED': return "bg-emerald-100 text-emerald-700";
            case 'REMOVED': return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getPriorityColor = (urgency) => {
        switch (urgency) {
            case 'HIGH':
            case 'CRITICAL': return "bg-red-100 text-red-700";
            case 'MEDIUM': return "bg-orange-100 text-orange-700";
            default: return "bg-blue-50 text-blue-600";
        }
    };

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [casesRes, statsRes] = await Promise.all([
                    caseService.getMyCases(),
                    caseService.getCaseStats()
                ]);

                console.log("Fetched Cases:", casesRes);

                // Map Backend DTO to UI Model
                const mappedCases = casesRes.map(c => {
                    // Determine Counterparty based on User Role
                    let otherParty = null;
                    const isProfessional = currentUser?.role === 'LAWYER' || currentUser?.role === 'NGO';

                    if (isProfessional) {
                        // Show Citizen Details
                        otherParty = {
                            name: c.citizenName,
                            id: c.citizenId,
                            email: c.citizenEmail,
                            phone: c.citizenPhone,
                            role: 'Client',
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.citizenName || 'Client')}&background=random`,
                            specialization: "Citizen"
                        };
                    } else {
                        // User is Citizen -> Show Lawyer or NGO
                        if (c.lawyerId) {
                            otherParty = {
                                name: c.lawyerName,
                                id: c.lawyerId,
                                email: c.lawyerEmail,
                                phone: c.lawyerPhone,
                                role: 'Legal Representative',
                                specialization: "Legal Counsel",
                                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.lawyerName)}&background=random`
                            };
                        } else if (c.ngoName) {
                            otherParty = {
                                name: c.ngoName,
                                email: c.ngoEmail,
                                phone: c.ngoPhone,
                                role: 'NGO Support',
                                specialization: "Non-Profit Organization",
                                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.ngoName)}&background=random`
                            };
                        }
                    }

                    return {
                        ...c,
                        displayId: `CASE-${new Date(c.createdAt).getFullYear()}-${c.id.toString().padStart(3, '0')}`,
                        statusColor: getStatusColor(c.status),
                        priorityColor: getPriorityColor(c.urgency),
                        filedDate: c.createdAt ? format(new Date(c.createdAt), "MMM dd, yyyy") : "N/A",
                        counterparty: otherParty
                    };
                });

                setCases(mappedCases);

                // Update Stats
                setStats({
                    total: statsRes.totalCases || 0,
                    pending: statsRes.pendingCases || 0,
                    active: statsRes.activeCases || 0,
                    closed: statsRes.resolvedCases || 0
                });

            } catch (err) {
                console.error("Failed to load cases", err);
                showToast({ message: "Failed to load cases", type: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter Logic
    const filteredCases = useMemo(() => {
        return cases.filter((c) => {
            const matchesSearch = (c.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (c.displayId?.toLowerCase() || "").includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "All" ||
                (statusFilter === "Pending" && c.status === "PENDING") ||
                (statusFilter === "Active" && c.status === "ACTIVE") ||
                (statusFilter === "Closed" && (c.status === "RESOLVED" || c.status === "CLOSED")) ||
                (statusFilter === "Removed" && c.status === "REMOVED");

            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, cases]);

    const handleCaseClick = (caseId) => {
        navigate(`/cases/${caseId}`);
    };

    // Auto-focus logic for when redirected from Map Pin
    useEffect(() => {
        const focusId = searchParams.get("focusCaseId");
        if (focusId && cases.length > 0) {
            const caseToFocus = cases.find(c => c.id.toString() === focusId);
            if (caseToFocus) {
                // Set the selected case to show the detailed view
                setSelectedCase(caseToFocus);

                // Also scroll to top to ensure details are visible
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Clear the param from URL to avoid repeated focusing if user navigates back to tab
                const rolePath = currentUser?.role?.toLowerCase() || 'citizen';
                window.history.replaceState(null, '', `/${rolePath}/dashboard?tab=cases`);
            }
        }
    }, [searchParams, cases, currentUser]);

    const [selectedCase, setSelectedCase] = useState(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Resolution Modal State for Citizen
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [selectedResolutionCase, setSelectedResolutionCase] = useState(null);
    const [resolutionData, setResolutionData] = useState(null);
    const [loadingResolution, setLoadingResolution] = useState(false);



    const handleViewResolution = async (e, caseItem) => {
        e.stopPropagation();
        setSelectedResolutionCase(caseItem);
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

    const handleAcceptResolution = async ({ rating, feedback } = {}) => {
        if (!selectedResolutionCase) return;
        try {
            await caseService.acknowledgeResolution(selectedResolutionCase.id, { rating, feedback });
            showToast({ message: "Case resolution accepted successfully!", type: "success" });
            setShowResolutionModal(false);
            window.location.reload();
        } catch (error) {
            console.error("Failed to accept resolution:", error);
            showToast({ message: "Failed to accept resolution", type: "error" });
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors duration-300"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="bg-transparent dark:bg-transparent min-h-screen flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* 1. Back Button Only (Header handled by Dashboard) */}
            <div className="flex justify-end items-center">
                {selectedCase && (
                    <button
                        onClick={() => setSelectedCase(null)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary transition font-semibold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span> Back to List
                    </button>
                )}
            </div>

            {/* 2. Stats Bar (List View Only) */}
            {!selectedCase && (
                <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-colors">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Case Distribution</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-amber-400 transition-all duration-500" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} />
                        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }} />
                        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${stats.total ? (stats.closed / stats.total) * 100 : 0}%` }} />
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-wide">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending ({stats.pending})
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Active ({stats.active})
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Closed ({stats.closed})
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Search & Toolbar */}
            {!selectedCase && (
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search by title or case ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-3">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none h-10 pl-4 pr-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Active">Active</option>
                                <option value="Closed">Closed</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* View Switcher */}
                        <div className="flex bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm h-10">
                            <button
                                onClick={() => setViewMode("compact")}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === "compact" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                            <button
                                onClick={() => setViewMode("detailed")}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === "detailed" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                                title="List View"
                            >
                                <FiList />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Cases Grid / List */}
            {!selectedCase && (
                <>
                    {filteredCases.length === 0 ? (
                        <div className="text-center py-20 opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400 dark:text-gray-600">folder_off</span>
                            <p className="text-gray-500 dark:text-slate-400">No cases found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className={viewMode === "compact"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            : "flex flex-col gap-4"
                        }>
                            {filteredCases.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCase(c)}
                                    className={`group relative cursor-pointer bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden
                        ${viewMode === 'detailed' ? 'flex p-0' : 'p-6'}`}
                                >

                                    {/* Compact View */}
                                    {viewMode === "compact" && (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{c.displayId}</span>
                                                {c.urgency === 'HIGH' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                                            </div>

                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                                {c.title}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide">{c.category}</p>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${c.statusColor}`}>
                                                    {c.status}
                                                </span>
                                                <span className="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform text-lg">arrow_forward</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Detailed View */}
                                    {viewMode === "detailed" && (
                                        <div className="flex flex-1 items-center p-6 gap-6">
                                            <div className={`hidden md:flex w-14 h-14 rounded-full items-center justify-center shrink-0 ${c.statusColor} bg-opacity-20`}>
                                                <span className="material-symbols-outlined text-2xl">
                                                    {c.status === 'RESOLVED' ? 'check_circle' : 'pending'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-primary">{c.displayId}</span>
                                                    <span className="text-slate-300 dark:text-gray-600">•</span>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-gray-500 uppercase">{c.category}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{c.title}</h3>
                                                <div className="flex flex-wrap gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-sm">calendar_today</span> {c.filedDate}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-sm">person</span>
                                                        {c.counterparty ? c.counterparty.name : (
                                                            <>
                                                                {c.status !== 'REMOVED' && c.status !== 'RESOLVED' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`?tab=directory&fromCase=true&caseId=${c.id}&caseType=${encodeURIComponent(c.category)}`);
                                                                        }}
                                                                        className="text-primary hover:underline font-bold"
                                                                    >
                                                                        Find Professional
                                                                    </button>
                                                                )}
                                                                {(c.status === 'REMOVED' || c.status === 'RESOLVED') && (
                                                                    <span className="text-slate-400 italic text-xs">Action unavailable</span>
                                                                )}
                                                            </>
                                                        )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${c.priorityColor}`}>
                                                    {c.urgency || 'Normal'} Priority
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </>
            )
            }

            {/* 5. Case Details View */}
            {
                selectedCase && (
                    <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className={`p-8 border-b border-slate-100 dark:border-slate-700 border-t-4 ${selectedCase.urgency === 'HIGH' ? 'border-t-red-500' : 'border-t-blue-500'
                            }`}>
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                                <div>
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">{selectedCase.displayId}</span>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 mb-3">{selectedCase.title}</h2>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">
                                            {selectedCase.category}
                                        </span>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedCase.priorityColor}`}>
                                            {selectedCase.urgency} Priority
                                        </span>
                                    </div>
                                </div>
                                <div className={`self-start px-4 py-1.5 rounded-full text-sm font-bold border ${selectedCase.statusColor}`}>
                                    {selectedCase.status}
                                </div>
                            </div>

                            <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-wide">Case Summary</h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed w-full">
                                {selectedCase.description || "No description provided."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-gray-800">
                            {/* Left Col: Lawyer & Docs */}
                            <div className="col-span-2 p-8 space-y-8">
                                {/* Counterparty/Lawyer Card */}
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wide">
                                        {selectedCase.counterparty ? selectedCase.counterparty.role : 'Legal Representative'}
                                    </h4>
                                    {selectedCase.counterparty ? (
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-slate-100 dark:border-slate-800">
                                            <img src={selectedCase.counterparty.avatar} alt="Avatar" className="w-20 h-20 rounded-full shadow-md object-cover ring-2 ring-white dark:ring-gray-600" />
                                            <div className="flex-1 text-center sm:text-left">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedCase.counterparty.name}</h3>
                                                <p className="text-primary font-medium text-sm mb-2">{selectedCase.counterparty.specialization}</p>

                                                {/* Contact Info */}
                                                <div className="space-y-1 mb-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {selectedCase.counterparty.email && (
                                                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                            <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                                            {selectedCase.counterparty.email}
                                                        </div>
                                                    )}
                                                    {selectedCase.counterparty.phone && (
                                                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                            <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                                                            {selectedCase.counterparty.phone}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => {
                                                            if (selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED') return;
                                                            const rolePath = currentUser?.role?.toLowerCase() || 'citizen';
                                                            navigate(`/${rolePath}/dashboard?tab=messages&caseId=${selectedCase.id}`);
                                                        }}
                                                        disabled={selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED'}
                                                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm ${selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-primary text-white hover:brightness-110 bg-blue-600'}`}>
                                                        <span className="material-symbols-outlined text-lg">chat</span> Message
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED') return;
                                                            try {
                                                                console.log('[MyCases] Schedule button clicked for case:', selectedCase.id);
                                                                const rolePath = currentUser?.role?.toLowerCase() || 'citizen';
                                                                const targetUrl = `/${rolePath}/dashboard?tab=schedule&caseId=${selectedCase.id}`;
                                                                navigate(targetUrl);
                                                            } catch (error) {
                                                                console.error('[MyCases] Navigation error:', error);
                                                            }
                                                        }}
                                                        disabled={selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED'}
                                                        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${selectedCase.status === 'RESOLVED' || selectedCase.status === 'REMOVED' ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-600'}`}>
                                                        <span className="material-symbols-outlined text-lg">calendar_month</span> Schedule
                                                    </button>
                                                    {/* Resolve Button for Professionals */}
                                                    {(currentUser?.role === 'LAWYER' || currentUser?.role === 'NGO') &&
                                                        selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                                                            <button
                                                                onClick={() => setShowResolveModal(true)}
                                                                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-sm"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">check_circle</span> Resolve
                                                            </button>
                                                        )}


                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-900/50">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-gray-600 mb-2">person_add</span>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Representative Assigned</h3>
                                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1 mb-6">Pending assignment.</p>
                                            {selectedCase.status !== 'REMOVED' && selectedCase.status !== 'RESOLVED' ? (
                                                <button
                                                    onClick={() => navigate(`?tab=directory&fromCase=true&caseId=${selectedCase.id}&caseType=${encodeURIComponent(selectedCase.category)}`)}
                                                    className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-primary border border-primary/20 px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">search</span>
                                                    Find Lawyer/NGO
                                                </button>
                                            ) : (
                                                <p className="text-sm font-semibold text-red-500">
                                                    {selectedCase.status === 'REMOVED' ? 'This case has been removed.' : 'This case is resolved.'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Documents */}
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wide">Case Documents</h4>
                                    {selectedCase.documents && selectedCase.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedCase.documents.map((doc) => (
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" key={doc.id}
                                                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-blue-50/30 dark:hover:bg-gray-800 transition group bg-white dark:bg-slate-900/50">
                                                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined">description</span>
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate group-hover:text-primary transition-colors">{doc.fileName}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{doc.fileType?.split('/')[1] || 'FILE'}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-slate-500 dark:text-gray-500 italic">No documents uploaded.</div>
                                    )}
                                </div>
                            </div>

                            {/* Right Col: Timeline */}
                            <div className="p-8 bg-slate-50 dark:bg-slate-800/20">
                                <h4 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-wide">Timeline</h4>
                                <ol className="relative border-l border-slate-200 dark:border-slate-800 ml-3">
                                    <li className="mb-10 ml-6">
                                        <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900">
                                            <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">check</span>
                                        </span>
                                        <h3 className="flex items-center mb-1 text-sm font-bold text-slate-900 dark:text-white">Case Filed</h3>
                                        <time className="block mb-2 text-xs font-normal leading-none text-slate-400">{selectedCase.filedDate}</time>
                                        <p className="mb-4 text-xs font-normal text-slate-500 dark:text-slate-400">Case was officially registered in the system.</p>
                                    </li>
                                    <li className="mb-10 ml-6">
                                        <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900 ${selectedCase.counterparty ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30 animate-pulse'}`}>
                                            <span className={`material-symbols-outlined text-xs ${selectedCase.counterparty ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {selectedCase.counterparty ? 'check' : 'person_search'}
                                            </span>
                                        </span>
                                        <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                            {selectedCase.counterparty?.role || 'Representation'}
                                        </h3>
                                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                            {selectedCase.counterparty ? `Assigned to ${selectedCase.counterparty.name}` : "Awaiting assignment."}
                                        </p>
                                    </li>
                                    <li className="ml-6">
                                        <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900 ${selectedCase.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                            selectedCase.status === 'REMOVED' ? 'bg-red-100 dark:bg-red-900/30' :
                                                selectedCase.status === 'PENDING_RESOLUTION' ? 'bg-amber-100 dark:bg-amber-900/30 animate-pulse' :
                                                    'bg-slate-200 dark:bg-slate-800'
                                            }`}>
                                            <span className={`material-symbols-outlined text-xs ${selectedCase.status === 'RESOLVED' ? 'text-emerald-600 dark:text-emerald-400' :
                                                selectedCase.status === 'REMOVED' ? 'text-red-600 dark:text-red-400' :
                                                    selectedCase.status === 'PENDING_RESOLUTION' ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                {selectedCase.status === 'RESOLVED' ? 'check' :
                                                    selectedCase.status === 'REMOVED' ? 'block' :
                                                        selectedCase.status === 'PENDING_RESOLUTION' ? 'priority_high' : 'gavel'}
                                            </span>
                                        </span>
                                        <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                            {selectedCase.status === 'REMOVED' ? 'Removed' : 'Resolution'}
                                        </h3>
                                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-2">
                                            {selectedCase.status === 'RESOLVED'
                                                ? "Case resolved and closed."
                                                : selectedCase.status === 'REMOVED'
                                                    ? "This case has been removed by administrators."
                                                    : selectedCase.status === 'PENDING_RESOLUTION'
                                                        ? "Resolution proposed. Action required."
                                                        : "Pending final verdict or settlement."}
                                        </p>

                                        {/* Resolution Action Button in Timeline */}
                                        {selectedCase.status === 'PENDING_RESOLUTION' && currentUser?.role === 'CITIZEN' && (
                                            <button
                                                onClick={(e) => handleViewResolution(e, selectedCase)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-sm animate-pulse"
                                            >
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                Review & Accept
                                            </button>
                                        )}

                                        {/* View Resolution Button for Resolved Cases */}
                                        {selectedCase.status === 'RESOLVED' && currentUser?.role === 'CITIZEN' && (
                                            <button
                                                onClick={(e) => handleViewResolution(e, selectedCase)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition shadow-sm mt-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">description</span>
                                                View Resolution Document
                                            </button>
                                        )}
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Resolve Case Modal */}
            <ResolveCaseModal
                show={showResolveModal}
                onClose={() => setShowResolveModal(false)}
                caseId={selectedCase?.id}
                onSuccess={() => {
                    window.location.reload();
                }}
            />

            {/* Resolution Details Modal for Citizen */}
            <ResolutionDetailsModal
                show={showResolutionModal}
                onClose={() => {
                    setShowResolutionModal(false);
                    setSelectedResolutionCase(null);
                    setResolutionData(null);
                }}
                caseData={selectedResolutionCase}
                resolution={resolutionData}
                loading={loadingResolution}
                onAccept={handleAcceptResolution}
            />

            {/* Report Case Modal */}
            <ReportCaseModal
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
                caseId={selectedCase?.id}
                onSuccess={() => {
                    // Optional: Refresh or navigate
                }}
            />

        </div >
    );
};

export default MyCases;
