import React, { useState, useRef, useEffect } from "react";
import {
  FiFileText,
  FiMapPin,
  FiUpload,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiChevronRight,
  FiChevronLeft,
  FiSave,
  FiClock,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { caseService } from "../../services/caseService";
import Select from "react-select";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useToast } from "../common/ToastContext";
import directoryService from "../../services/directoryService";
import { useGlobalLoader } from "../../context/GlobalLoaderContext";
import ProfileCard from "../directory/ProfileCard";
import ProfileViewModel from "../directory/ProfileViewModel";


const MaterialIcon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined align-middle text-gray-500 dark:text-gray-400 ${className}`}>
    {name}
  </span>
);


const CaseSubmissionForm = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const { showToast } = useToast();
  const { startLoading, stopLoading } = useGlobalLoader();
  const [activeTab, setActiveTab] = useState("Lawyer");
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [sortBy, setSortBy] = useState("match");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    urgency: "MEDIUM",
    preferredLanguage: "ENGLISH",
    location: null,
    documents: [],
    officeAddressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    categorySpecificData: {},
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCase, setSubmittedCase] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [showStatuteWarning, setShowStatuteWarning] = useState(false);
  const fileInputRef = useRef(null);
  const autoSaveRef = useRef(null);
  const [toast, setToast] = useState(null);

  // Location state
  const [position, setPosition] = useState({ lat: 25.5941, lng: 85.1376 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Indian states for dropdown
  const indianStates = [
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
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

  const steps = [
    { id: "basic", title: "Basic Details", icon: FiUser },
    { id: "details", title: "Case Details", icon: FiFileText },
    { id: "location", title: "Location", icon: FiMapPin },
    { id: "documents", title: "Documents", icon: FiUpload },
    { id: "review", title: "Review", icon: FiCheck },
  ];

  const legalCategories = [
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

  const urgencyLevels = [
    {
      value: "LOW",
      label: "Low (Within 30 days)",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "MEDIUM",
      label: "Medium (Within 14 days)",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      value: "HIGH",
      label: "High (Within 7 days)",
      color: "bg-orange-100 text-orange-700",
    },
    {
      value: "URGENT",
      label: "Urgent (Within 48 hours)",
      color: "bg-red-100 text-red-700",
    },
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

  // State for dynamic professionals
  const [professionals, setProfessionals] = useState([]);
  const [fetchingPros, setFetchingPros] = useState(false);

  // Fetch professionals matching criteria from the backend matching engine
  useEffect(() => {
    // Only fetch if a case is submitted
    if (!submittedCase || !submittedCase.id) return;

    const fetchMatches = async () => {
      setFetchingPros(true);
      try {
        // Call the matching engine API to get real recommendations
        const response = await caseService.getMatches(submittedCase.id);
        const matchesData = response.data || response || [];

        // Filter by active tab (Lawyer/NGO) and transform to UI format
        const filtered = matchesData.filter(m =>
          activeTab === "Lawyer" ? m.providerType === "LAWYER" : m.providerType === "NGO"
        );

        const pros = filtered.map(p => ({
          id: p.providerId,
          name: p.name,
          type: p.providerType === "LAWYER" ? "Lawyer" : "NGO",
          expertise: (p.expertise || []).join(", ") || "General Practice",
          rating: p.rating || 4.5,
          casesHandled: p.casesHandled || 0,
          exp: p.experience || "N/A",
          bio: p.bio || "No bio available.",
          contact: p.contact,
          email: p.email,
          city: p.location,
          matchScore: Math.round(p.matchScore) || 85,
          matchReason: p.matchReason,
          isAvailable: p.isAvailable
        }));

        setProfessionals(pros);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        // Fallback: show empty
        setProfessionals([]);
      } finally {
        setFetchingPros(false);
      }
    };

    fetchMatches();
  }, [submittedCase, activeTab]);

  // Use dynamic list instead of static
  const displayedMatches = professionals
    .sort((a, b) => sortBy === "match" ? b.matchScore - a.matchScore : b.rating - a.rating)
    .slice(0, 4);
  // Category-specific fields configuration
  const categoryFields = {
    "Family Law": [
      { name: "marriageDate", label: "Marriage Date", type: "date" },
      { name: "childrenDetails", label: "Children Details", type: "textarea" },
      {
        name: "disputeType",
        label: "Dispute Type",
        type: "select",
        options: [
          "Divorce",
          "Child Custody",
          "Alimony",
          "Domestic Violence",
          "Other",
        ],
      },
    ],
    "Property Law": [
      {
        name: "propertyType",
        label: "Property Type",
        type: "select",
        options: ["Residential", "Commercial", "Agricultural", "Industrial"],
      },
      {
        name: "ownershipDetails",
        label: "Ownership Details",
        type: "textarea",
      },
      { name: "disputeNature", label: "Nature of Dispute", type: "text" },
    ],
    "Criminal Law": [
      { name: "firNumber", label: "FIR Number", type: "text" },
      { name: "policeStation", label: "Police Station", type: "text" },
      { name: "incidentDate", label: "Incident Date", type: "date" },
    ],
    "Consumer Protection": [
      { name: "productService", label: "Product/Service", type: "text" },
      { name: "purchaseDate", label: "Purchase Date", type: "date" },
      {
        name: "complaintType",
        label: "Complaint Type",
        type: "select",
        options: [
          "Defective Product",
          "Poor Service",
          "Overcharging",
          "False Advertising",
          "Other",
        ],
      },
    ],
  };

  // Auto-save functionality
  useEffect(() => {
    if (!user?.id) return;
    clearTimeout(autoSaveRef.current);

    autoSaveRef.current = setTimeout(() => {
      if (formData.title || formData.description) {
        localStorage.setItem(
          `caseDraft_${user.id}`,
          JSON.stringify({
            ...formData,
            lastSaved: new Date().toISOString(),
          })
        );
        setAutoSaveStatus("Draft saved");
        setTimeout(() => setAutoSaveStatus(""), 1500);
      }
    }, 1500);

    return () => clearTimeout(autoSaveRef.current);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    if (!user?.id) return;
    const savedDraft = localStorage.getItem(`caseDraft_${user.id}`);
    if (savedDraft) {
      setDraftData(JSON.parse(savedDraft));
      setShowDraftModal(true);
    }
  }, [user?.id]);

  // Statute of limitations check
  useEffect(() => {
    if (formData.categorySpecificData.incidentDate) {
      const incidentDate = new Date(formData.categorySpecificData.incidentDate);
      const daysSince = (new Date() - incidentDate) / (1000 * 60 * 60 * 24);

      if (daysSince > 1095) {
        // 3 years
        setShowStatuteWarning(true);
      } else {
        setShowStatuteWarning(false);
      }
    }
  }, [formData.categorySpecificData.incidentDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const navigate = useNavigate();

  const handleCategorySpecificChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      categorySpecificData: {
        ...prev.categorySpecificData,
        [name]: value,
      },
    }));
  };

  const handleLocationSelect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: latitude,
              lng: longitude,
              address: "Current Location",
            },
          }));
          if (errors.location) {
            setErrors((prev) => ({ ...prev, location: "" }));
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to manual search
          setSearchQuery("");
        }
      );
    }
  };

  const iconWrapperClass =
    "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10";

  const inputClass =
    "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400";

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400";
    const errorClass = fieldErrors[fieldName]
      ? "border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-500/50"
      : "border-gray-300 dark:border-gray-600";
    return `${baseClass} ${errorClass}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      const results = data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      // Set empty results on error
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result) => {
    setPosition({ lat: result.lat, lng: result.lng });
    reverseGeocode(result.lat, result.lng);
    setSearchResults([]);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        officeAddressLine1: data.address?.road || "",
        city: data.address?.city || data.address?.town || "",
        state: data.address?.state || "",
        pincode: data.address?.postcode || "",
        country: data.address?.country || "India",
        location: {
          lat,
          lng,
          address: data.display_name,
        },
      }));

      setSearchQuery(data.display_name || "");
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setPosition({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error("Location error:", error);
      }
    );
  };

  // Map components
  const DraggableMarker = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      },
    });

    return (
      <Marker
        position={[position.lat, position.lng]}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const { lat, lng } = marker.getLatLng();
            setPosition({ lat, lng });
            reverseGeocode(lat, lng);
          },
        }}
      />
    );
  };

  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();

    useEffect(() => {
      map.setView([lat, lng]);
    }, [lat, lng, map]);

    return null;
  };

  //   const MapClickHandler = () => {
  //     useMapEvents({
  //       click: (e) => {
  //         const { lat, lng } = e.latlng;
  //         setPosition({ lat, lng });

  //         setFormData(prev => ({
  //           ...prev,
  //           location: {
  //             lat,
  //             lng,
  //             address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
  //           }
  //         }));
  //       }
  //     });

  //     return null;
  //   };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/png",
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isValidType || !isValidSize) {
        return false;
      }
      return true;
    });

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...validFiles],
    }));
  };

  const removeDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Basic Details
        if (!formData.title.trim()) {
          newErrors.title = "Case title is required";
        }
        if (!formData.category) {
          newErrors.category = "Legal category is required";
        }
        break;

      case 1: // Case Details
        if (!formData.description.trim()) {
          newErrors.description = "Case description is required";
        } else if (formData.description.length < 50) {
          newErrors.description = "Description must be at least 50 characters";
        }
        break;

      case 2: // Location
        if (!formData.location) {
          newErrors.location = "Location is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };
  const hasStepError = (stepIndex) =>
    (stepIndex === 0 && (errors.title || errors.category)) ||
    (stepIndex === 1 && errors.description) ||
    (stepIndex === 2 && errors.location);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      showToast({ type: "error", message: "Please complete all required fields." });
      return;
    }
    //   try {
    //   const response = await caseService.submitCase(formData);
    //   setSubmittedCase(response.data || response); 
    // } catch (error) {
    //   console.error("Submission error:", error);
    // }

    setIsSubmitting(true);
    startLoading("Submitting your case...");

    try {
      // Prepare case data for API
      const caseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        preferredLanguage: formData.preferredLanguage,
        // Flat location fields for DTO
        latitude: formData.location?.lat,
        longitude: formData.location?.lng,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        officeAddressLine1: formData.officeAddressLine1,

        documents: formData.documents,
        // Include category-specific data as JSON string
        categorySpecificData:
          Object.keys(formData.categorySpecificData).length > 0
            ? JSON.stringify(formData.categorySpecificData)
            : null,
      };

      // Call the actual API service
      const response = await caseService.submitCase(caseData);

      // Simulated response code removed

      setSubmittedCase(response);
      if (user?.id) {
        localStorage.removeItem(`caseDraft_${user.id}`);
      }

      stopLoading(true, `Case ${response.id} submitted successfully!`);

    } catch (error) {
      console.error("Failed to submit case:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Failed to submit case. Please try again.",
      });
      stopLoading(false, "Submission failed. Please try again.");

    } finally {
      setIsSubmitting(false);
    }
  };
  // 
  // if (submittedCase) {
  //     return (
  //       <div className="w-full bg-[#FAFBFF] min-h-screen p-4 md:p-12 font-sans animate-in fade-in duration-700">
  //         <div className="max-w-5xl mx-auto space-y-10">

  //           {/* SECTION 1: HEADER & ACTIVE STATUS */}
  //           <header className="text-center space-y-6">
  //             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest">
  //               <span className="relative flex h-2 w-2">
  //                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  //                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  //               </span>
  //               Case Live
  //             </div>
  //             <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your case is in motion.</h1>

  //             {/* ENHANCED MATCHING STATUS BOX (Moved to top as requested) */}
  //             <div className="max-w-md mx-auto p-4 bg-white border-2 border-teal-500 rounded-2xl shadow-xl shadow-teal-500/10 flex items-center gap-4">
  //                <div className="bg-teal-500 text-white text-xs font-black p-2 rounded-lg">02</div>
  //                <div className="text-left">
  //                   <h4 className="font-bold text-slate-800 text-sm">Expert Matching Phase</h4>
  //                   <p className="text-xs text-slate-500 italic">Our algorithm is currently vetting {activeTab}s...</p>
  //                </div>
  //             </div>

  //             <p className="text-slate-500 max-w-lg mx-auto">Reference <span className="font-mono font-bold text-slate-800">#{submittedCase.id}</span>. Experts in <span className="text-teal-600 underline decoration-2 underline-offset-4">{formData.category}</span> are being ranked.</p>
  //           </header>

  //           {/* SECTION 2: THE MATCH LIST WITH PERCENTAGE */}
  //           <div className="space-y-6">
  //             <div className="flex items-center justify-between">
  //               <h3 className="text-2xl font-bold text-slate-800">Top Recommendations</h3>
  //               <div className="flex bg-slate-200/50 p-1 rounded-lg">
  //                 {["Lawyer", "NGO"].map(t => (
  //                   <button 
  //                     key={t}
  //                     onClick={() => setActiveTab(t)}
  //                     className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
  //                   >
  //                     {t}s
  //                   </button>
  //                 ))}
  //               </div>
  //             </div>

  //             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //               {STATIC_SUGGESTIONS.filter(item => item.type === activeTab).slice(0, 4).map((item, idx) => (
  //                 <div 
  //                   key={item.id} 
  //                   onClick={() => setSelectedProfessional(item)}
  //                   className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer"
  //                 >
  //                   {/* MATCH PERCENTAGE BADGE */}
  //                   <div className="absolute top-4 right-4 flex flex-col items-end">
  //                     <span className="text-[10px] font-bold text-slate-400 uppercase">Match Score</span>
  //                     <span className="text-xl font-black text-teal-600">{item.matchScore || "98"}%</span>
  //                   </div>

  //                   {idx === 0 && (
  //                     <span className="absolute -top-3 left-6 bg-amber-400 text-amber-950 text-[10px] font-black px-3 py-1 rounded-full uppercase">Best Match</span>
  //                   )}

  //                   <div className="flex gap-5">
  //                     <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
  //                       {activeTab === "Lawyer" ? "⚖️" : "🤝"}
  //                     </div>
  //                     <div className="flex-1">
  //                       <h4 className="font-bold text-lg text-slate-900 group-hover:text-teal-600 transition-colors pr-16">{item.name}</h4>
  //                       <p className="text-xs font-semibold text-teal-600 uppercase tracking-tighter mb-3">{item.expertise}</p>
  //                       <div className="flex items-center gap-1 text-sm font-bold text-slate-700 mb-2">
  //                         ⭐ {item.rating}
  //                       </div>
  //                       <div className="flex items-center justify-between border-t pt-4">
  //                          <span className="text-xs font-bold text-slate-400">View Details</span>
  //                          <span className="text-xs font-bold text-teal-600 group-hover:underline">Contact →</span>
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>

  //           {/* BOTTOM ACTION BAR */}
  //           <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-slate-900 rounded-3xl text-white">
  //             <div>
  //               <h4 className="text-lg font-bold">Need more options?</h4>
  //               <p className="text-slate-400 text-sm">Browse our full directory of {activeTab}s worldwide.</p>
  //             </div>
  //             <button 
  //                 onClick={() => navigate(`/discovery/${activeTab.toLowerCase()}s`)}
  //                 className="w-full md:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-colors shadow-lg shadow-teal-500/20"
  //             >
  //               Explore Full Directory
  //             </button>
  //           </footer>
  //         </div>

  //         {/* MODAL: PROFESSIONAL DETAILS */}
  //         {selectedProfessional && (
  //           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
  //             <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl relative">
  //               {/* Close Button */}
  //               <button 
  //                 onClick={() => setSelectedProfessional(null)}
  //                 className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
  //               >
  //                 ✕
  //               </button>

  //               <div className="p-8 space-y-6">
  //                 <div className="flex items-center gap-6">
  //                   <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center text-3xl">
  //                     {activeTab === "Lawyer" ? "⚖️" : "🤝"}
  //                   </div>
  //                   <div>
  //                     <h2 className="text-2xl font-black text-slate-900">{selectedProfessional.name}</h2>
  //                     <p className="text-teal-600 font-bold text-sm uppercase">{selectedProfessional.expertise}</p>
  //                     <div className="flex items-center gap-1 text-slate-700 font-bold">⭐ {selectedProfessional.rating}</div>
  //                   </div>
  //                 </div>

  //                 <div className="space-y-4">
  //                   <div className="bg-slate-50 p-4 rounded-xl">
  //                     <h5 className="text-[10px] font-black text-slate-400 uppercase mb-1">About Expert</h5>
  //                     <p className="text-sm text-slate-600 leading-relaxed">{selectedProfessional.bio}</p>
  //                   </div>

  //                   <div className="grid grid-cols-2 gap-4">
  //                     <div className="bg-slate-50 p-4 rounded-xl">
  //                       <h5 className="text-[10px] font-black text-slate-400 uppercase mb-1">Experience</h5>
  //                       <p className="text-sm font-bold text-slate-800">{selectedProfessional.exp}</p>
  //                     </div>
  //                     <div className="bg-slate-50 p-4 rounded-xl">
  //                       <h5 className="text-[10px] font-black text-slate-400 uppercase mb-1">Response Time</h5>
  //                       <p className="text-sm font-bold text-slate-800">~2 Hours</p>
  //                     </div>
  //                   </div>

  //                   <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
  //                     <h5 className="text-[10px] font-black text-emerald-600 uppercase mb-1">Contact Information</h5>
  //                     <p className="text-sm font-bold text-slate-800 italic">Available upon scheduling</p>
  //                   </div>
  //                 </div>

  //                 {/* MODAL ACTIONS */}
  //                 <div className="grid grid-cols-2 gap-4 pt-2">
  //                   <button className="py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
  //                     💬 Chat Now
  //                   </button>
  //                   <button className="py-4 bg-teal-500 text-slate-900 font-bold rounded-2xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">
  //                     📅 Schedule
  //                   </button>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         )}
  //       </div>
  //     );
  //   }

  if (submittedCase) {
    return (
      <div className="w-full bg-[#FAFBFF] dark:bg-gray-900 min-h-screen p-4 md:p-12 font-sans animate-in fade-in duration-700 transition-colors">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* SECTION 1: HEADER & ACTIVE STATUS */}
          <header className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Case Live
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your case is in motion.</h1>

            <div className="max-w-md mx-auto p-4 bg-white dark:bg-gray-800 border-2 border-teal-500 rounded-2xl shadow-xl shadow-teal-500/10 flex items-center gap-4">
              <div className="bg-teal-500 text-white text-xs font-black p-2 rounded-lg">02</div>
              <div className="text-left">
                <h4 className="font-bold text-slate-800 dark:text-gray-200 text-sm">Expert Matching Phase</h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 italic">Algorithm ranking top 1% of {activeTab}s...</p>
              </div>
            </div>
          </header>

          {/* SECTION 2: MATCH LIST WITH SORTING */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Top Recommendations</h3>
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setSortBy("match")} className={`text-xs font-bold ${sortBy === 'match' ? 'text-teal-600 dark:text-teal-400 underline' : 'text-slate-400 dark:text-gray-500'}`}>Highest Match</button>
                  <button onClick={() => setSortBy("rating")} className={`text-xs font-bold ${sortBy === 'rating' ? 'text-teal-600 dark:text-teal-400 underline' : 'text-slate-400 dark:text-gray-500'}`}>Top Rated</button>
                </div>
              </div>

              <div className="flex bg-slate-200/50 dark:bg-gray-700/50 p-1 rounded-lg self-start">
                {["Lawyer", "NGO"].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === t ? "bg-white dark:bg-gray-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-gray-400"}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {displayedMatches.map((item, idx) => (
                <ProfileCard
                  key={item.id}
                  viewMode="detailed"
                  submissionMode={true}
                  profile={{
                    ...item,
                    // Mapping to ProfileCard expectations
                    type: activeTab === "Lawyer" ? "lawyer" : "ngo",
                    specialization: item.expertise ? [item.expertise] : [],
                    experience: item.exp,
                    casesHandled: item.casesHandled || 120, // dynamic if available
                    verified: true,
                    city: item.city || "Mumbai",
                    state: "India", // default or fetched
                    languages: ["English", "Hindi"], // default or fetched
                    phoneNumber: item.phone || item.contact,
                    email: item.email,
                    isRequested: false // manage local state if needed
                  }}
                  onContact={(p) => setSelectedProfessional(p)} // Opens the modal
                />
              ))}
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-slate-900 dark:bg-gray-800 rounded-3xl text-white">
            <div>
              <h4 className="text-lg font-bold">Need more options?</h4>
              <p className="text-slate-400 dark:text-gray-400 text-sm">Browse our full directory of {activeTab}s worldwide.</p>
            </div>
            <button
              onClick={() => {
                const typeParam = activeTab === "Lawyer" ? "LAWYER" : "NGO";
                navigate(`/citizen/dashboard?tab=directory&fromCase=true&caseId=${submittedCase.id}&caseType=${encodeURIComponent(formData.category)}&type=${typeParam}`);
              }}
              className="w-full md:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl transition-colors"
            >
              Explore Full Directory
            </button>
          </footer>
        </div>

        {/* MODAL: PROFESSIONAL DETAILS + REQUEST BUTTON */}
        {/* {selectedProfessional && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/20">
              <button 
                onClick={() => setSelectedProfessional(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                ✕
              </button>

              <div className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-teal-50 flex items-center justify-center text-4xl shadow-inner">
                    {activeTab === "Lawyer" ? "⚖️" : "🤝"}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedProfessional.name}</h2>
                    <p className="text-teal-600 font-bold text-sm uppercase tracking-widest">{selectedProfessional.expertise}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-800 font-bold text-lg">⭐ {selectedProfessional.rating}</span>
                      <span className="text-slate-400 text-sm">• {selectedProfessional.exp} Exp</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-3xl">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Biography</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedProfessional.bio}</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-3xl text-white">
                    <h5 className="text-[10px] font-black text-teal-400 uppercase mb-2 tracking-widest">Contact Details</h5>
                    <div className="text-sm space-y-1">
                        <p><span className="text-slate-400 font-medium">Email:</span> {selectedProfessional.email || 'verified@expert.com'}</p>
                        <p><span className="text-slate-400 font-medium">Phone:</span> {selectedProfessional.phone || '+1 (555) 000-0000'}</p>
                    </div>
                  </div>
                </div>

                {/* MODAL ACTIONS - NOW WITH REQUEST BUTTON */}
        {/* <div className="space-y-3 pt-2">
                  <button className="w-full py-4 bg-teal-500 text-slate-900 text-lg font-black rounded-2xl hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 active:scale-95">
                    🚀 Request Legal Assistance
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                      💬 Chat
                    </button>
                    <button className="py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                      📅 Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}  */}
        {/* MODAL: PROFESSIONAL DETAILS + REQUEST BUTTON */}
        {selectedProfessional && (
          <ProfileViewModel
            profile={{
              ...selectedProfessional,
              // Map CaseSubmissionForm's professional object to ProfileViewModel's expected structure if needed
              // CaseSubmissionForm uses: name, expertise, rating, exp, bio, email, phone, city, casesHandled
              // ProfileViewModel expects: name, type, city, state, email, phone, experience, rating, casesHandled, bio, specialization (array), languages (array), qualification, mission
              type: selectedProfessional.type || (activeTab === "Lawyer" ? "lawyer" : "ngo"), // ensure lowercase for icon logic
              specialization: selectedProfessional.expertise ? [selectedProfessional.expertise] : [], // wrap in array
              experience: selectedProfessional.exp,
              verified: true, // Assuming recommendations are verified
              isRequested: false, // You might want to track this state locally if needed
              isLoading: false
            }}
            onClose={() => setSelectedProfessional(null)}
            onRequestConsultation={async (profile) => {
              // Handle Request Logic similar to DirectorySearch
              // Since CaseSubmissionForm might not have all the logic for direct request here, 
              // we should implement a simple handler or reuse caseService.
              // For now, let's keep it simple: Just close/toast or implement the actual call if easy.
              // The inline modal had "Request Assistance". 
              // Let's implement the request call.
              try {
                startLoading("Sending request...");
                await caseService.requestConsultation(submittedCase.id, profile.id, profile.type.toUpperCase());
                showToast({ type: "success", message: `Request sent to ${profile.name}!` });
                setSelectedProfessional(null);
              } catch (error) {
                console.error("Request failed", error);
                showToast({ type: "error", message: "Failed to send request." });
              } finally {
                stopLoading();
              }
            }}
            showConsultationButton={true} // or use submissionMode logic inside ViewModel
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full transition-colors duration-300">
      {/* Header */}


      {/* Progress Steps */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${index < currentStep
                      ? "bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                      : index === currentStep
                        ? "bg-linear-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 ring-4 ring-primary/20"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600"
                      }`}
                  >
                    {index < currentStep ? (
                      <FiCheck className="text-lg" />
                    ) : (
                      <step.icon className="text-lg" />
                    )}
                  </div>
                  <span
                    className={`mt-3 text-sm font-medium text-center ${index <= currentStep ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                      }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 transition-all duration-300 shrink-0 ${index < currentStep
                      ? "bg-linear-to-r from-green-500 to-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-linear-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <FiUser className="text-xl text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <FiMail className="text-gray-400" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <FiPhone className="text-gray-400" />
                  {user?.phone || "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Steps */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700 p-8">
          {/* Step 0: Basic Details */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Basic Information
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Provide the essential details about your legal case
                </p>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FiFileText className="text-primary" />
                    Case Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief title describing your legal issue"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 ${errors.title
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-500/50"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    />
                  </div>
                  {errors.title && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-2 animate-pulse">
                      <FiAlertCircle className="shrink-0" />
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FiInfo className="text-primary" />
                    Legal Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 appearance-none cursor-pointer ${errors.category
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-500/50"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                    >
                      <option value="">Select a category</option>
                      {legalCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiChevronRight className="text-gray-400 transform rotate-90" />
                    </div>
                  </div>
                  {errors.category && (
                    <div className="mt-2 text-sm text-red-600 flex items-center gap-2 animate-pulse">
                      <FiAlertCircle className="shrink-0" />
                      <span>{errors.category}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FiClock className="text-primary" />
                      Urgency Level
                    </label>
                    <div className="relative">
                      <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-500"
                      >
                        {urgencyLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <FiChevronRight className="text-gray-400 transform rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <FiUser className="text-primary" />
                      Preferred Language
                    </label>
                    <div className="relative">
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-500"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <FiChevronRight className="text-gray-400 transform rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Case Details */}
          {currentStep === 1 && (
            <div className="pt-1 space-y-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Case Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Provide a detailed description of your legal issue, including relevant facts, timeline, and what you're seeking..."
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${errors.description ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="shrink-0" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formData.description.length}/50 characters minimum
                </p>
              </div>

              {/* Category-Specific Fields */}
              {formData.category && categoryFields[formData.category] && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <FiInfo className="text-primary" />
                    Additional {formData.category} Information
                  </h3>
                  {categoryFields[formData.category].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={
                            formData.categorySpecificData[field.name] || ""
                          }
                          onChange={handleCategorySpecificChange}
                          // onChange={handleCategorySpecificChange}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          value={
                            formData.categorySpecificData[field.name] || ""
                          }
                          onChange={handleCategorySpecificChange}
                          rows={3}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={
                            formData.categorySpecificData[field.name] || ""
                          }
                          onChange={handleCategorySpecificChange}
                          // onChange={handleCategorySpecificChange}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Statute Warning */}
              {showStatuteWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <FiAlertTriangle className="text-yellow-600 text-xl shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Statute of Limitations Warning
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                      The incident date you entered is more than 3 years ago.
                      Some legal claims may be time-barred. Please consult with
                      a lawyer urgently to verify if your case is still
                      actionable.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="pt-1 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MaterialIcon name="pin_drop" />
                  <span>Case Location</span>
                </div>
              </div>

              {/* Search & Map */}
              <div className="flex gap-2 mb-2 relative z-20">
                <div className="relative flex-1">
                  <div className={iconWrapperClass}>
                    <MaterialIcon name="search" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search location..."
                    className={inputClass}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleSearch())
                    }
                  />
                  {searchResults.length > 0 && (
                    <ul className="absolute z-1000 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <li
                          key={index}
                          onClick={() => selectSearchResult(result)}
                          className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-700 flex items-start gap-2 text-gray-900 dark:text-gray-200"
                        >
                          <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">
                            location_on
                          </span>
                          <span>{result.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0f5557]"
                >
                  Search
                </button>
              </div>

              {/* Leaflet Map */}
              <div className="w-full h-[250px] mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-600 relative z-0">
                <MapContainer
                  center={[position.lat, position.lng]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <DraggableMarker />
                  <RecenterMap lat={position.lat} lng={position.lng} />
                </MapContainer>

                {/* Locate Me Button (outside MapContainer, overlay) */}
                {/* <div className="absolute bottom-2 right-2 z-50"> */}
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  className="absolute bottom-3 right-3 z-[1000] bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Use Current Location"
                >
                  <span className="material-symbols-outlined text-xl">
                    my_location
                  </span>
                </button>
                {/* </div> */}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className={iconWrapperClass}>
                    <MaterialIcon name="apartment" />
                  </div>
                  <input
                    type="text"
                    name="officeAddressLine1"
                    placeholder="e.g. Office 101, Law Chambers"
                    className={getInputClass("officeAddressLine1")}
                    onChange={handleChange}
                    value={formData.officeAddressLine1 || ""}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="location_city" />
                    </div>
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      className={getInputClass("city")}
                      onChange={handleChange}
                      value={formData.city || ""}
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State / Province <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* ICON */}
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="public" />
                    </div>

                    {/* SEARCHABLE STATE DROPDOWN */}
                    <Select
                      options={indianStates}
                      placeholder="Select State"
                      isSearchable
                      value={
                        indianStates.find(
                          (state) => state.value === formData.state
                        ) || null
                      }
                      onChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          state: selected?.value || "",
                        }));
                        setFieldErrors((prev) => ({
                          ...prev,
                          state: "",
                        }));
                      }}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "48px",
                          height: "48px",
                          paddingLeft: "2.75rem", // space for icon
                          borderRadius: "0.75rem",
                          borderColor: fieldErrors.state
                            ? isDarkMode ? "rgba(239, 68, 68, 0.5)" : "#fca5a5"
                            : state.isFocused
                              ? "#11676a"
                              : isDarkMode ? "#4b5563" : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(17,103,106,0.4)"
                            : "0 1px 2px rgba(0,0,0,0.05)",
                          backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                          "&:hover": {
                            borderColor: isDarkMode ? "#9ca3af" : "#11676a",
                          },
                        }),

                        valueContainer: (base) => ({
                          ...base,
                          padding: "0",
                        }),

                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0,
                          color: isDarkMode ? "#f3f4f6" : "#111827",
                        }),

                        placeholder: (base) => ({
                          ...base,
                          color: isDarkMode ? "#9ca3af" : "#9ca3af",
                          fontSize: "0.875rem",
                        }),

                        singleValue: (base) => ({
                          ...base,
                          color: isDarkMode ? "#f3f4f6" : "#111827",
                          fontSize: "0.875rem",
                        }),

                        indicatorSeparator: () => ({
                          display: "none",
                        }),

                        dropdownIndicator: (base) => ({
                          ...base,
                          color: isDarkMode ? "#9ca3af" : "#9ca3af",
                          "&:hover": {
                            color: "#11676a",
                          },
                        }),

                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                          borderRadius: "0.75rem",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        }),

                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "#11676a"
                            : state.isFocused
                              ? isDarkMode ? "#374151" : "#f0fdf4"
                              : "transparent",
                          color: state.isSelected
                            ? "#ffffff"
                            : isDarkMode ? "#f3f4f6" : "#111827",
                          cursor: "pointer",
                          "&:active": {
                            backgroundColor: "#11676a",
                          },
                        }),
                      }}
                    />
                  </div>

                  {fieldErrors.state && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.state}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal / Zip Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="local_post_office" />
                    </div>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      className={getInputClass("pincode")}
                      onChange={handleChange}
                      value={formData.pincode || ""}
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-gray-400 font-normal"></span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="flag" />
                    </div>
                    <input
                      type="text"
                      name="country"
                      placeholder="Country"
                      className={getInputClass("country")}
                      onChange={handleChange}
                      value={formData.country || ""}
                    />
                  </div>
                </div>
              </div>

              {errors.location && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="shrink-0" />
                  {errors.location}
                </p>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The location helps us determine the
                  appropriate jurisdiction and match you with lawyers practicing
                  in your area.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiUpload />
                Supporting Documents
              </h2>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <FiUpload className="text-4xl text-gray-400 mx-auto mb-3" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0e5658] transition"
                >
                  Choose Files
                </button>

                <p className="text-sm text-gray-500 mt-2">
                  PDF, JPEG, PNG files up to 10MB each
                </p>
              </div>

              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    Selected Documents ({formData.documents.length}):
                  </h3>
                  {formData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500">
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded-md border border-gray-300 shrink-0"
                            />
                          ) : file.type === "application/pdf" ? (
                            <div className="w-12 h-12 bg-gray-50 border border-red-200 rounded-md flex items-center justify-center shrink-0">
                              <span className="text-red-600 font-semibold text-xs">
                                PDF
                              </span>
                            </div>
                          ) : (
                            <FiFileText className="text-gray-600 shrink-0 text-xl" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <a
                            href={URL.createObjectURL(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-700 dark:text-gray-200 hover:underline truncate text-sm md:text-base"
                          >
                            {file.name}
                          </a>
                          <p className="text-xs md:text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700 transition p-2 shrink-0"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Recommended documents:</strong> Any relevant
                  contracts, agreements, photographs, receipts, legal notices,
                  or other evidence supporting your case.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Review Your Submission
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Basic Information
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <strong>Title:</strong> {formData.title}
                    </p>
                    <p>
                      <strong>Category:</strong> {formData.category}
                    </p>
                    <p>
                      <strong>Urgency:</strong>{" "}
                      {
                        urgencyLevels.find((l) => l.value === formData.urgency)
                          ?.label
                      }
                    </p>
                    <p>
                      <strong>Language:</strong> {formData.preferredLanguage}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Case Details
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <strong>Description:</strong>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {formData.description}
                    </p>

                    {formData.category &&
                      categoryFields[formData.category] &&
                      Object.keys(formData.categorySpecificData).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="font-medium mb-1">
                            Additional {formData.category} Details:
                          </p>
                          {Object.entries(formData.categorySpecificData).map(
                            ([key, value]) => {
                              const field = categoryFields[
                                formData.category
                              ].find((f) => f.name === key);
                              return value ? (
                                <p key={key}>
                                  <strong>{field?.label}:</strong> {value}
                                </p>
                              ) : null;
                            }
                          )}
                        </div>
                      )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>{formData.location?.address || "Not specified"}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Documents</h3>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {formData.documents.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {formData.documents.map((doc, idx) => (
                          <li key={idx}>
                            {doc.name} ({(doc.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No documents attached</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Ready to submit?</strong> Please review all
                  information carefully. Once submitted, you'll receive a
                  confirmation email and case ID for tracking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="order-2 sm:order-1 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <FiChevronLeft className="text-lg" />
              Previous
            </button>

            <div className="order-1 sm:order-2 flex flex-col gap-3 flex-1 sm:flex-initial">
              {/* Submission Error */}
              {errors.submit && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                  <FiAlertCircle className="text-red-600 shrink-0 mt-0.5 text-lg" />
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    {errors.submit}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 sm:flex-none px-8 py-3 bg-linear-to-r from-primary to-primary/80 text-white rounded-xl font-bold hover:from-primary/90 hover:to-primary/70 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transform hover:scale-105"
                  >
                    Next Step
                    <FiChevronRight className="text-lg" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-8 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 transform hover:scale-105 disabled:transform-none"
                  >
                    <>
                      <FiCheck className="text-lg" />
                      Submit Case
                    </>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-save indicator for mobile */}
        {autoSaveStatus && (
          <div className="md:hidden fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium z-50 animate-bounce">
            <FiSave />
            <span>{autoSaveStatus}</span>
          </div>
        )}
      </div>
      {/* Resume Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6 animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiSave className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resume Draft?</h2>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We found a previously saved draft of your case. Would you like to
              continue where you left off?
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  localStorage.removeItem(`caseDraft_${user.id}`);
                  setShowDraftModal(false);
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Discard
              </button>

              <button
                onClick={() => {
                  setFormData(draftData);

                  if (draftData.location) {
                    setPosition({
                      lat: draftData.location.lat,
                      lng: draftData.location.lng,
                    });
                    setSearchQuery(draftData.location.address || "");
                  }

                  setShowDraftModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-[#0e5658]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseSubmissionForm;
