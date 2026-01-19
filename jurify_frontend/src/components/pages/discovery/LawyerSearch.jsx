import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const INDIAN_STATES = [
    "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Karnataka",
    "Kerala", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
    "Telangana", "Uttar Pradesh", "West Bengal"
];

const CASE_TYPES = [
    "Criminal Law",
    "Family Law",
    "Property Law",
    "Cyber Law",
    "Corporate Law",
    "Labor Law"
];


const LANGUAGES = [
    "English", "Hindi", "Marathi", "Tamil", "Telugu",
    "Kannada", "Malayalam", "Bengali", "Punjabi"
];

const LawyerSearch = () => {
    const navigate = useNavigate();
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [showOthers, setShowOthers] = useState(false);


    // 1. Dynamic Filter State
    const [filters, setFilters] = useState({
        state: "All",
        caseType: "All",
        language: "All",
        availability: "All"
    });

    // 2. Expanded Database
    const lawyerDatabase = [
        { id: 1, name: "Adv. Priya Sharma", score: 98, expertise: "Criminal Law", location: "Mumbai", state: "Maharashtra", language: "Hindi", available: "Immediate", exp: "12 yrs", rating: 4.9, bio: "Top-rated criminal defense attorney specializing in high-profile litigation." },
        { id: 2, name: "Adv. Rahul Verma", score: 92, expertise: "Family Law", location: "Delhi", state: "Delhi", language: "English", available: "This Week", exp: "8 yrs", rating: 4.7, bio: "Expert in matrimonial disputes and domestic law." },
        { id: 3, name: "Adv. Sneha Kapur", score: 85, expertise: "Property Law", location: "Pune", state: "Maharashtra", language: "Marathi", available: "Immediate", exp: "15 yrs", rating: 4.8, bio: "Specializes in real estate verification and property disputes." },
        { id: 4, name: "Adv. Vikram Singh", score: 78, expertise: "Cyber Law", location: "Bangalore", state: "Karnataka", language: "English", available: "Available Later", exp: "6 yrs", rating: 4.5, bio: "Legal consultant for data privacy and IT Act compliance." },
        { id: 5, name: "Adv. Amit Mehra", score: 72, expertise: "Labor Law", location: "Mumbai", state: "Maharashtra", language: "Hindi", available: "This Week", exp: "10 yrs", rating: 4.6, bio: "Dedicated to employee rights and corporate dispute resolutions." },
        { id: 6, name: "Adv. Ananya Rao", score: 65, expertise: "Criminal Law", location: "Mumbai", state: "Maharashtra", language: "English", available: "Immediate", exp: "5 yrs", rating: 4.2, bio: "Focuses on bail matters and petty criminal offenses." },
    ];

    // 3. Filtering Logic
    const filteredData = useMemo(() => {
        return lawyerDatabase.filter(l =>
            (filters.state === "All" || l.state === filters.state) &&
            (filters.caseType === "All" || l.expertise === filters.caseType) &&
            (filters.language === "All" || l.language === filters.language) &&
            (filters.availability === "All" || l.available === filters.availability)
        );
    }, [filters]);

    const topMatches = filteredData.filter(l => l.score >= 80);
    const allLawyers = filteredData;


    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        //setShowOthers(false); // Reset "See More" when filters change
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] ">
            {/* TOP NAVIGATION BAR */}
            <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center">
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
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">LAWYER DISCOVERY</h1>
                    <div className="h-6 w-[2px] bg-slate-200"></div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Matching Engine v1.0</p>
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Location (State)</label>
                                <select
                                    name="state"
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                        text-sm font-bold text-slate-700
                                        outline-none transition-all
                                        hover:border-primary
                                        focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="All">All States</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>

                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Case Type</label>
                                <select
                                    name="caseType"
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                        text-sm font-bold text-slate-700
                                        outline-none transition-all
                                        hover:border-primary
                                        focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="All">All Types</option>
                                    {CASE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>

                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Language</label>
                                <select
                                    name="language"
                                    onChange={handleFilterChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3
                                    text-sm font-bold text-slate-700
                                    outline-none transition-all
                                    hover:border-primary
                                    focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >

                                    <option value="All">All Languages</option>
                                    {LANGUAGES.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>

                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Availability</label>
                                <select name="availability" onChange={handleFilterChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20">
                                    <option value="All">Any Time</option>
                                    <option value="Immediate">Immediate</option>
                                    <option value="This Week">This Week</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Suggested & General Results */}
                <div className="col-span-1 lg:col-span-6 space-y-10">

                    {/* SEPARATE BOX FOR SUGGESTED LAWYERS */}
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Suggested Matches</h2>
                                <p className="text-slate-500 font-medium text-lg mt-1 italic">High-compatibility professionals for your case</p>
                            </div>
                            <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Verified</span>
                        </div>

                        <div className="space-y-4">
                            {topMatches.length > 0 ? topMatches.map(lawyer => (
                                <div
                                    key={lawyer.id}
                                    onClick={() => setSelectedLawyer(lawyer)}
                                    className="bg-white border-2 border-transparent hover:border-emerald-500 p-6 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-xl group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                            <span className="material-symbols-outlined text-4xl">verified_user</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-2xl text-slate-900">{lawyer.name}</h3>
                                            <p className="text-sm text-slate-500 font-bold uppercase mt-1 tracking-wide">{lawyer.expertise} • {lawyer.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-emerald-600 leading-none">{lawyer.score}%</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Match Score</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-6 text-slate-400 font-medium italic">No premium matches found for the selected filters.</p>
                            )}
                        </div>
                    </div>

                    {/* SEE MORE LOGIC: Only remaining lawyers appear here */}
                    <div className="px-4">
                        {!showOthers ? (
                            <button
                                onClick={() => setShowOthers(true)}
                                className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem]
                                text-slate-400 font-black text-sm uppercase tracking-[0.2em]
                                hover:border-slate-400 hover:text-slate-600 transition-all"
                            >
                                Explore Other Professionals ({allLawyers.length})
                            </button>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                                <h2 className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase flex items-center gap-4">
                                    All Professionals
                                    <span className="flex-1 h-[1px] bg-slate-200"></span>
                                </h2>

                                <div className="grid grid-cols-2 gap-4">
                                    {allLawyers.map(lawyer => (
                                        <div
                                            key={lawyer.id}
                                            onClick={() => setSelectedLawyer(lawyer)}
                                            className="p-6 bg-white border border-slate-200 rounded-3xl
                                    hover:border-primary transition-all cursor-pointer
                                    shadow-sm hover:shadow-md"
                                        >
                                            <h4 className="font-bold text-slate-800 text-xl">{lawyer.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">
                                                {lawyer.expertise}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {lawyer.score}% Match
                                                </span>
                                                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-black">
                                                    {lawyer.available}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* GO WITH SUGGESTIONS BUTTON */}
                                <button
                                    onClick={() => setShowOthers(false)}
                                    className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem]
                                text-slate-400 font-black text-sm uppercase tracking-[0.2em]
                                hover:border-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Go With Suggestions
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* RIGHT SIDE: Stats */}
                <div className="col-span-1 lg:col-span-3 space-y-6">

                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Discovery Stats</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="text-4xl font-black mb-1 text-primary">{filteredData.length}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matches for your criteria</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-xs leading-relaxed text-slate-300 italic">"Our engine suggests lawyers based on your State, Language, and urgency."</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL - (Keeping your preferred modal design) */}
            {selectedLawyer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedLawyer(null)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-14 animate-in zoom-in-95 border border-slate-100">
                        <button onClick={() => setSelectedLawyer(null)} className="absolute top-10 right-10 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-slate-400">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                        <div className="flex gap-8 mb-10">
                            <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center border border-slate-200">
                                <span className="material-symbols-outlined text-6xl text-slate-300">account_circle</span>
                            </div>
                            <div className="flex-1 pt-4">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{selectedLawyer.name}</h3>
                                <p className="text-primary text-sm font-black uppercase tracking-[0.2em] mt-2">Expert in {selectedLawyer.expertise}</p>
                                <div className="flex gap-4 mt-6">
                                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center flex-1">
                                        <div className="text-xl font-black text-slate-800">{selectedLawyer.exp}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Experience</div>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center flex-1">
                                        <div className="text-xl font-black text-slate-800">{selectedLawyer.rating}★</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Rating</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-12">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Professional Biography</h4>
                            <p className="text-xl text-slate-600 leading-relaxed font-medium">{selectedLawyer.bio}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button className="bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all">Request Legal Action</button>
                            <button className="border-2 border-slate-200 text-slate-600 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Download Portfolio</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerSearch;