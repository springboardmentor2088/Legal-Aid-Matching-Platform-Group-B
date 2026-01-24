import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaStar } from 'react-icons/fa';

const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined align-middle ${className}`}>
        {name}
    </span>
);

const ResolutionDetailsModal = ({ show, onClose, caseData, resolution, loading, onAccept }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    if (!show) return null;

    const handleAccept = () => {
        onAccept({ rating, feedback });
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
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Case Resolution
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {caseData?.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading resolution details...</p>
                    </div>
                ) : resolution ? (
                    <div className="space-y-6">
                        {/* Resolution Notes */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <MaterialIcon name="description" className="text-blue-500" />
                                Resolution Notes
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {resolution.resolutionNotes || "No notes provided."}
                                </p>
                            </div>
                        </div>

                        {/* Resolution Document */}
                        {resolution.resolutionDocumentUrl && (
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <MaterialIcon name="attach_file" className="text-purple-500" />
                                    Resolution Document
                                </h3>
                                <a
                                    href={resolution.resolutionDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition border border-blue-200 dark:border-blue-800"
                                >
                                    <MaterialIcon name="download" />
                                    View/Download Document
                                </a>
                            </div>
                        )}

                        {/* Submission Details */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <MaterialIcon name="info" className="text-teal-500" />
                                Submission Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted By</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {resolution.submittedByName || "Professional"}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted On</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {resolution.resolutionSubmittedAt
                                            ? new Date(resolution.resolutionSubmittedAt).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rating & Feedback Section - Only for Pending Resolution */}
                        {caseData?.status !== 'RESOLVED' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MaterialIcon name="rate_review" className="text-amber-500" />
                                    Provide Feedback (Optional)
                                </h3>

                                <div className="space-y-4">
                                    {/* Star Rating */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm text-gray-600 dark:text-gray-300">Rate your experience with this professional:</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <FaStar
                                                        className={`w-8 h-8 ${star <= (hoverRating || rating)
                                                                ? 'text-yellow-400'
                                                                : 'text-gray-300 dark:text-gray-600'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            {rating > 0 && <span className="ml-2 text-sm text-gray-500 self-center">({rating}/5)</span>}
                                        </div>
                                    </div>

                                    {/* Feedback Text */}
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-300 block mb-2">Leave a review:</label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Share your experience working with this lawyer/NGO..."
                                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {caseData?.status !== 'RESOLVED' && (
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    <FaCheckCircle />
                                    Accept & Close Case
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition ${caseData?.status === 'RESOLVED' ? 'w-full' : ''}`}
                            >
                                {caseData?.status === 'RESOLVED' ? 'Close' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">Failed to load resolution details.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResolutionDetailsModal;
