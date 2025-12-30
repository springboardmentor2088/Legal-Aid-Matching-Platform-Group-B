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
import { caseService } from "../../services/caseService";
import Select from "react-select";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useToast } from "../common/ToastContext";


const MaterialIcon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined align-middle ${className}`}>
    {name}
  </span>
);

const CaseSubmissionForm = () => {
  const { user } = useAuth();
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
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
    "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white";

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-white";
    const errorClass = fieldErrors[fieldName]
      ? "border-red-500 bg-red-50"
      : "border-gray-300 bg-white";
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

    setIsSubmitting(true);

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

      showToast({
        type: "success",
        message: `Case ${response.id} submitted successfully!`,
      });

    } catch (error) {
      console.error("Failed to submit case:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Failed to submit case. Please try again.",
      });
      showToast({
        type: "error",
        message: "Submission failed. Please try again.",
      });

    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedCase) {
    return (
      <div className="w-full bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Case Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your case has been submitted with ID:{" "}
            <span className="font-mono font-bold text-primary">
              {submittedCase.id}
            </span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We'll review your case and match you with appropriate legal
            professionals. You'll receive updates via email and can track the
            status in your dashboard.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Redirect to Directory with location and case type
                const params = new URLSearchParams();
                if (formData.state) params.append("state", formData.state);
                if (formData.city) params.append("city", formData.city);
                if (formData.category)
                  params.append("caseType", formData.category);
                params.append("fromCase", "true");

                window.location.href = `/directory?${params.toString()}`;
              }}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0e5658] transition flex items-center justify-center gap-2"
            >
              <FiUser />
              Find Lawyers & NGOs for Your Case
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setSubmittedCase(null);
                setCurrentStep(0);
                setFormData({
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
                setErrors({});
                setPosition({ lat: 25.5941, lng: 85.1376 });
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Submit Another Case
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-none px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <FiFileText className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Submit Legal Case
                </h1>
                <p className="text-sm text-gray-600">
                  Complete the form to submit your case
                </p>
              </div>
            </div>
            {autoSaveStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <FiSave className="text-green-600" />
                <span>{autoSaveStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="w-full
max-w-none
px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mx-auto ${index < currentStep
                      ? "bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                      : index === currentStep
                        ? "bg-linear-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 ring-4 ring-primary/20"
                        : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                      }`}
                  >
                    {index < currentStep ? (
                      <FiCheck className="text-lg" />
                    ) : (
                      <step.icon className="text-lg" />
                    )}
                  </div>
                  <span
                    className={`mt-3 text-sm font-medium text-center ${index <= currentStep ? "text-gray-900" : "text-gray-400"
                      }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 transition-all duration-300 shrink-0 ${index < currentStep
                      ? "bg-linear-to-r from-green-500 to-green-600"
                      : "bg-gray-200"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="w-full
max-w-none
px-4 sm:px-6 lg:px-10 xl:px-16 mb-8">
        <div className="bg-linear-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl border border-blue-200/50 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <FiUser className="text-xl text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <FiMail className="text-gray-400" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <FiPhone className="text-gray-400" />
                  {user?.phone || "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Steps */}
      <div className="w-full
max-w-none
px-4 sm:px-6 lg:px-10 xl:px-16 pb-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          {/* Step 0: Basic Details */}
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Basic Information
                </h2>
                <p className="text-gray-600">
                  Provide the essential details about your legal case
                </p>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
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
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white ${errors.title
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
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
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FiInfo className="text-primary" />
                    Legal Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white appearance-none cursor-pointer ${errors.category
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
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
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FiClock className="text-primary" />
                      Urgency Level
                    </label>
                    <div className="relative">
                      <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white appearance-none cursor-pointer hover:border-gray-300"
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
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FiUser className="text-primary" />
                      Preferred Language
                    </label>
                    <div className="relative">
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white appearance-none cursor-pointer hover:border-gray-300"
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Case Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Provide a detailed description of your legal issue, including relevant facts, timeline, and what you're seeking..."
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="shrink-0" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length}/50 characters minimum
                </p>
              </div>

              {/* Category-Specific Fields */}
              {formData.category && categoryFields[formData.category] && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FiInfo className="text-primary" />
                    Additional {formData.category} Information
                  </h3>
                  {categoryFields[formData.category].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={
                            formData.categorySpecificData[field.name] || ""
                          }
                          onChange={handleCategorySpecificChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={
                            formData.categorySpecificData[field.name] || ""
                          }
                          onChange={handleCategorySpecificChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
                    <ul className="absolute z-1000 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <li
                          key={index}
                          onClick={() => selectSearchResult(result)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 flex items-start gap-2"
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
              <div className="w-full h-[250px] mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative z-0">
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
                  className="absolute bottom-3 right-3 z-[1000] bg-white p-2.5 rounded-lg shadow-lg hover:bg-gray-50 text-gray-700"
                  title="Use Current Location"
                >
                  <span className="material-symbols-outlined text-xl">
                    my_location
                  </span>
                </button>
                {/* </div> */}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            ? "#fca5a5"
                            : state.isFocused
                              ? "#11676a"
                              : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(17,103,106,0.4)"
                            : "0 1px 2px rgba(0,0,0,0.05)",
                          backgroundColor: "#ffffff",
                          "&:hover": {
                            borderColor: "#11676a",
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
                        }),

                        placeholder: (base) => ({
                          ...base,
                          color: "#9ca3af",
                          fontSize: "0.875rem",
                        }),

                        singleValue: (base) => ({
                          ...base,
                          color: "#111827",
                          fontSize: "0.875rem",
                        }),

                        indicatorSeparator: () => ({
                          display: "none",
                        }),

                        dropdownIndicator: (base) => ({
                          ...base,
                          color: "#9ca3af",
                          "&:hover": {
                            color: "#11676a",
                          },
                        }),

                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                          borderRadius: "0.75rem",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
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
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUpload />
                Supporting Documents
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
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
                  <h3 className="font-medium text-gray-700">
                    Selected Documents ({formData.documents.length}):
                  </h3>
                  {formData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-300">
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
                            className="font-medium text-gray-700 hover:underline truncate text-sm md:text-base"
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

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Review Your Submission
              </h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Basic Information
                  </h3>
                  <div className="space-y-1 text-sm">
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Case Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Description:</strong>
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.description}
                    </p>

                    {formData.category &&
                      categoryFields[formData.category] &&
                      Object.keys(formData.categorySpecificData).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="space-y-1 text-sm">
                    <p>{formData.location?.address || "Not specified"}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Documents</h3>
                  <div className="space-y-1 text-sm">
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
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
              className="order-2 sm:order-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <FiChevronLeft className="text-lg" />
              Previous
            </button>

            <div className="order-1 sm:order-2 flex flex-col gap-3 flex-1 sm:flex-initial">
              {/* Submission Error */}
              {errors.submit && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                  <FiAlertCircle className="text-red-600 shrink-0 mt-0.5 text-lg" />
                  <p className="text-sm text-red-800 font-medium">
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
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiCheck className="text-lg" />
                        Submit Case
                      </>
                    )}
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiSave className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Resume Draft?</h2>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-600 mb-6">
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
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
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
