import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const INDIAN_STATES = [
    "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Karnataka",
    "Kerala", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
    "Telangana", "Uttar Pradesh", "West Bengal"
];

const CAUSE_AREAS = [
    "Education",
    "Healthcare",
    "Environment",
    "Women Empowerment",
    "Child Welfare",
    "Animal Rights",
    "Disaster Relief"
];

const LANGUAGES = [
    "English", "Hindi", "Marathi", "Tamil", "Telugu",
    "Kannada", "Malayalam", "Bengali", "Punjabi"
];

const NGODiscovery = () => {
    const navigate = useNavigate();
    const [selectedNGO, setSelectedNGO] = useState(null);
    const [showOthers, setShowOthers] = useState(false);

    // 1. Dynamic Filter State
    const [filters, setFilters] = useState({
        state: "All",
        cause: "All",
        language: "All",
        supportType: "All"
    });

    // 2. NGO Database
    const ngoDatabase = [
        { id: 1, name: "Udaan Foundation", score: 98, cause: "Education", location: "Mumbai", state: "Maharashtra", language: "Hindi", support: "Volunteers", reach: "10k+ lives", rating: 4.9, bio: "Transforming rural education through digital classrooms and teacher training programs." },
        { id: 2, name: "Aarogya Seva", score: 92, cause: "Healthcare", location: "Delhi", state: "Delhi", language: "English", support: "Donations", reach: "50k+ patients", rating: 4.7, bio: "Providing low-cost medical surgical interventions and health camps in urban slums." },
        { id: 3, name: "Green Earth Trust", score: 85, cause: "Environment", location: "Pune", state: "Maharashtra", language: "Marathi", support: "Volunteers", reach: "1M trees", rating: 4.8, bio: "Dedicated to reforestation and water conservation projects across Western Ghats." },
        { id: 4, name: "Sakshi Shakti", score: 78, cause: "Women Empowerment", location: "Bangalore", state: "Karnataka", language: "English", support: "Partnerships", reach: "5k+ women", rating: 4.5, bio: "Skill development and legal aid for women from marginalized backgrounds." },
        { id: 5, name: "Paws & Care", score: 72, cause: "Animal Rights", location: "Mumbai", state: "Maharashtra", language: "Hindi", support: "Donations", reach: "2k+ rescues", rating: 4.6, bio: "Emergency rescue services and sterilization programs for street animals." },
        { id: 6, name: "Hope for Kids", score: 65, cause: "Child Welfare", location: "Mumbai", state: "Maharashtra", language: "English", support: "Volunteers", reach: "1k+ children", rating: 4.2, bio: "Providing shelter and nutrition to orphaned children in metropolitan areas." },
    ];

    // 3. Filtering Logic
    const filteredData = useMemo(() => {
        return ngoDatabase.filter(n =>
            (filters.state === "All" || n.state === filters.state) &&
            (filters.cause === "All" || n.cause === filters.cause) &&
            (filters.language === "All" || n.language === filters.language) &&
            (filters.supportType === "All" || n.support === filters.supportType)
        );
    }, [filters]);

    const topMatches = filteredData.filter(n => n.score >= 80);
    const allNGOs = filteredData;

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* TOP NAVIGATION BAR */}
            <nav className="w-full bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-slate-900 hover:text-primary transition-all group"
                >
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary transition-all">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </div>
                    <span className="font-black text-sm tracking-[0.15em] uppercase">Dashboard</span>
                </button>

                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">NGO DISCOVERY</h1>
                    <div className="h-6 w-[2px] bg-slate-200"></div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Impact Engine v1.0</p>
                </div>
                <div className="w-40"></div>
            </nav>

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 sm:p-6 lg:p-8">

                {/* LEFT SIDE: Filters */}
                <div className="col-span-1 lg:col-span-3 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm lg:sticky lg:top-8">
                        <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest">Refine Search</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Region (State)</label>
                                <select name="state" onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none hover:border-primary focus:ring-2 focus:ring-primary/20">
                                    <option value="All">All Regions</option>
                                    {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cause Area</label>
                                <select name="cause" onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none hover:border-primary focus:ring-2 focus:ring-primary/20">
                                    <option value="All">All Causes</option>
                                    {CAUSE_AREAS.map(cause => <option key={cause} value={cause}>{cause}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Medium of Comm.</label>
                                <select name="language" onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none hover:border-primary focus:ring-2 focus:ring-primary/20">
                                    <option value="All">All Languages</option>
                                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Support Needed</label>
                                <select name="supportType" onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20">
                                    <option value="All">Any Support</option>
                                    <option value="Volunteers">Volunteers</option>
                                    <option value="Donations">Donations</option>
                                    <option value="Partnerships">Partnerships</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Suggested & General Results */}
                <div className="col-span-1 lg:col-span-6 space-y-10">
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Top Rated NGOs</h2>
                                <p className="text-slate-500 font-medium text-lg mt-1 italic">High-impact organizations matching your criteria</p>
                            </div>
                            <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Verified 80G</span>
                        </div>

                        <div className="space-y-4">
                            {topMatches.length > 0 ? topMatches.map(ngo => (
                                <div
                                    key={ngo.id}
                                    onClick={() => setSelectedNGO(ngo)}
                                    className="bg-white border-2 border-transparent hover:border-emerald-500 p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-xl group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                            <span className="material-symbols-outlined text-4xl">volunteer_activism</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-2xl text-slate-900">{ngo.name}</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase mt-1 tracking-wide">{ngo.cause} • {ngo.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-emerald-600 leading-none">{ngo.score}%</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Impact Score</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-6 text-slate-400 font-medium italic">No premium matches found for the selected filters.</p>
                            )}
                        </div>
                    </div>

                    <div className="px-4">
                        {!showOthers ? (
                            <button onClick={() => setShowOthers(true)} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-sm uppercase tracking-[0.2em] hover:border-slate-400 hover:text-slate-600 transition-all">
                                Explore All Organizations ({allNGOs.length})
                            </button>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                                <h2 className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase flex items-center gap-4">
                                    All Organizations <span className="flex-1 h-[1px] bg-slate-200"></span>
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    {allNGOs.map(ngo => (
                                        <div key={ngo.id} onClick={() => setSelectedNGO(ngo)} className="p-6 bg-white border border-slate-200 rounded-3xl hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md">
                                            <h4 className="font-bold text-slate-800 text-xl">{ngo.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{ngo.cause}</p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">{ngo.score}% Impact</span>
                                                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-black">{ngo.support}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setShowOthers(false)} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-sm uppercase tracking-[0.2em] hover:border-slate-400 hover:text-slate-600 transition-all">
                                    Back to Suggestions
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: Stats */}
                <div className="col-span-1 lg:col-span-3 space-y-6">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Network Stats</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="text-4xl font-black mb-1 text-primary">{filteredData.length}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active NGOs Found</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-xs leading-relaxed text-slate-300 italic">"Our matching engine connects you with organizations based on regional needs and cause urgency."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {selectedNGO && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedNGO(null)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-14 animate-in zoom-in-95 border border-slate-100">
                        <button onClick={() => setSelectedNGO(null)} className="absolute top-10 right-10 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-slate-400">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                        <div className="flex gap-8 mb-10">
                            <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border border-slate-200">
                                <span className="material-symbols-outlined text-6xl text-slate-300">corporate_fare</span>
                            </div>
                            <div className="flex-1 pt-4">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{selectedNGO.name}</h3>
                                <p className="text-primary text-sm font-black uppercase tracking-[0.2em] mt-2">Specializing in {selectedNGO.cause}</p>
                                <div className="flex gap-4 mt-6">
                                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center flex-1">
                                        <div className="text-xl font-black text-slate-800">{selectedNGO.reach}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Impact Reach</div>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center flex-1">
                                        <div className="text-xl font-black text-slate-800">{selectedNGO.rating}★</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Trust Rating</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-12">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Mission Statement</h4>
                            <p className="text-xl text-slate-600 leading-relaxed font-medium">{selectedNGO.bio}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button className="bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all">Support Now</button>
                            <button className="border-2 border-slate-200 text-slate-600 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Download Audit Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGODiscovery;