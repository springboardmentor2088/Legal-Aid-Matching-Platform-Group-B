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

const CAUSE_AREAS = [
    "Education", "Healthcare", "Environment", "Women Empowerment",
    "Child Welfare", "Animal Rights", "Disaster Relief"
];

const NGODiscovery = () => {
    const navigate = useNavigate();

    // States
    const [selectedNGO, setSelectedNGO] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("list"); // New: Toggle State
    const [filters, setFilters] = useState({ state: "All", cause: "All", language: "All" });

    const ngoDatabase = [
        { id: 1, name: "Udaan Foundation", score: 98, cause: "Education", location: "Mumbai", state: "Maharashtra", language: "Hindi", reach: "10k+ lives", rating: 4.9, bio: "Transforming rural education through digital classrooms and teacher training programs.", email: "contact@udaan.org", contact: "+91 98200 11223", color: "bg-indigo-600" },
        { id: 2, name: "Aarogya Seva", score: 92, cause: "Healthcare", location: "Delhi", state: "Delhi", language: "English", reach: "50k+ patients", rating: 4.7, bio: "Providing low-cost medical surgical interventions and health camps in urban slums.", email: "info@aarogyaseva.org", contact: "+91 11234 56789", color: "bg-emerald-600" },
        { id: 3, name: "Green Earth Trust", score: 85, cause: "Environment", location: "Pune", state: "Maharashtra", language: "Marathi", reach: "1M trees", rating: 4.8, bio: "Dedicated to reforestation and water conservation projects across Western Ghats.", email: "green@earthtrust.in", contact: "+91 20256 77889", color: "bg-teal-600" },
        { id: 4, name: "Sakshi Shakti", score: 78, cause: "Women Empowerment", location: "Bangalore", state: "Karnataka", language: "English", reach: "5k+ women", rating: 4.5, bio: "Skill development and legal aid for women from marginalized backgrounds.", email: "help@sakshi.org", contact: "+91 80456 12345", color: "bg-rose-600" },
    ];

    const filteredData = useMemo(() => {
        return ngoDatabase.filter(n =>
            (filters.state === "All" || n.state === filters.state) &&
            (filters.cause === "All" || n.cause === filters.cause) &&
            (n.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [filters, searchTerm]);

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden text-slate-700 font-sans">

            {/* 1. TOP NAV - MATCHING LAWYERSEARCH */}
            <header className="min-h-[64px] border-b border-slate-200 px-4 md:px-8 flex items-center justify-between bg-white shrink-0 gap-2">
                <div className="flex items-center gap-3 md:gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-xl md:text-2xl">arrow_back</span>
                    </button>
                    <h1 className="hidden sm:block text-sm font-black tracking-[0.25em] uppercase text-slate-900">NGO Impact Engine</h1>
                </div>

                <div className="flex-1 max-w-lg">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search by NGO name..."
                            className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-12 pr-6 text-xs md:text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                        >
                            <FiGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                        >
                            <FiList size={18} />
                        </button>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-indigo-50 px-3 py-1.5 rounded-full whitespace-nowrap tracking-wider uppercase">
                        ● {filteredData.length} ACTIVE
                    </span>
                </div>
            </header>

            {/* 2. FILTER BAR */}
            <div className="px-4 md:px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex gap-6 items-center shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex flex-col min-w-[160px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Region</label>
                    <select
                        name="state"
                        onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                        className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-emerald-500 shadow-sm"
                    >
                        <option value="All">All of India</option>
                        {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                </div>

                <div className="flex flex-col min-w-[160px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Cause Area</label>
                    <select
                        name="cause"
                        onChange={(e) => setFilters(prev => ({ ...prev, cause: e.target.value }))}
                        className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-emerald-500 shadow-sm"
                    >
                        <option value="All">All Causes</option>
                        {CAUSE_AREAS.map(cause => <option key={cause} value={cause}>{cause}</option>)}
                    </select>
                </div>
            </div>

            {/* 3. MAIN CONTENT (LIST/GRID) */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {viewMode === "list" ? (
                    <>
                        <div className="grid grid-cols-12 gap-6 px-10 py-4 bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                            <div className="col-span-4">Organization</div>
                            <div className="col-span-2">Cause</div>
                            <div className="col-span-2">Location</div>
                            <div className="col-span-1 text-center">Rating</div>
                            <div className="col-span-3 text-right pr-6">Impact Score</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredData.map((ngo) => (
                                <div key={ngo.id} onClick={() => setSelectedNGO(ngo)} className="grid grid-cols-12 gap-6 px-10 py-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all items-center group">
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${ngo.color} text-white flex items-center justify-center text-xs font-black shadow-md`}>
                                            {ngo.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-tight">{ngo.name}</p>
                                            <p className="text-xs text-slate-400 mt-1 font-bold">{ngo.reach} Reach</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-md uppercase tracking-tight">{ngo.cause}</span>
                                    </div>
                                    <div className="col-span-2 text-xs font-bold text-slate-500 truncate">{ngo.location}, {ngo.state}</div>
                                    <div className="col-span-1 text-center text-sm font-black text-amber-500">★ {ngo.rating}</div>
                                    <div className="col-span-3 text-right pr-6 flex items-center justify-end gap-4">
                                        <span className="text-sm font-black text-emerald-600">{ngo.score}%</span>
                                        <span className="text-sm font-black text-teal-600">{ngo.language}%</span>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900 transition-all">chevron_right</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredData.map((ngo) => (
                                <div key={ngo.id} onClick={() => setSelectedNGO(ngo)} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group relative text-center flex flex-col items-center">
                                    <div className="absolute top-4 right-4 text-emerald-600 text-[10px] font-black uppercase tracking-widest">{ngo.score}% Impact</div>
                                    <div className={`w-16 h-16 rounded-2xl ${ngo.color} flex items-center justify-center text-2xl text-white shadow-lg mb-4`}>
                                        🤝
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{ngo.name}</h3>
                                    <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mt-1">{ngo.cause}</p>
                                    <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-emerald-600 transition-colors">View NGO Impact</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* 4. CENTERED MODAL - NGO THEMED */}
            {selectedNGO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-200">
                        <button
                            onClick={() => setSelectedNGO(null)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-10"
                        >
                            ✕
                        </button>

                        <div className="p-8 md:p-10 space-y-5">
                            <div className="flex items-center gap-5">
                                <div className="relative flex-shrink-0">
                                    <div className={`w-16 h-16 rounded-2xl ${selectedNGO.color} flex items-center justify-center text-3xl shadow-inner text-white`}>
                                        🤝
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                                        <FiCheck size={10} strokeWidth={4} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-black text-slate-900 truncate">{selectedNGO.name}</h2>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                        <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">{selectedNGO.cause}</span>
                                        <span className="text-slate-400 text-[10px] font-bold uppercase">📍 {selectedNGO.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 font-bold text-xs text-slate-700">
                                        <span>⭐ {selectedNGO.rating}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>Reach: {selectedNGO.reach}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Mission Statement</h5>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">
                                        "{selectedNGO.bio}"
                                    </p>
                                </div>

                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                    <h5 className="text-[9px] font-black text-emerald-600 uppercase mb-1 tracking-widest">Contact Details</h5>
                                    <div className="text-xs flex flex-col gap-1 font-medium text-slate-700">
                                        <p><span className="text-emerald-600/60 font-bold">Email:</span> {selectedNGO.email}</p>
                                        <p><span className="text-emerald-600/60 font-bold">Phone:</span> {selectedNGO.contact}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <button className="w-full py-3.5 bg-emerald-600 text-white text-base font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                    🚀 Support This Cause
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200">💬 Message</button>
                                    <button className="py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200">📄 Audit Report</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGODiscovery;