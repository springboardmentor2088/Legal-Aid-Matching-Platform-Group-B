import React, { useState, useEffect } from 'react';
import { verificationService } from "../../services/verificationService";

const CasesTable = () => {
    const [selectedCase, setSelectedCase] = useState(null);
    const [notes, setNotes] = useState("");
    const [submittedCases, setSubmittedCases] = useState([]);

    useEffect(() => {
        verificationService.fetchCases().then(data => {
            if (data) {
                setSubmittedCases(data);
            }
        });
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-teal-50/50 dark:bg-teal-900/20">
                        <tr className="text-[11px] font-black text-teal-700/60 dark:text-teal-400/60 uppercase tracking-widest">
                            <th className="px-8 py-5">Reference</th>
                            <th className="px-8 py-5">Subject</th>
                            <th className="px-8 py-5">Attorney</th>
                            <th className="px-8 py-5">Registration</th>
                            <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {submittedCases.map(item => (
                            <tr key={item.id} className="hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors">
                                <td className="px-8 py-5 font-mono font-bold text-teal-600 dark:text-teal-400">{item.id}</td>
                                <td className="px-8 py-5">
                                    <p className="font-bold dark:text-white">{item.citizen}</p>
                                    <p className="text-xs text-gray-400">{item.category}</p>
                                </td>
                                <td className="px-8 py-5 text-sm dark:text-gray-300">{item.lawyer}</td>
                                <td className="px-8 py-5 text-xs text-gray-400">{item.regDate}</td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => setSelectedCase(item)}
                                        className="bg-[#11676a] text-white text-[10px] font-bold px-5 py-2 rounded-full hover:bg-[#0d5254] transition-colors"
                                    >
                                        OPEN FILE
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {selectedCase && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

                    {/* Modal Container - Max Width reduced to 4xl */}
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[40px] shadow-2xl relative flex flex-col max-h-[85vh]">

                        <button
                            onClick={() => setSelectedCase(null)}
                            className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-teal-600 rounded-full transition-colors font-bold"
                        >
                            ✕
                        </button>

                        <div className="overflow-y-auto p-8 space-y-8">

                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white">Case {selectedCase.id}</h2>
                                    <p className="text-sm font-bold text-teal-600 mt-1">{selectedCase.category}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedCase.priority === "High" ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"}`}>
                                    {selectedCase.priority} Priority
                                </div>
                            </div>

                            {/* Teal Timeline */}
                            <div className="grid grid-cols-5 gap-2">
                                {["Submitted", "Reviewing", "Assigned", "Hearing", "Closed"].map((step) => (
                                    <div key={step} className="space-y-2">
                                        <div className={`h-1.5 rounded-full ${selectedCase.status === step ? "bg-teal-600" : "bg-gray-100 dark:bg-gray-800"}`} />
                                        <p className={`text-[10px] font-bold text-center ${selectedCase.status === step ? "text-teal-600" : "text-gray-400"}`}>{step}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-teal-50/30 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-800/30">
                                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Registered Citizen</p>
                                    <p className="text-lg font-bold dark:text-white">{selectedCase.citizen}</p>
                                    <p className="text-xs text-gray-400">{selectedCase.regDate} • {selectedCase.regTime}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-teal-50/30 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-800/30">
                                    <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2">Assigned Lawyer</p>
                                    <p className="text-lg font-bold dark:text-white">{selectedCase.lawyer}</p>
                                    <p className="text-xs text-gray-400">{selectedCase.lawyerExp} Exp • {selectedCase.lawyerCases} Cases</p>
                                </div>
                            </div>

                            {/* Teal Hearing Notice */}
                            <div className="bg-[#11676a] p-5 rounded-3xl flex items-center gap-4 text-white">
                                <span className="material-symbols-outlined text-teal-200">event_note</span>
                                <div>
                                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Next Court Hearing</p>
                                    <p className="font-bold">{selectedCase.hearing}</p>
                                </div>
                            </div>

                            {/* Case Text Area */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-teal-600/50 uppercase tracking-widest">Legal Summary</p>
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl text-sm leading-relaxed dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                                    {selectedCase.description}
                                </div>
                            </div>

                            {/* Evidence Section */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-teal-600/50 uppercase tracking-widest">Evidence Vault</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedCase.documents.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl hover:border-teal-500 transition-all cursor-pointer">
                                            <span className="material-symbols-outlined text-teal-600 text-lg">description</span>
                                            <span className="text-[10px] font-bold dark:text-white truncate">{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes & Activity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-teal-600/50 uppercase tracking-widest">Internal Notes</p>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm dark:text-white min-h-[100px] focus:ring-1 focus:ring-teal-600 outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-teal-600/50 uppercase tracking-widest">History Log</p>
                                    <div className="space-y-2">
                                        {selectedCase.activity.map((a, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                                <div className="w-1 h-1 bg-teal-500 rounded-full" />
                                                {a}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions - Scroll with content */}
                            <div className="flex gap-3 pt-6 pb-2">
                                <button className="flex-1 bg-[#11676a] text-white font-black py-4 rounded-2xl hover:bg-[#0d5254] transition-all text-xs tracking-widest">
                                    DOWNLOAD CASE REPORT
                                </button>
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="px-8 border border-gray-200 dark:border-gray-700 font-bold rounded-2xl dark:text-white hover:bg-gray-50 transition-all text-xs"
                                >
                                    EXIT
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CasesTable;