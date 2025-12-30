import React, { useState, useEffect } from 'react';
import { FaPlus, FaCalendarAlt, FaGavel, FaArrowLeft, FaFilePdf, FaUserTie, FaPhoneAlt, FaEnvelope, FaDownload, FaSpinner } from 'react-icons/fa';
import { caseService } from '../../services/caseService';

const MyCases = ({ onNewCase }) => {
    const [selectedCase, setSelectedCase] = useState(null);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const data = await caseService.getMyCases();
            // Transform backend data to match UI expected format
            // Backend fields: id, title, description, category, status, urgency, user (lawyer info might be here or separate)
            const formattedCases = data.map(item => ({
                id: item.id,
                caseNumber: `CN-${new Date(item.createdAt).getFullYear()}-${String(item.id).padStart(4, '0')}`,
                title: item.title,
                category: item.category || "General",
                status: item.status || "PENDING",
                filedDate: new Date(item.createdAt).toLocaleDateString(),
                nextHearing: "TBD", // Backend doesn't have this yet
                description: item.description,
                lastUpdate: "Case filed successfully.",
                documents: item.documents || [],
                lawyer: item.lawyerName ? {
                    name: item.lawyerName,
                    email: "Contact via Directory", // Placeholder until backend sends this
                    phone: "N/A",
                    specialization: "Legal Counsel"
                } : null
            }));
            setCases(formattedCases);
        } catch (err) {
            console.error("Failed to fetch cases:", err);
            setError("Failed to load your cases. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'ACTIVE' || c.status === 'OPEN').length;
    const pendingCases = cases.filter(c => c.status === 'PENDING').length;

    const MaterialIcon = ({ name, className = "" }) => (
        <span className={`material-symbols-outlined align-middle ${className}`}>
            {name}
        </span>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-64">
                <FaSpinner className="animate-spin text-4xl text-primary mb-4" />
                <p className="text-gray-500 font-medium">Loading your legal matters...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600 font-bold mb-2">Error Loading Cases</p>
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchCases}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition text-sm font-semibold"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // --- CASE DETAIL VIEW ---
    if (selectedCase) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <button
                    onClick={() => setSelectedCase(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition font-bold text-sm bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
                >
                    <FaArrowLeft size={12} /> Back to My Cases
                </button>

                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="bg-primary p-8 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="bg-white/20 px-3 py-1 rounded text-xs font-mono mb-2 inline-block">
                                    {selectedCase.caseNumber}
                                </span>
                                <h2 className="text-3xl font-bold">{selectedCase.title}</h2>
                                <p className="text-white/80 mt-2 flex items-center gap-2">
                                    <FaGavel /> {selectedCase.category}
                                </p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border-2 ${selectedCase.status === 'ACTIVE' ? 'bg-green-500 border-green-400' : 'bg-yellow-500 border-yellow-400'
                                }`}>
                                {selectedCase.status}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider text-sm">Case Details</h3>
                                <p className="text-gray-600 leading-relaxed">{selectedCase.description}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 uppercase tracking-wider text-sm">Documents</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedCase.documents && selectedCase.documents.length > 0 ? (
                                        selectedCase.documents.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    const url = doc.fileUrl || (typeof doc === 'string' ? doc : null);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FaFilePdf className="text-red-500 text-xl" />
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-bold text-gray-700 truncate max-w-[150px]">
                                                            {doc.fileName || (typeof doc === 'string' ? "Document" : "Unknown File")}
                                                        </p>
                                                        {/* File size not available from basic string list usually */}
                                                    </div>
                                                </div>
                                                <FaDownload className="text-gray-300 group-hover:text-primary transition" />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No documents attached.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="text-primary font-bold flex items-center gap-2 mb-4 uppercase text-xs tracking-wider">
                                    <FaUserTie /> Assigned Lawyer
                                </h3>
                                {selectedCase.lawyer ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-800">{selectedCase.lawyer.name}</h4>
                                            <p className="text-sm text-gray-500 font-medium">{selectedCase.lawyer.specialization}</p>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t border-blue-100">
                                            <p className="flex items-center gap-3 text-sm text-gray-600"><FaPhoneAlt className="text-primary" size={12} /> {selectedCase.lawyer.phone}</p>
                                            <p className="flex items-center gap-3 text-sm text-gray-600"><FaEnvelope className="text-primary" size={12} /> {selectedCase.lawyer.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <p className="text-sm mb-2">No lawyer assigned yet.</p>
                                        <p className="text-xs text-gray-400">Your case is being reviewed.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- CASE LIST VIEW ---
    return (
        <div className="space-y-6 animate-fadeIn">

            {/* STATS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Cases */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Records</p>
                        <p className="text-3xl font-black text-gray-800">{totalCases}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MaterialIcon name="folder_open" className="text-3xl" />
                    </div>
                </div>

                {/* Active Cases */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Matters</p>
                        <p className="text-3xl font-black text-gray-800">{activeCases}</p>
                    </div>
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MaterialIcon name="gavel" className="text-3xl" />
                    </div>
                </div>

                {/* Pending Cases */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Review</p>
                        <p className="text-3xl font-black text-gray-800">{pendingCases}</p>
                    </div>
                    <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MaterialIcon name="history" className="text-3xl" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">My Legal Cases</h2>
                    <p className="text-gray-500 text-sm">Manage your active filings and legal representation</p>
                </div>
                <button onClick={onNewCase} className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#0e5658] transition flex items-center gap-2 shadow-md">
                    <FaPlus size={14} /> Submit New Case
                </button>
            </div>

            {/* Case Cards */}
            <div className="grid grid-cols-1 gap-5">
                {cases.length > 0 ? (
                    cases.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 border-l-primary">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                            <FaGavel className="text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
                                            <p className="text-sm text-gray-500 font-mono mt-1">{item.caseNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">Filed: {item.filedDate}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5 border-y border-gray-50 my-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Legal Category</label>
                                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-tight">{item.category}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Assigned Counsel</label>
                                        <p className="text-sm font-semibold text-gray-700">{item.lawyer ? item.lawyer.name : "Pending Assignment"}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">Next Hearing</label>
                                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <FaCalendarAlt className="text-primary" /> {item.nextHearing}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => setSelectedCase(item)}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                                    >
                                        <MaterialIcon name="visibility" className="text-lg" /> View Full Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaPlus className="text-2xl text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No cases filed yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Get started by submitting a new legal case. We'll help you find the right lawyer.</p>
                        <button onClick={onNewCase} className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0e5658] transition shadow-md">
                            Submit a Case
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCases;