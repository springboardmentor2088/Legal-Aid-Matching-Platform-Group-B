import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { caseService } from '../../services/caseService';
import { useToast } from '../common/ToastContext';

const ReportsDashboard = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("pending");
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [removalReason, setRemovalReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            let data;
            if (activeTab === "pending") {
                data = await caseService.getPendingReports();
            } else {
                // Client-side filtering for demo if backend returns all, or separate endpoint
                // We added getReportHistory which returns all. Let's filter here or backend.
                // Current backend getReportHistory returns ALL. Let's filter on frontend for simplicity if needed,
                // or just show all.
                // Ideally, history = everything NOT pending, or just everything.
                // Let's assume history means "Resolved/Dismissed".
                const allData = await caseService.getReportHistory();
                data = allData.filter(r => r.status !== 'PENDING');
            }
            setReports(data || []);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            showToast({ message: "Failed to load reports", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [activeTab]);

    const handleDismiss = async (reportId) => {
        try {
            await caseService.dismissReport(reportId);
            showToast({ message: "Report dismissed", type: "success" });
            fetchReports();
        } catch (error) {
            showToast({ message: "Failed to dismiss report", type: "error" });
        }
    };

    const handleResolveClick = (reportId) => {
        setSelectedReportId(reportId);
        setRemovalReason("Violation of platform policies."); // Default text
        setShowResolveModal(true);
    };

    const confirmResolve = async () => {
        if (!removalReason.trim()) {
            showToast({ message: "Please provide a reason for removal.", type: "error" });
            return;
        }

        setIsSubmitting(true);
        try {
            await caseService.resolveReportAndRemoveCase(selectedReportId, removalReason);
            showToast({ message: "Case removed and citizen notified", type: "success" });
            fetchReports();
            setShowResolveModal(false);
        } catch (error) {
            showToast({ message: "Failed to remove case", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === "pending"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Pending Reports
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 font-bold rounded-lg transition ${activeTab === "history"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        History
                    </button>
                </div>
                <button
                    onClick={fetchReports}
                    className="p-2 text-gray-600 hover:text-primary transition"
                    title="Refresh Reports"
                >
                    <FiRefreshCw />
                </button>
            </div>

            {reports.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheck className="text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clean!</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">No pending case reports found.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide 
                                            ${report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                report.status === 'RESOLVED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                            {report.status}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(report.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                        {/* Use snapshot title if available, otherwise just ID */}
                                        {report.caseTitle ? `Case: ${report.caseTitle}` : `Report for Case ID: ${report.caseId}`}
                                    </h3>
                                    <p className="text-gray-600 dark:text-slate-300 text-sm mb-4">
                                        <span className="font-medium text-gray-900 dark:text-slate-200">Reason:</span> {report.reason}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        Reported by: <span className="font-medium">{report.reporterRole}</span> (ID: {report.reporterId})
                                        {report.caseOwnerEmail && <span className="ml-2">• Owner: {report.caseOwnerEmail}</span>}
                                    </div>
                                </div>
                                {activeTab === "pending" && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => handleDismiss(report.id)}
                                            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => handleResolveClick(report.id)}
                                            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <FiAlertTriangle /> Remove Case
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Resolve Modal */}
            {showResolveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all scale-100">
                        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                            <FiAlertTriangle className="text-2xl" />
                            <h3 className="text-xl font-bold">Remove Case?</h3>
                        </div>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">
                            This action cannot be undone. The case will be permanently deleted, and the citizen will be notified.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Reason for Removal (Sent to Citizen)
                            </label>
                            <textarea
                                value={removalReason}
                                onChange={(e) => setRemovalReason(e.target.value)}
                                className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                placeholder="e.g., Violation of Terms of Service..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowResolveModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmResolve}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-bold shadow-lg shadow-red-500/30 flex items-center gap-2"
                            >
                                {isSubmitting ? "Removing..." : "Confirm Removal"}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ReportsDashboard;
