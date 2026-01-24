import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGrid, FiList, FiCheck } from 'react-icons/fi';
const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Delhi",
    "Puducherry",
    "Ladakh",
    "Jammu and Kashmir",
];
const INDIAN_LANGUAGES = [
    "ENGLISH",
    "HINDI",
    "BENGALI",
    "TELUGU",
    "MARATHI",
    "TAMIL",
    "URDU",
    "GUJARATI",
    "KANNADA",
    "MALAYALAM",
    "PUNJABI",
    "OTHER",];
const CASE_TYPES = [
    "Civil Law",
    "Criminal Law",
    "Family Law",
    "Property Law",
    "Labor Law",
    "Consumer Protection",
    "Environmental Law",
    "Intellectual Property",
    "Tax Law",
    "Corporate Law",
    "Human Rights",
    "Other",];

const LawyerSearch = () => {
    const navigate = useNavigate();

    // States
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list");
    const [filters, setFilters] = useState({ state: "All", caseType: "All", language: "All" });

    const lawyerDatabase = [
        { id: 1, name: "Adv. Priya Sharma", score: 98, expertise: "Criminal Law", office: "Colaba, Mumbai", state: "Maharashtra", language: "Hindi", available: "Immediate", exp: "12 yrs", rating: 4.9, bio: "Top-rated criminal defense attorney specializing in high-profile litigation with over a decade of experience in session courts.", email: "priya.s@legal.in", phone: "+91 99001 12233", color: "bg-indigo-600", casesHandled: "450+" },
        { id: 2, name: "Adv. Rahul Verma", score: 92, expertise: "Family Law", office: "Hauz Khas, Delhi", state: "Delhi", language: "English", available: "This Week", exp: "8 yrs", rating: 4.7, bio: "Expert in matrimonial disputes, child custody cases, and domestic law settlements.", email: "verma.rahul@law.com", phone: "+91 88776 65544", color: "bg-rose-600", casesHandled: "280+" },
        { id: 3, name: "Adv. Sneha Kapur", score: 85, expertise: "Property Law", office: "Baner, Pune", state: "Maharashtra", language: "Marathi", available: "Immediate", exp: "15 yrs", rating: 4.8, bio: "Specializes in real estate verification, RERA disputes, and ancestral property litigations.", email: "sneha.k@property.in", phone: "+91 77665 54433", color: "bg-teal-600", casesHandled: "610+" },
    ];

    const filteredData = useMemo(() => {
        return lawyerDatabase.filter(l =>
            (filters.state === "All" || l.state === filters.state) &&
            (filters.caseType === "All" || l.expertise === filters.caseType) &&
            (l.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [filters, searchTerm]);

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden text-slate-700 font-sans">

            {/* 1. TOP NAV - UPDATED TOGGLE BACKGROUND */}
            <header className="min-h-[64px] border-b border-slate-200 px-4 md:px-8 flex items-center justify-between bg-white shrink-0 gap-2">
                <div className="flex items-center gap-3 md:gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-xl md:text-2xl text-slate-600">arrow_back</span>
                    </button>
                    <h1 className="hidden sm:block text-sm font-black tracking-[0.25em] uppercase text-slate-900">Lawyer Impact Engine</h1>
                </div>

                <div className="flex-1 max-w-lg">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search by Lawyer name..."
                            className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-12 pr-6 text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* EMERALD BACKGROUND TOGGLE */}
                    <div className="flex bg-teal-600 p-1.5 rounded-2xl shadow-inner border border-teal-700">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-xl transition-all duration-200 ${viewMode === 'grid'
                                    ? 'bg-white shadow-lg text-teal-600'
                                    : 'text-teal-800 hover:bg-teal-500'
                                }`}
                        >
                            <FiGrid size={18} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-xl transition-all duration-200 ${viewMode === 'list'
                                    ? 'bg-white shadow-lg text-teal-600'
                                    : 'text-teal-100 hover:bg-teal-500'
                                }`}
                        >
                            <FiList size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <span className="hidden xs:block text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full whitespace-nowrap tracking-wider border border-emerald-100 uppercase">
                        ● {filteredData.length} ACTIVE
                    </span>
                </div>
            </header>

            {/* 2. FILTER BAR */}
            <div className="px-4 md:px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex gap-6 items-center shrink-0 overflow-x-auto no-scrollbar">
                {['state', 'caseType', 'language'].map((filterKey) => (
                    <div key={filterKey} className="flex flex-col min-w-[160px]">
                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{filterKey}</label>
                        <select
                            name={filterKey}
                            onChange={(e) => setFilters(prev => ({ ...prev, [filterKey]: e.target.value }))}
                            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-teal-500 shadow-sm"
                        >
                            <option value="All">All {filterKey === 'caseType' ? 'Expertise' : filterKey}</option>
                            {(filterKey === 'state' ? INDIAN_STATES : filterKey === 'caseType' ? CASE_TYPES : INDIAN_LANGUAGES).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            {/* 3. MAIN CONTENT (LIST/GRID) */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {viewMode === "list" ? (
                    <>
                        <div className="grid grid-cols-12 gap-6 px-10 py-4 bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            <div className="col-span-4">Professional</div>
                            <div className="col-span-2">Specialization</div>
                            <div className="col-span-2">Jurisdiction</div>
                            <div className="col-span-1 text-center">Rating</div>
                            <div className="col-span-3 text-right pr-6">Match Score</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredData.map((lawyer) => (
                                <div key={lawyer.id} onClick={() => setSelectedLawyer(lawyer)} className="grid grid-cols-12 gap-6 px-10 py-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all items-center group">
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${lawyer.color} text-white flex items-center justify-center text-xs font-black shadow-md`}>{lawyer.name.charAt(5)}</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-tight">{lawyer.name}</p>
                                            <p className="text-xs text-slate-400 mt-1 font-bold">{lawyer.exp} Experience</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2"><span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-md uppercase">{lawyer.expertise}</span></div>
                                    <div className="col-span-2 text-xs font-bold text-slate-500 truncate">{lawyer.office}</div>
                                    <div className="col-span-1 text-center text-sm font-black text-amber-500">★ {lawyer.rating}</div>
                                    <div className="col-span-3 text-right pr-6 flex items-center justify-end gap-4">
                                        <span className="text-sm font-black text-teal-600">{lawyer.score}%</span>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900">chevron_right</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredData.map((lawyer) => (
                                <div key={lawyer.id} onClick={() => setSelectedLawyer(lawyer)} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group relative text-center flex flex-col items-center">
                                    <div className="absolute top-4 right-4 text-teal-600 text-[10px] font-black uppercase tracking-widest">{lawyer.score}%</div>
                                    <div className={`w-16 h-16 rounded-2xl ${lawyer.color} flex items-center justify-center text-2xl text-white shadow-lg mb-4`}>⚖️</div>
                                    <h3 className="text-base font-black text-slate-900 group-hover:text-teal-600 transition-colors">{lawyer.name}</h3>
                                    <p className="text-teal-600 text-[9px] font-black uppercase tracking-widest mt-1">{lawyer.expertise}</p>
                                    <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-teal-600 transition-colors">View Profile</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* 4. CENTERED MODAL - INTEGRATED YOUR CODE */}
            {selectedLawyer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-200">
                        <button
                            onClick={() => setSelectedLawyer(null)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-10"
                        >
                            ✕
                        </button>

                        <div className="p-8 md:p-10 space-y-5">
                            {/* HEADER SECTION */}
                            <div className="flex items-center gap-5">
                                <div className="relative flex-shrink-0">
                                    <div className={`w-16 h-16 rounded-2xl ${selectedLawyer.color} flex items-center justify-center text-3xl shadow-inner`}>
                                        ⚖️
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                                        <FiCheck size={10} strokeWidth={4} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-black text-slate-900 truncate">{selectedLawyer.name}</h2>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                        <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">{selectedLawyer.expertise}</span>
                                        <span className="text-slate-400 text-[10px] font-bold uppercase">📍 {selectedLawyer.office.split(',')[1]}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 font-bold text-xs text-slate-700">
                                        <span>⭐ {selectedLawyer.rating}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{selectedLawyer.exp} Exp</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-emerald-600">{selectedLawyer.casesHandled} Cases</span>
                                    </div>
                                </div>
                            </div>

                            {/* CONTENT SECTION */}
                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Biography</h5>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">
                                        "{selectedLawyer.bio}"
                                    </p>
                                </div>

                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                    <h5 className="text-[9px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Contact Details</h5>
                                    <div className="text-xs flex flex-col gap-1 font-medium text-slate-700">
                                        <p><span className="text-emerald-600/60 font-bold">Email:</span> {selectedLawyer.email}</p>
                                        <p><span className="text-emerald-600/60 font-bold">Phone:</span> {selectedLawyer.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL ACTIONS */}
                            <div className="space-y-2 pt-1">
                                <button className="w-full py-3.5 bg-emerald-500 text-white text-base font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                    🚀 Request Assistance
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all">💬 Message</button>
                                    <button className="py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all">📅 Schedule</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerSearch;