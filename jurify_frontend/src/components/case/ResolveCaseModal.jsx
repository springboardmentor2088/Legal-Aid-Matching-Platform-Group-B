import React, { useState } from 'react';
import { caseService } from '../../services/caseService';
import { useToast } from '../common/ToastContext';
import { FiX, FiCheckCircle, FiUpload, FiFileText } from 'react-icons/fi';

const ResolveCaseModal = ({ show, onClose, caseId, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    if (!show) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            showToast({ message: "Please upload a resolution document.", type: "error" });
            return;
        }

        try {
            setLoading(true);
            await caseService.submitResolution(caseId, file, notes);
            showToast({ message: "Case resolved successfully!", type: "success" });
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error("Resolution failed", error);
            showToast({ message: "Failed to submit resolution.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiCheckCircle className="text-emerald-500" />
                        Resolve Case
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/20">
                        Submitting a resolution will mark this case as <strong>Pending Acknowledgment</strong>. The citizen must acknowledge it to close the case.
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resolution Document (Required)</label>
                        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group text-center">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <FiFileText className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary transition">
                                        <FiUpload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Click to upload document</p>
                                    <p className="text-xs text-gray-400">PDF, DOC, DOCX up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Closing Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add brief notes about the resolution..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                            rows="3"
                        ></textarea>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Submitting...' : 'Submit Resolution'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResolveCaseModal;
