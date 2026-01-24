import React, { useState } from 'react';
import { caseService } from '../../services/caseService';
import { useToast } from '../common/ToastContext';
import { FiFlag, FiX } from 'react-icons/fi';

const ReportCaseModal = ({ show, onClose, caseId, onSuccess }) => {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            showToast({ message: "Please provide a reason for reporting this case.", type: "error" });
            return;
        }

        setLoading(true);
        try {
            await caseService.reportCase(caseId, reason);
            showToast({ message: "Case reported successfully to administrators.", type: "success" });
            setReason("");
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error("Report failed:", error);
            showToast({ message: "Failed to submit report. Please try again.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="bg-red-50 dark:bg-red-900/30 p-6 flex items-center gap-3 border-b border-red-100 dark:border-red-800/50">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 flex items-center justify-center shrink-0">
                        <FiFlag className="text-lg" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report Case</h3>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Flag this case as invalid</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason for Reporting
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please explain why this case is invalid (e.g., spam, duplicate, inappropriate content)..."
                            className="w-full h-32 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition resize-none"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiFlag /> Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportCaseModal;
