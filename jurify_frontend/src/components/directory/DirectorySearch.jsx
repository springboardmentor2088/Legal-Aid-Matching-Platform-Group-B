import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import Select from "react-select";
import ProfileViewModel from "./ProfileViewModel";
import ProfileCard from "./ProfileCard";
import directoryService from "../../services/directoryService";

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex gap-3">
      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <div className="flex gap-2 mt-4">
      <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </div>

    <div className="flex justify-between mt-4">
      <div className="h-3 w-24 bg-gray-200 rounded"></div>
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
    </div>

    <div className="h-9 bg-gray-200 rounded-xl mt-4"></div>
  </div>
);

const DirectorySearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCaseType, setSelectedCaseType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [userCity, setUserCity] = useState("");
  const [userState, setUserState] = useState("");
  const [isFromCaseSubmission, setIsFromCaseSubmission] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  // Availability is not fully supported by backend filter yet, but we'll include state
  const [selectedAvailability, setSelectedAvailability] = useState("");

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0
  });

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
    "Other"
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

  // Indian states for dropdown
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

  // Fetch results from API
  const handleSearch = async () => {
    setIsLoading(true);
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
        selectedCaseType || undefined, // Pass specialization
        minExp,
        maxExp,
        undefined, // minRating
        undefined, // maxRating
        selectedLanguage || undefined,
        pagination.page,
        pagination.size
      );

      // Handle Spring Boot Page response
      if (response && response.content) {
        setSearchResults(response.content);
        setPagination(prev => ({
          ...prev,
          totalElements: response.totalElements,
          totalPages: response.totalPages
        }));
      } else {
        // Fallback if not paginated
        setSearchResults(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error("Search failed", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedState, selectedType, selectedCaseType, sortBy, pagination.page, selectedLanguage, selectedExperience, selectedAvailability]);


  // Read query parameters and auto-select filters
  useEffect(() => {
    const fromCase = searchParams.get("fromCase");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const caseType = searchParams.get("caseType");

    if (fromCase === "true") {
      setIsFromCaseSubmission(true);

      if (state) {
        setSelectedState(state);
      }

      if (caseType) {
        setSelectedCaseType(caseType);
      }

      if (city) {
        // Use city as search query if provided, or handle it as a filter if backend supports 'city'
        // Current directoryService supports 'city' param, but here we can just update searchQuery
        // OR update a userCity state if we want strict city filtering.
        // For now, let's treat it as userCity to filter by current user's location if needed
        setUserCity(city);
      }
    }
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
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <>
      <div className="w-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                <FiSearch className="text-lg sm:text-xl text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  Legal Directory
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Find verified lawyers and NGOs by name and location
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
          {/* Search Section */}
          <div className="bg-white rounded-2xl border border-gray-200
  p-5 sm:p-6 mb-8
  shadow-sm hover:shadow-md transition">
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Search Input */}
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Name, Specialization, or City
                </label>
                <div className="relative">
                  <FiSearch className="
    absolute left-3 top-1/2 -translate-y-1/2
    text-gray-400
  " />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lawyer, NGO, city, or specialization"
                    className="
      w-full pl-10 pr-4 py-3
      border border-gray-300 rounded-xl
      focus:ring-2 focus:ring-primary/40
      focus:border-primary
      transition
    "
                  />
                </div>

              </div>

              {/* State, Type, and Case Type Selectors - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* State Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <Select
                    value={
                      selectedState
                        ? { value: selectedState, label: selectedState }
                        : null
                    }
                    onChange={(option) =>
                      setSelectedState(option ? option.value : "")
                    }
                    options={indianStates}
                    placeholder="Select State"
                    isClearable
                    className="react-select-container w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Type
                  </label>
                  <Select
                    value={typeOptions.find(
                      (option) => option.value === selectedType
                    )}
                    onChange={(option) => setSelectedType(option.value)}
                    options={typeOptions}
                    className="react-select-container w-full"
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Case Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Type {isFromCaseSubmission && <span className="text-xs text-primary font-medium">(Auto-selected)</span>}
                  </label>
                  <Select
                    value={selectedCaseType ? { value: selectedCaseType, label: selectedCaseType } : null}
                    onChange={(option) => setSelectedCaseType(option ? option.value : "")}
                    options={caseCategories.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select Case Type"
                    isClearable
                    className="react-select-container w-full"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col sm:flex-row
  items-stretch sm:items-center
  justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <FiFilter />
                  <span className="hidden sm:inline">Advanced Filters</span>
                  <span className="sm:hidden">Filters</span>
                  <FiChevronDown
                    className={`transform transition-transform ${showFilters ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {(searchQuery || selectedState || selectedType !== "all" || selectedLanguage || selectedExperience) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <FiX />
                    <span className="hidden sm:inline">Clear Filters</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 hidden sm:inline">
                  Sort by:
                </label>
                <Select
                  value={sortOptions.find((option) => option.value === sortBy)}
                  onChange={(option) => setSortBy(option.value)}
                  options={sortOptions}
                  className="react-select-container w-full sm:w-48"
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                      <option value="">Any Language</option>
                      {languages.map((lang, index) => (
                        <option key={index} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      value={selectedAvailability}
                      onChange={(e) => setSelectedAvailability(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                      <option value="">Any Availability</option>
                      <option value="available">Available Now</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={selectedExperience}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Search Results
                {!isLoading && (
                  <span className="text-sm text-gray-600 ml-2">
                    ({pagination.totalElements} found)
                  </span>
                )}
              </h2>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="hidden sm:inline">Searching...</span>
                  <span className="sm:hidden">Loading...</span>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                  : searchResults.map((result) => (
                    <ProfileCard
                      key={result.id}
                      profile={{
                        ...result,
                        name: result.displayName || result.name,
                        type: result.role ? result.role.toLowerCase() : result.type,
                        verified: result.isVerified || result.verified,
                        specialization: result.specialization ? result.specialization.split(',').map(s => s.trim()) : [],
                        languages: result.languages ? result.languages.split(',').map(s => s.trim()) : [],
                        experience: result.yearsOfExperience,
                        rating: result.rating || 0,
                        available: result.isActive || false
                      }}
                      onContact={(res) => {
                        setSelectedProfile(res);
                      }}
                    />
                  ))}
              </div>
            ) : !isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiSearch className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters to find what you're
                  looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#0e5658] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : null}
          </div>
          {selectedProfile && (
            <ProfileViewModel
              profile={selectedProfile}
              onClose={() => setSelectedProfile(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DirectorySearch;
