import React, { useState, useEffect } from 'react';
import { verificationService } from '../../services/verificationService';
import { useAuth } from '../../context/AuthContext';

const VerificationPage = () => {
    const { user } = useAuth();
    const [documentUrl, setDocumentUrl] = useState('');
    const [documentType, setDocumentType] = useState('BAR_MEMBERSHIP_CARD');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Ideally we would fetch current verification status here
        // For now, we assume user knows their status or we can check via an API if exists
        // Since we don't have a specific GET /verification/status API for users, we'll rely on what we have
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

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6 text-[#11676a]">Profile Verification</h2>

                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded">
                    <p>Please submit your supporting documents to get verified.</p>
                    <ul className="list-disc ml-5 mt-2">
                        {isLawyer && <li>Bar Council Membership Card</li>}
                        {isNGO && <li>NGO Registration Certificate</li>}
                    </ul>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Document Type</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#11676a]"
                        >
                            <option value="BAR_MEMBERSHIP_CARD">Bar Council Membership Card</option>
                            <option value="NGO_REGISTRATION_CERTIFICATE">NGO Registration Certificate</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Document URL</label>
                        <input
                            type="text"
                            value={documentUrl}
                            onChange={(e) => setDocumentUrl(e.target.value)}
                            placeholder="https://example.com/my-document.pdf"
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#11676a]"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">Please provide a publicly accessible URL to your document (e.g., Google Drive link, S3 URL).</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#11676a] text-white py-2 px-4 rounded hover:bg-[#0f5a5d] transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerificationPage;
