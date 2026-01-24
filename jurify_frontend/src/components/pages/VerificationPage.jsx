import React, { useState, useEffect } from 'react';
import { verificationService } from '../../services/verificationService';
import { useAuth } from '../../context/AuthContext';

const VerificationPage = ({ embedded = false, profile: propProfile }) => {
    const { user } = useAuth();
    const [documentUrl, setDocumentUrl] = useState('');
    const [documentType, setDocumentType] = useState('BAR_MEMBERSHIP_CARD');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Use passed profile or rely on parent to pass it. If not passed, we might need a way to get it, 
    // but in dashboards it will be passed.
    const currentStatus = propProfile?.verificationStatus || status || 'PENDING';
    const isVerified = currentStatus === 'VERIFIED';
    const isRejected = currentStatus === 'REJECTED';
    const isPending = currentStatus === 'PENDING';

    useEffect(() => {
        // If we want to support standalone usage, we'd fetch profile here if propProfile is missing
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await verificationService.submitRequest({
                documentUrl,
                documentType
            });
            setMessage('Verification request submitted successfully!');
            setStatus('PENDING'); // Optimistic update
            setShowForm(false);
        } catch (error) {
            setMessage('Error submitting request: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Please login first.</div>;

    const isLawyer = user.role === 'LAWYER';
    const isNGO = user.role === 'NGO';

    if (!isLawyer && !isNGO) {
        return <div className="p-8 text-center">Verification is only available for Lawyers and NGOs.</div>;
    }

    const containerClasses = embedded
        ? "w-full mx-auto"
        : "min-h-screen bg-gray-100 p-8";

    const cardClasses = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8";

    // Status View
    if ((isPending || isVerified || isRejected) && !showForm) {
        let statusColor = 'blue';
        let statusIcon = 'schedule'; // pending
        let statusTitle = 'Verification Pending';
        let statusDesc = 'We are currently reviewing your documents. This usually takes 24-48 hours.';

        if (isVerified) {
            statusColor = 'green';
            statusIcon = 'check_circle';
            statusTitle = 'Verification Complete';
            statusDesc = 'Your profile has been verified. You now have full access to all features.';
        } else if (isRejected) {
            statusColor = 'red';
            statusIcon = 'error';
            statusTitle = 'Verification Rejected';
            statusDesc = 'Your document verification was not successful. Please review the requirements and apply again.';
        }

        return (
            <div className={containerClasses}>
                <div className={`${cardClasses} text-center space-y-6`}>
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-${statusColor}-50 dark:bg-${statusColor}-900/20`}>
                        <span className={`material-symbols-outlined text-4xl text-${statusColor}-500`}>
                            {statusIcon}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{statusTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{statusDesc}</p>
                    </div>

                    {isRejected && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#11676a] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                        >
                            Apply Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Form View
    return (
        <div className={containerClasses}>
            {embedded && showForm && (
                <button
                    onClick={() => setShowForm(false)}
                    className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Status
                </button>
            )}

            <div className={cardClasses}>
                <h2 className="text-2xl font-bold mb-6 text-[#11676a]">Submit Verification Documents</h2>

                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <p className="font-medium mb-2">Please submit your supporting documents:</p>
                    <ul className="list-disc ml-5 text-sm space-y-1 opacity-90">
                        {isLawyer && <li>Bar Council Membership Card (Official ID)</li>}
                        {isNGO && <li>NGO Registration Certificate / Darpan ID</li>}
                    </ul>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.includes('success')
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                        }`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
                        <div className="relative">
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#11676a] focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="BAR_MEMBERSHIP_CARD">Bar Council Membership Card</option>
                                <option value="NGO_REGISTRATION_CERTIFICATE">NGO Registration Certificate</option>
                                <option value="OTHER">Other</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document URL</label>
                        <input
                            type="text"
                            value={documentUrl}
                            onChange={(e) => setDocumentUrl(e.target.value)}
                            placeholder="https://example.com/my-document.pdf"
                            className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#11676a] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Please provide a publicly accessible URL (Google Drive, Dropbox, etc.)
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-12 bg-[#11676a] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerificationPage;
