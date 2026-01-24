import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiX, FiChevronDown, FiGrid, FiList } from "react-icons/fi";
import Select from "react-select";
import ProfileViewModel from "./ProfileViewModel";
import ProfileCard from "./ProfileCard";
import directoryService from "../../services/directoryService";
import { caseService } from "../../services/caseService";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../components/common/ToastContext";

const CardSkeleton = () => (
  <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-5 border border-slate-200 dark:border-gray-700 animate-pulse hover:shadow-md">
    <div className="absolute top-3 right-3 w-16 h-5 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
    <div className="mb-4">
      <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
    </div>
    <div className="flex gap-2 mb-4">
      <div className="h-5 w-16 bg-slate-200 dark:bg-gray-700 rounded-md"></div>
      <div className="h-5 w-20 bg-slate-200 dark:bg-gray-700 rounded-md"></div>
    </div>
    <div className="flex gap-2">
      <div className="px-3 py-2 bg-slate-200 dark:bg-gray-700 rounded-lg w-24 h-9"></div>
      <div className="flex-1 py-2 bg-slate-300 dark:bg-gray-600 rounded-lg h-9"></div>
    </div>
  </div>
);

const DirectorySearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      color: isDarkMode ? "#ffffff" : "#111827",
      minHeight: "42px",
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(17,103,106,0.4)" : "none",
      "&:hover": {
        borderColor: "#11676a",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
      borderRadius: "0.75rem",
      border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#11676a"
        : state.isFocused
          ? (isDarkMode ? "#374151" : "#f3f4f6")
          : "transparent",
      color: state.isSelected
        ? "#ffffff"
        : (isDarkMode ? "#e5e7eb" : "#111827"),
      cursor: "pointer",
      ":active": {
        backgroundColor: "#11676a",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#ffffff" : "#111827",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "#ffffff" : "#111827",
    }),
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? "#9ca3af" : "#6b7280",
    }),
  };

  // Toggle this flag to test with static data.
  const useStatic = false;

  // UI state
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCaseType, setSelectedCaseType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [userCity, setUserCity] = useState("");
  const [isFromCaseSubmission, setIsFromCaseSubmission] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  // New States for Consultation Request
  const [requestedProviderIds, setRequestedProviderIds] = useState(new Set());
  const [requestingId, setRequestingId] = useState(null);
  const [currentCaseNumber, setCurrentCaseNumber] = useState("");
  const { showToast } = useToast();

  // view mode: 'square' (grid) or 'detailed' (list/rectangle)
  const [viewMode, setViewMode] = useState("square");

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });

  // ---------- Internal providers mock (NEW — not using your existing file) ----------
  const providersMock = [
    {
      id: 101,
      name: "Provider Mock A",
      timezone: "Asia/Kolkata",
      rules: [
        // Mon-Fri 09:00-17:00
        { days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00", slotMinutes: 60, capacity: 1 },
      ],
      exceptions: ["2026-01-26"],
    },
    {
      id: 102,
      name: "Provider Mock B",
      timezone: "Asia/Kolkata",
      rules: [
        { days: [2, 4], start: "10:00", end: "14:00", slotMinutes: 30, capacity: 3 },
        { days: [6], start: "09:00", end: "12:00", slotMinutes: 30, capacity: 2 },
      ],
      exceptions: [],
    },
  ];

  function getProviderByIdLocal(id) {
    return providersMock.find((p) => p.id === id) || null;
  }

  // ---------- Static mock dataset (example profiles) ----------
  const staticData = [
    {
      id: 1,
      providerId: 101,
      name: "Asha Verma",
      displayName: "Asha Verma",
      role: "LAWYER",
      type: "lawyer",
      isVerified: true,
      specialization: "Family Law, Property Law",
      languages: "ENGLISH,HINDI",
      yearsOfExperience: 8,
      rating: 4.7,
      isActive: true,
      casesHandled: 120,
      city: "Mumbai",
      state: "Maharashtra",
      email: "asha.verma@example.com",
      phoneNumber: "+91-9876543210",
    },
    {
      id: 2,
      providerId: 101,
      name: "Rajesh Kumar",
      displayName: "Rajesh Kumar",
      role: "LAWYER",
      type: "lawyer",
      isVerified: false,
      specialization: "Criminal Law",
      languages: "HINDI,ENGLISH",
      yearsOfExperience: 3,
      rating: 4.1,
      isActive: false,
      casesHandled: 45,
      city: "Lucknow",
      state: "Uttar Pradesh",
      email: "rajesh.k@example.com",
      phoneNumber: "+91-9123456780",
    },
    {
      id: 3,
      providerId: 102,
      name: "Nirmala Trust",
      displayName: "Nirmala Trust",
      role: "NGO",
      type: "ngo",
      isVerified: true,
      specialization: "Human Rights, Consumer Protection",
      languages: "ENGLISH,BENGALI",
      yearsOfExperience: 12,
      rating: 4.9,
      isActive: true,
      casesHandled: 520,
      city: "Kolkata",
      state: "West Bengal",
      email: "info@nirmalatrust.org",
      phoneNumber: "+91-9333333333",
    },
    // more profiles...
  ];

  const caseCategories = [
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
    "Other",
  ];

  const languages = [
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
    "OTHER",
  ];

  const indianStates = [
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Delhi", label: "Delhi" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ];

  const typeOptions = [
    { value: "all", label: "All Professionals" },
    { value: "LAWYER", label: "Lawyers" },
    { value: "NGO", label: "NGOs" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "rating", label: "Highest Rated" },
    { value: "experience", label: "Most Experienced" },
    { value: "cases", label: "Most Cases Handled" },
  ];

  // --- Availability helper (same approach, local)
  function isProviderAvailableNow(provider) {
    if (!provider || !provider.rules || provider.rules.length === 0) return false;

    try {
      const now = new Date();
      const tz = provider.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);

      const partObj = {};
      parts.forEach((p) => (partObj[p.type] = p.value));
      const localY = parseInt(partObj.year, 10);
      const localM = parseInt(partObj.month, 10) - 1;
      const localD = parseInt(partObj.day, 10);
      const localH = parseInt(partObj.hour, 10);
      const localMin = parseInt(partObj.minute, 10);

      const localDate = new Date(Date.UTC(localY, localM, localD, localH, localMin));
      const jsDay = localDate.getUTCDay();
      const weekday = jsDay === 0 ? 7 : jsDay;

      const y = localDate.getUTCFullYear();
      const m = String(localDate.getUTCMonth() + 1).padStart(2, "0");
      const d = String(localDate.getUTCDate()).padStart(2, "0");
      const yyyyMmDd = `${y}-${m}-${d}`;

      if (provider.exceptions && provider.exceptions.includes(yyyyMmDd)) return false;

      const currentMinutes = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();

      for (const rule of provider.rules) {
        if (!rule.days || !rule.start || !rule.end) continue;
        if (!rule.days.includes(weekday)) continue;

        const [startH, startM] = rule.start.split(":").map(Number);
        const [endH, endM] = rule.end.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        let inWindow = false;
        if (endMinutes > startMinutes) {
          inWindow = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } else {
          inWindow = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        if (inWindow) return true;
      }

      return false;
    } catch (err) {
      console.warn("Availability check failed", err);
      return false;
    }
  }

  // ---------- Search logic (static path uses internal providers mock) ----------
  const handleSearch = async () => {
    setIsLoading(true);

    if (useStatic) {
      setTimeout(() => {
        const q = (searchQuery || "").trim().toLowerCase();

        const filtered = staticData
          .map((p) => {
            const providerInfo = p.providerId ? getProviderByIdLocal(p.providerId) : null;
            const availableNow = providerInfo ? isProviderAvailableNow(providerInfo) : p.isActive || false;
            return { ...p, availableNow };
          })
          .filter((p) => {
            const name = (p.displayName || p.name || "").toLowerCase();
            const spec = (p.specialization || "").toLowerCase();
            const city = (p.city || "").toLowerCase();

            const matchesQuery =
              !q || name.includes(q) || spec.includes(q) || city.includes(q);

            const matchesState = !selectedState || p.state === selectedState;
            const matchesType =
              selectedType === "all" ||
              (selectedType && (p.role === selectedType || (p.type && p.type.toUpperCase() === selectedType)));
            const matchesCaseType = !selectedCaseType || spec.includes(selectedCaseType.toLowerCase());
            const matchesLanguage =
              !selectedLanguage ||
              (p.languages || "")
                .toLowerCase()
                .split(",")
                .map((s) => s.trim())
                .includes(selectedLanguage.toLowerCase());
            const matchesExperience = (() => {
              if (!selectedExperience) return true;
              const exp = p.yearsOfExperience || 0;
              if (selectedExperience === "0-5") return exp >= 0 && exp <= 5;
              if (selectedExperience === "5-10") return exp >= 5 && exp <= 10;
              if (selectedExperience === "10+") return exp >= 10;
              return true;
            })();

            const matchesAvailability =
              !selectedAvailability ||
              (selectedAvailability === "available" ? p.availableNow : !p.availableNow);

            return matchesQuery && matchesState && matchesType && matchesCaseType && matchesLanguage && matchesExperience && matchesAvailability;
          });

        // sorting
        let sorted = filtered.slice();
        if (sortBy === "rating") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        else if (sortBy === "experience") sorted.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
        else if (sortBy === "cases") sorted.sort((a, b) => (b.casesHandled || 0) - (a.casesHandled || 0));

        // pagination
        const start = pagination.page * pagination.size;
        const end = start + pagination.size;
        const pageContent = sorted.slice(start, end);

        setSearchResults(pageContent);
        setPagination((prev) => ({
          ...prev,
          totalElements: sorted.length,
          totalPages: Math.max(1, Math.ceil(sorted.length / prev.size)),
        }));

        setIsLoading(false);
      }, 600);
    } else {
      // Real API Mode
      try {
        let minExp = undefined;
        let maxExp = undefined;

        if (selectedExperience === "0-5") {
          minExp = 0;
          maxExp = 5;
        } else if (selectedExperience === "5-10") {
          minExp = 5;
          maxExp = 10;
        } else if (selectedExperience === "10+") {
          minExp = 10;
        }

        const response = await directoryService.searchDirectory(
          searchQuery,
          selectedState,
          userCity,
          selectedType !== "all" ? selectedType : undefined,
          selectedCaseType || undefined,
          minExp,
          maxExp,
          undefined, // minRating
          undefined, // maxRating
          selectedLanguage || undefined,
          pagination.page,
          pagination.size
        );

        if (response && response.content) {
          let results = response.content;

          // Client-side sort for the current page
          if (sortBy === "rating") {
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else if (sortBy === "experience") {
            results.sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
          } else if (sortBy === "cases") {
            results.sort((a, b) => (b.casesHandled || 0) - (a.casesHandled || 0));
          }

          setSearchResults(results);
          setPagination((prev) => ({
            ...prev,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
          }));
        } else {
          setSearchResults(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error("Search failed", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const id = setTimeout(() => handleSearch(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedState,
    selectedType,
    selectedCaseType,
    sortBy,
    pagination.page,
    selectedLanguage,
    selectedExperience,
    selectedAvailability,
  ]);

  useEffect(() => {
    const fromCase = searchParams.get("fromCase");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const caseType = searchParams.get("caseType");
    const type = searchParams.get("type");

    if (fromCase === "true") {
      setIsFromCaseSubmission(true);
      if (state) setSelectedState(state);
      if (caseType) setSelectedCaseType(caseType);
      if (city) setUserCity(city);
      if (type) setSelectedType(type);

      // Enforce list view and rating sort for case submission flow
      setViewMode("detailed");
      setSortBy("rating");

      // Fetch requested providers
      const caseId = searchParams.get("caseId");
      if (caseId) {
        console.log("[DirectorySearch] Fetching requested providers for caseId:", caseId);
        caseService.getRequestedProviders(caseId)
          .then(data => {
            console.log("[DirectorySearch] Requested providers response:", data);
            // data is already the array [Long, Long, ...] - list of user IDs
            setRequestedProviderIds(new Set(data || []));
          })
          .catch(err => console.error("Failed to fetch requested providers", err));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("");
    setSelectedType("all");
    setSelectedCaseType("");
    setSortBy("relevance");
    setSelectedLanguage("");
    setSelectedExperience("");
    setSelectedAvailability("");
    setIsFromCaseSubmission(false);
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Case Context Banner - Only shown when coming from case submission */}
        {isFromCaseSubmission && (
          <div className="bg-gradient-to-r from-primary/10 via-teal-50 to-primary/5 dark:from-primary/20 dark:via-gray-800 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 p-4 sm:p-5 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <FiFilter className="text-primary text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Finding Professionals for Your Case
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Case #{searchParams.get("caseId")} • <span className="font-medium text-primary">{selectedCaseType || "All Categories"}</span>
                  {userCity && <> • Near <span className="font-medium">{userCity}</span></>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Select a professional below to request a consultation. They will receive an email notification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 mb-6 shadow-sm hover:shadow-md transition">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by Name, Specialization, or City</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((p) => ({ ...p, page: 0 }));
                  }}
                  placeholder="Search lawyer, NGO, city, or specialization"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                <Select
                  value={selectedState ? { value: selectedState, label: selectedState } : null}
                  onChange={(option) => {
                    setSelectedState(option ? option.value : "");
                    setPagination((p) => ({ ...p, page: 0 }));
                  }}
                  options={indianStates}
                  placeholder="Select State"
                  isClearable
                  className="react-select-container w-full"
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Professional Type</label>
                <Select
                  value={typeOptions.find((option) => option.value === selectedType)}
                  onChange={(option) => {
                    setSelectedType(option.value);
                    setPagination((p) => ({ ...p, page: 0 }));
                  }}
                  options={typeOptions}
                  className="react-select-container w-full"
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Case Type {isFromCaseSubmission && <span className="text-xs text-primary font-medium">(Auto-selected)</span>}
                </label>
                <Select
                  value={selectedCaseType ? { value: selectedCaseType, label: selectedCaseType } : null}
                  onChange={(option) => {
                    setSelectedCaseType(option ? option.value : "");
                    setPagination((p) => ({ ...p, page: 0 }));
                  }}
                  options={caseCategories.map((cat) => ({ value: cat, label: cat }))}
                  placeholder="Select Case Type"
                  isClearable={!isFromCaseSubmission}
                  isDisabled={isFromCaseSubmission} // Lock this filter
                  className="react-select-container w-full"
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters + toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                disabled={isFromCaseSubmission} // Lock advanced filters in case mode if we want strictness, or just let them stay but lock specific ones
              >
                <FiFilter />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
                <FiChevronDown className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {/* Only show Clear Filters if NOT in strict case mode, or allow clearing only non-strict fields */}
              {!isFromCaseSubmission && (searchQuery || selectedState || selectedType !== "all" || selectedLanguage || selectedExperience) && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                  <FiX />
                  <span className="hidden sm:inline">Clear Filters</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 hidden sm:inline">Sort by:</label>
              <Select
                value={sortOptions.find((option) => option.value === sortBy)}
                onChange={(option) => {
                  setSortBy(option.value);
                  setPagination((p) => ({ ...p, page: 0 }));
                }}
                options={sortOptions}
                className="react-select-container w-full sm:w-48"
                classNamePrefix="react-select"
                styles={customSelectStyles}
              />

              {/* Note: view toggle is shown on Results header below */}
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Languages</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setPagination((p) => ({ ...p, page: 0 }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Any Language</option>
                    {languages.map((lang, index) => (
                      <option key={index} value={lang.toLowerCase()}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</label>
                  <select value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    <option value="">Any Availability</option>
                    <option value="available">Available Now</option>
                    <option value="busy">Busy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience Level</label>
                  <select value={selectedExperience} onChange={(e) => {
                    setSelectedExperience(e.target.value);
                    setPagination((p) => ({ ...p, page: 0 }));
                  }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                    <option value="">Any Experience</option>
                    <option value="0-5">0-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              Search Results
              {!isLoading && <span className="text-sm text-gray-600 ml-2">({pagination.totalElements || 0} found)</span>}
            </h2>

            {/* Toggle moved here: straight in the Search Results header (right side) */}
            <div className="flex items-center gap-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}

              {!isFromCaseSubmission && (
                <button
                  onClick={() => setViewMode((v) => (v === "square" ? "detailed" : "square"))}
                  title={viewMode === "square" ? "Switch to list view" : "Switch to grid view"}
                  aria-label="Toggle view"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-shadow focus:outline-none
                    ${viewMode === "square" ? "bg-primary text-white border border-primary shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}
                >
                  {viewMode === "square" ? <FiGrid className="text-sm" /> : <FiList className="text-sm" />}
                </button>
              )}
            </div>
          </div>

          {/* Results Grid or List depending on viewMode */}
          {searchResults.length > 0 ? (
            viewMode === "square" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />) :
                  searchResults.map((result) => (
                    <ProfileCard
                      key={result.id}
                      viewMode="square"
                      profile={{
                        ...result,
                        name: result.displayName || result.name,
                        type: result.role ? result.role.toLowerCase() : result.type,
                        verified: result.isVerified || result.verified,
                        specialization: result.specialization ? result.specialization.split(",").map((s) => s.trim()) : [],
                        languages: result.languages ? result.languages.split(",").map((s) => s.trim()) : [],
                        experience: result.yearsOfExperience,
                        rating: result.rating || 0,
                        available: result.availableNow || false,
                        casesHandled: result.casesHandled || 0,
                        isRequested: requestedProviderIds.has(result.userId || result.id),
                      }}
                      onContact={(res) => setSelectedProfile(res)}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {isLoading ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />) :
                  searchResults.map((result) => (
                    <ProfileCard
                      key={result.id}
                      viewMode="detailed"
                      profile={{
                        ...result,
                        name: result.displayName || result.name,
                        type: result.role ? result.role.toLowerCase() : result.type,
                        verified: result.isVerified || result.verified,
                        specialization: result.specialization ? result.specialization.split(",").map((s) => s.trim()) : [],
                        languages: result.languages ? result.languages.split(",").map((s) => s.trim()) : [],
                        experience: result.yearsOfExperience,
                        rating: result.rating || 0,
                        available: result.availableNow || false,
                        casesHandled: result.casesHandled || 0,
                        isRequested: requestedProviderIds.has(result.userId || result.id),
                      }}
                      onContact={(res) => setSelectedProfile(res)}
                    />
                  ))}
              </div>
            )
          ) : !isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
              <button onClick={clearFilters} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#0e5658] transition-colors">
                Clear All Filters
              </button>
            </div>
          ) : null}
        </div>

        {selectedProfile && (
          <ProfileViewModel
            profile={{
              ...selectedProfile,
              isRequested: requestedProviderIds.has(selectedProfile.userId || selectedProfile.id),
              isLoading: requestingId === (selectedProfile.userId || selectedProfile.id)
            }}
            onClose={() => setSelectedProfile(null)}
            onRequestConsultation={isFromCaseSubmission ? async (profile) => {
              const providerId = profile.userId;
              const requestRefId = providerId || profile.id;
              const caseId = searchParams.get("caseId");

              if (!caseId) return;

              if (!providerId) {
                showToast({ type: "error", message: "Cannot identify provider user ID." });
                return;
              }

              try {
                setRequestingId(requestRefId);
                await caseService.requestConsultation(caseId, providerId, profile.type || "LAWYER");
                showToast({ type: "success", message: `Request sent to ${profile.displayName || profile.name}!` });
                setRequestedProviderIds(prev => new Set(prev).add(providerId));
                setTimeout(() => setSelectedProfile(null), 1500);
              } catch (err) {
                console.error("Failed to request consultation", err);
                const msg = err.response?.data?.message || "Failed to send request.";
                showToast({ type: "error", message: msg });
              } finally {
                setRequestingId(null);
              }
            } : null}
            showConsultationButton={isFromCaseSubmission}
          />
        )}
      </div>
    </>
  );
};

export default DirectorySearch;