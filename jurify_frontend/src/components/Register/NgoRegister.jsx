import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";


// Leaflet Imports
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;





import Select from "react-select";
import AuthDarkModeToggle from "../common/AuthDarkModeToggle";
import { useGlobalLoader } from "../../context/GlobalLoaderContext";

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
  { value: "Delhi", label: "Delhi" },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Kannada", label: "Kannada" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Marathi", label: "Marathi" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Bengali", label: "Bengali" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Urdu", label: "Urdu" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Spanish", label: "Spanish" },
];



export default function NgoRegister() {
  const location = useLocation();
  const { preRegToken, preFilledEmail, preFilledName } = location.state || {};
  const { isDarkMode } = useTheme();
  const { startLoading, stopLoading } = useGlobalLoader();

  const [formData, setFormData] = useState({
    ngoName: "",
    registrationNumber: "",
    registrationDate: "",
    registeringAuthority: "",
    ngoPan: "", // For PAN Number text
    ngoType: "trust",

    // Official Details
    officialEmail: preFilledEmail || "",
    officialPhone: "",
    websiteUrl: "",
    officeAddress: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",

    // Auth Person Details
    repName: preFilledName || "",
    repRole: "",
    repEmail: "",
    repPhone: "",

    // Other
    proBonoCommitment: true,
    maxProBonoCases: 5,
    password: "",
    confirmPassword: "",

    // Files
    regCertificate: null,
    darpanCertificate: null,
    panCardFile: null, // Check file names in state, might need adjustment
    repIdProof: null,

    languages: [],
    areasOfWork: [],
    latitude: null,
    longitude: null,

    // Rep Personal (Keep if needed or remove if not requested? User said "Mobile number, Email ID" for Auth Person. Only Name/Designation/Mobile/Email requested.)
    // Keeping for safety/completeness if not explicitly asked to remove logic, but hidden in UI if unused.
    repDob: "",
    repGender: "",
  });


  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    ngoName: "",
    darpanId: "",
    registrationNumber: "",
    registrationYear: "",
    officialEmail: "",
    officialPhone: "",
    websiteUrl: "",
    repName: "",
    repRole: "",
    repEmail: "",
    repPhone: "",
    officeAddress: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    areasOfWork: "",
    location: "",
    repDob: "",
    repGender: "",

  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });
  const [formSuccess, setFormSuccess] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pollingToken, setPollingToken] = useState(null);
  const { register, login, syncUser } = useAuth();
  const navigate = useNavigate();

  // --- Leaflet Helper Components ---
  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
  };

  const DraggableMarker = () => {
    const markerRef = React.useRef(null);
    const eventHandlers = React.useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition({ lat, lng });
            // Only update lat/lng in form data
            setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
          }
        },
      }),
      []
    );
    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}
      />
    );
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      },
    });
    return null;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=5`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "jurify-app/1.0",
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        console.log("Location not found");
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);

    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    const state = addr.state || "";
    const pincode = addr.postcode || "";
    const country = addr.country || "India";

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      city,
      state,
      pincode,
      country
    }));

    setFieldErrors((prev) => ({
      ...prev,
      city: "",
      state: "",
      pincode: "",
      location: ""
    }));
  };


  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setFieldErrors((prev) => ({ ...prev, location: "" }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "jurify-app/1.0" } }
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const state = addr.state || "";
            const pincode = addr.postcode || "";
            const country = addr.country || "India";

            setFormData(prev => ({
              ...prev,
              city,
              state,
              pincode,
              country
            }));
            if (data.display_name) setSearchQuery(data.display_name);
            setFieldErrors(prev => ({
              ...prev,
              city: "",
              state: "",
              pincode: ""
            }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
        }
      },
      (error) => {
        let errorMessage = "Unable to get your current location.";
        if (error.code === error.PERMISSION_DENIED)
          errorMessage = "Location access denied.";
        alert(errorMessage);
      },
      { timeout: 10000 }
    );
  };

  const [areasOfWorkOptions, setAreasOfWorkOptions] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await import("../../services/api").then(module => module.default.getLegalCategories());
        setAreasOfWorkOptions(categories.map(cat => cat.name));
      } catch (error) {
        console.error("Failed to fetch legal categories", error);
      }
    };
    fetchCategories();
  }, []);

  const Areas = areasOfWorkOptions.length > 0 ? areasOfWorkOptions : [
    "Human Rights", "Women Safety", "Child Protection", "Legal Awareness",
    "Environment", "Education", "Health", "Poverty Alleviation"
  ];

  const inputClass =
    "w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm text-gray-900 dark:text-white dark:[color-scheme:dark] " +
    "focus:outline-none focus:ring-2 focus:ring-[#11676a]/40 focus:border-[#11676a] transition-all duration-200 " +
    "placeholder:text-gray-400 dark:placeholder-gray-400";

  const iconWrapperClass =
    "absolute top-1/2 -translate-y-1/2 left-3 z-20 pointer-events-none text-gray-400";

  const sectionCardClass =
    "rounded-2xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 shadow-sm";

  const sectionTitleClass =
    "flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1";

  const sectionSubtitleClass = "text-xs text-gray-500 dark:text-gray-400";

  const MaterialIcon = ({ name, className = "" }) => (
    <span
      className={`material-symbols-outlined text-xl text-gray-500 dark:text-gray-400 ${className}`}
    >
      {name}
    </span>
  );

  const labelClass = "text-xs font-medium text-gray-700 dark:text-gray-200 mb-1 block";

  const handleChange = (e) => {
    //const { name, value, type, checked } = e.target;
    let { name, value, type, checked } = e.target;

    if (name === "repPhone" || name === "officialPhone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "registrationYear") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    if (name === "password" || name === "confirmPassword") {
      if (value.length > 20) return;
    }
    if (name === "state") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, state: "State is required" }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          state: "State should only contain letters",
        }));
      } else {
        // Add this line to clear the error as soon as a valid state is typed/selected
        setFieldErrors((prev) => ({ ...prev, state: "" }));
      }
    }
    if (name === "proBonoCommitment") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");

    // Real-time validation
    if (name === "ngoName") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          ngoName: "NGO name is required",
        }));
      } else if (value.trim().length < 3) {
        setFieldErrors((prev) => ({
          ...prev,
          ngoName: "NGO name must be at least 3 characters",
        }));
      }
    }

    if (name === "repDob") {
      if (!value) {
        setFieldErrors((prev) => ({
          ...prev,
          repDob: "Date of birth is required",
        }));
      } else {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          setFieldErrors((prev) => ({
            ...prev,
            repDob: "Representative must be at least 18 years old",
          }));
        } else {
          setFieldErrors((prev) => ({ ...prev, repDob: "" }));
        }
      }
    }

    if (name === "registrationYear") {
      if (!value) {
        // Optional or required? Let's assume optional unless specified, but user asked for validation.
        // If user types, we validate.
      } else if (value.length !== 4) {
        setFieldErrors((prev) => ({
          ...prev,
          registrationYear: "Year must be 4 digits",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, registrationYear: "" }));
      }
    }


    if (name === "darpanId") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          darpanId: "Darpan ID is required",
        }));
      } else if (value.trim().length < 8) {
        setFieldErrors((prev) => ({
          ...prev,
          darpanId: "Please enter a valid Darpan ID",
        }));
      }
    }

    if (name === "officialEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          officialEmail: "Official email is required",
        }));
      } else if (!emailRegex.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          officialEmail: "Please enter a valid email address",
        }));
      }
    }

    if (name === "repEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          repEmail: "Representative email is required",
        }));
      } else if (!emailRegex.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          repEmail: "Please enter a valid email address",
        }));
      }
    }

    if (!preRegToken) {
      if (name === "password") {
        validatePasswordStrength(value);
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        } else if (formData.confirmPassword) {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
        }
      }
    }

    if (!preRegToken) {
      if (name === "confirmPassword") {
        if (value !== formData.password) {
          setFieldErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        }
      }
    }

    if (name === "officialPhone") {
      const phoneValidation = validatePhoneNumber(value);
      setFieldErrors((prev) => ({
        ...prev,
        officialPhone: phoneValidation.isValid ? "" : phoneValidation.message,
      }));
    }

    if (name === "repPhone") {
      const phoneValidation = validatePhoneNumber(value);
      setFieldErrors((prev) => ({
        ...prev,
        repPhone: phoneValidation.isValid ? "" : phoneValidation.message,
      }));
    }

    if (name === "officeAddress") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          officeAddress: "Office address is required",
        }));
      } else if (value.trim().length < 5) {
        setFieldErrors((prev) => ({
          ...prev,
          officeAddress: "Please enter a complete address",
        }));
      }
    }

    if (name === "city") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, city: "City is required" }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          city: "City should only contain letters",
        }));
      }
    }


    if (name === "repGender") {
      if (!value) {
        setFieldErrors((prev) => ({
          ...prev,
          repGender: "Gender is required",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, repGender: "" }));
      }
    }


    if (name === "pincode") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          pincode: "Postal code is required",
        }));
      } else if (!/^[0-9]{4,10}$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          pincode: "Please enter a valid postal code",
        }));
      }
    }

    if (name === "officialPhoneCountryCode") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formData.officialPhone) {
        const phoneValidation = validatePhoneNumber(
          formData.officialPhone,
          value
        );
        setFieldErrors((prev) => ({
          ...prev,
          officialPhone: phoneValidation.isValid ? "" : phoneValidation.message,
        }));
      }
      return;
    }

    if (name === "repPhoneCountryCode") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formData.repPhone) {
        const phoneValidation = validatePhoneNumber(formData.repPhone, value);
        setFieldErrors((prev) => ({
          ...prev,
          repPhone: phoneValidation.isValid ? "" : phoneValidation.message,
        }));
      }
      return;
    }
  };
  const fileInputRefs = {
    regCertificate: useRef(null),
    darpanCertificate: useRef(null),
    ngoPan: useRef(null),
    repIdProof: useRef(null),
  };


  const handleFileChange = (e) => {
    try {
      const { name, files } = e.target;

      if (files && files.length > 0) {
        const file = files[0];

        const validTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!validTypes.includes(file.type)) {
          setError("Please upload a valid file type (JPEG, PNG, or PDF)");
          return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          setError("File size should not exceed 5MB");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          [name]: file,
        }));
        setError("");
      }
    } catch (error) {
      setError("An error occurred while uploading the file. Please try again.");
    }
  };


  const handleRemoveFile = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));

    if (fileInputRefs[fieldName]?.current) {
      fileInputRefs[fieldName].current.value = "";
    }
  };


  const handleAreaChange = (area) => {
    setFormData((prev) => ({
      ...prev,
      areasOfWork: prev.areasOfWork.includes(area)
        ? prev.areasOfWork.filter((a) => a !== area)
        : [...prev.areasOfWork, area],
    }));
  };

  const validatePasswordStrength = (password) => {
    const checks = {
      minLength: password.length >= 8,
      maxLength: password.length <= 20,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/\?]/.test(password),
    };

    const feedback = [];
    if (!checks.minLength) feedback.push("At least 8 characters");
    if (!checks.maxLength) feedback.push("Maximum 20 characters");
    if (!checks.hasUpperCase) feedback.push("One uppercase letter (A-Z)");
    if (!checks.hasLowerCase) feedback.push("One lowercase letter (a-z)");
    if (!checks.hasNumber) feedback.push("One number (0-9)");
    if (!checks.hasSpecialChar)
      feedback.push("One special character (!@#$%^&*...)");

    const score = Object.values(checks).filter(Boolean).length;

    setPasswordStrength({ score, feedback });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500";
    if (passwordStrength.score <= 4) return "bg-yellow-500";
    if (passwordStrength.score <= 5) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return "Weak";
    if (passwordStrength.score <= 4) return "Fair";
    if (passwordStrength.score <= 5) return "Good";
    return "Strong";
  };

  const validatePhoneNumber = (phoneNumber) => {
    // Remove everything except digits
    const clean = String(phoneNumber).replace(/\D/g, "");

    let local = clean;

    if (local.length === 12 && local.startsWith("91")) {
      local = local.slice(2);
    }

    const indianRegex = /^[6-9]\d{9}$/;

    if (!indianRegex.test(local)) {
      return {
        isValid: false,
        message:
          "Please enter a valid Indian mobile number (10 digits, starts with 6–9).",
      };
    }

    return { isValid: true, message: "" };
  };


  const [isSubmitting, setIsSubmitting] = useState(false);

  const repNameRef = useRef(null);
  const repRoleRef = useRef(null);
  const repEmailRef = useRef(null);
  const repDobRef = useRef(null);
  const repGenderRef = useRef(null);
  const repPhoneRef = useRef(null);
  const darpanIdRef = useRef(null);
  const passwordRef = useRef(null);
  const ngoNameRef = useRef(null);
  const officialEmailRef = useRef(null);
  const areasOfWorkRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    let firstInvalidRef = null;
    const newErrors = {};

    // Check passwords
    if (!preRegToken) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        newErrors.confirmPassword = "Passwords do not match";
        if (!firstInvalidRef) firstInvalidRef = passwordRef;
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
        if (!firstInvalidRef) firstInvalidRef = passwordRef;
      }
    }

    // Mandatory fields validation
    if (!formData.ngoName) {
      newErrors.ngoName = "NGO Name is required";
      if (!firstInvalidRef) firstInvalidRef = ngoNameRef;
    }
    if (!formData.darpanId) {
      newErrors.darpanId = "Darpan ID is required";
      if (!firstInvalidRef) firstInvalidRef = darpanIdRef;
    }
    if (!formData.officialEmail) {
      newErrors.officialEmail = "Official Email is required";
      if (!firstInvalidRef) firstInvalidRef = officialEmailRef;
    }
    if (formData.areasOfWork.length === 0) {
      newErrors.areasOfWork = "Select at least one area of work";
      if (!firstInvalidRef) firstInvalidRef = areasOfWorkRef;
    }

    // Representative details
    if (!formData.repName) {
      newErrors.repName = "Representative Name is required";
      if (!firstInvalidRef) firstInvalidRef = repNameRef;
    }
    if (!formData.repRole) {
      newErrors.repRole = "Representative Role is required";
      if (!firstInvalidRef) firstInvalidRef = repRoleRef;
    }
    if (!formData.repEmail) {
      newErrors.repEmail = "Representative Email is required";
      if (!firstInvalidRef) firstInvalidRef = repEmailRef;
    }
    if (!formData.repPhone) {
      newErrors.repPhone = "Representative Phone is required";
      if (!firstInvalidRef) firstInvalidRef = repPhoneRef;
    }
    if (!formData.repDob) {
      newErrors.repDob = "Date of Birth is required";
      if (!firstInvalidRef) firstInvalidRef = repDobRef;
    }
    if (!formData.repGender) {
      newErrors.repGender = "Gender is required";
      if (!firstInvalidRef) firstInvalidRef = repGenderRef;
    }


    setFieldErrors(newErrors);

    // Scroll to the first invalid field
    if (firstInvalidRef && firstInvalidRef.current) {
      firstInvalidRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidRef.current.focus();
      setIsSubmitting(false);
      return; // Stop submission until corrected
    }

    // Check agreement
    if (!isAgreed) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      setIsSubmitting(false);
      return;
    }

    const getNgoTypeEnum = (type) => {
      switch (type) {
        case "trust":
          return "TRUST_REGISTRATION_ACT";
        case "society":
          return "SOCIETIES_REGISTRATION_ACT";
        case "section8":
          return "SECTION_8_COMPANY";
        default:
          return "OTHER";
      }
    };

    const dataPayload = {
      email: formData.officialEmail, // User Login Email = Official Email (Reverted)
      password: formData.password,
      organizationName: formData.ngoName,
      registrationNumber: formData.registrationNumber,
      registrationType: getNgoTypeEnum(formData.ngoType),
      registrationDate: formData.registrationDate,
      registeringAuthority: formData.registeringAuthority,
      panNumber: formData.ngoPan, // Text field PAN
      languages: formData.languages.map(l => l.value).join(", "),

      organizationPhone: formData.officialPhone, // New backend field
      organizationEmail: formData.officialEmail, // New backend field

      contactPersonName: formData.repName,
      contactPersonDesignation: formData.repRole,
      contactEmail: formData.repEmail, // Rep Email
      contactPhone: formData.repPhone, // Rep Phone

      proBonoCommitment: formData.proBonoCommitment,
      maxProBonoCases: formData.maxProBonoCases,

      websiteUrl: formData.websiteUrl,
      officeAddressLine1: formData.officeAddress,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      latitude: formData.latitude,
      longitude: formData.longitude,
      areasOfWork: formData.areasOfWork,
      preRegistrationToken: preRegToken || "",
    };

    const formDataPayload = new FormData();
    formDataPayload.append(
      "data",
      new Blob([JSON.stringify(dataPayload)], { type: "application/json" })
    );
    formDataPayload.append("role", "NGO");

    // Append NGO specific files
    if (formData.regCertificate) {
      formDataPayload.append("regCertificate", formData.regCertificate);
    }
    if (formData.darpanCertificate) {
      formDataPayload.append("darpanCertificate", formData.darpanCertificate);
    }
    if (formData.panCardFile) { // Check this state key name logic
      formDataPayload.append("ngoPan", formData.panCardFile); // Backend expects 'ngoPan' file
    }
    if (formData.repIdProof) {
      formDataPayload.append("repIdProof", formData.repIdProof);
    }

    startLoading("Registering NGO...");

    try {
      const result = await register(formDataPayload);

      if (result.success) {
        stopLoading(true, "NGO Registration successful! Please verify email.");
        setIsSuccess(true);
        if (result.pollingToken) {
          setPollingToken(result.pollingToken);
        }
      } else {
        setError(result.error || "Registration failed");
        setIsSubmitting(false);
        stopLoading(false, result.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred: " + err.message);
      setIsSubmitting(false);
      stopLoading(false, "An unexpected error occurred.");
    }
  };


  // Polling Effect
  useEffect(() => {
    let intervalId;
    if (isSuccess && pollingToken) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(
            "http://localhost:8080/api/auth/poll-verification",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ pollingToken }),
            }
          );

          if (response.ok) {
            if (response.status === 202) {
              return; // Still pending
            }
            const data = await response.json();

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            // Critical: Store full user object for authService/AuthContext
            const userObj = {
              id: data.userId,
              email: data.email,
              role: data.role,
              // NGO specific
              organizationName: data.firstName, // mapped to firstName in AuthResponse helper
              phone: data.organizationPhone,
              contactPersonName: data.contactPersonName,
              registrationNumber: data.registrationNumber,
              languages: data.languages,
              isEmailVerified: data.isEmailVerified,
            };
            localStorage.setItem("user", JSON.stringify(userObj));

            localStorage.setItem("userRole", data.role);
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userId", data.userId);
            window.dispatchEvent(new Event("storage"));

            syncUser(); // Update Auth state, triggers PublicRoute redirect

            clearInterval(intervalId);

            // Manual navigation removed, let PublicRoute handle it
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [isSuccess, pollingToken, navigate]);

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border text-sm " +
      "focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

    if (fieldErrors[fieldName]) {
      return (
        baseClass +
        " border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500 text-red-900 dark:text-red-300 placeholder:text-red-300 dark:placeholder-red-400"
      );
    }

    return (
      baseClass +
      " border-gray-200 bg-white shadow-sm focus:ring-primary/40 focus:border-primary dark:focus:ring-teal-500/40 dark:focus:border-teal-500"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-6xl w-full grid lg:grid-cols-[1fr_1.5fr] gap-6 sm:gap-8 lg:gap-10 items-stretch">
        {/* Left Panel - Hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-linear-to-br from-[#0a4d68] via-primary to-[#2c3e50] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-black/15 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  volunteer_activism
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-50/90">
                  Jurify for NGOs
                </p>
                <h1 className="text-2xl font-semibold mt-1">
                  Join the Jurify NGO Network
                </h1>
              </div>
            </div>

            <p className="text-sm text-teal-50/95 leading-relaxed">
              Partner with Jurify to connect vulnerable communities with
              verified pro bono lawyers. Register your NGO to collaborate on
              legal aid, awareness drives, and rights-based interventions.
            </p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Partner NGOs
                </p>
                <p className="text-xl font-semibold mt-1">250+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Legal Clinics Hosted
                </p>
                <p className="text-xl font-semibold mt-1">900+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Beneficiaries Reached
                </p>
                <p className="text-xl font-semibold mt-1 flex items-center gap-1">
                  50k+
                  <span className="material-symbols-outlined text-sm">
                    groups
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium text-teal-50">
                Why NGOs collaborate with Jurify
              </p>
              <ul className="space-y-2 text-xs text-teal-50/90">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-px">
                    check_circle
                  </span>
                  <span>
                    Access a verified pool of pro bono lawyers across regions.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-px">
                    check_circle
                  </span>
                  <span>
                    Coordinate legal aid camps, rights awareness drives, and
                    case referrals.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-px">
                    check_circle
                  </span>
                  <span>
                    Track the impact of legal aid delivered through your NGO.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            <p className="text-[0.7rem] text-teal-50/90">
              "Through Jurify, we were able to connect women in crisis to
              dependable legal support within days."
            </p>
            <p className="mt-2 text-xs font-semibold text-teal-50">
              — NGO Partner
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 max-h-screen overflow-hidden flex flex-col">
          <Link
            to="/"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-primary transition-transform duration-200 hover:scale-110"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              home
            </span>
          </Link>

          <header className="mb-5 sm:mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#6692a3] text-white shadow-md">
                <span className="material-symbols-outlined text-xl sm:text-2xl">
                  volunteer_activism
                </span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Register as an NGO Partner
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                  Share your organization&apos;s details to collaborate on legal
                  aid and justice initiatives.
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-4 sm:mb-5 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-red-500 shrink-0">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 sm:space-y-6 flex-1 min-h-[60vh] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scroll"
          >
            {/* 1. NGO Identity Details */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="apartment" className="text-primary!" />
                  <span>NGO Identity Details</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Core registration and identity details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* NGO Name */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>
                    Registered Name of NGO <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="corporate_fare" className={fieldErrors.ngoName ? "text-red-500" : ""} />
                    </div>
                    <input
                      ref={ngoNameRef}
                      type="text"
                      name="ngoName"
                      placeholder="Official Organization Name"
                      className={getInputClass("ngoName")}
                      onChange={handleChange}
                      value={formData.ngoName}
                      required
                    />
                  </div>
                  {fieldErrors.ngoName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.ngoName}</span>
                    </div>
                  )}
                </div>

                {/* Registration Number */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Reigstration Number <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="badge" className={fieldErrors.registrationNumber ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="registrationNumber"
                      placeholder="e.g., FCRA/Reg-12345"
                      className={getInputClass("registrationNumber")}
                      onChange={handleChange}
                      value={formData.registrationNumber}
                      required
                    />
                  </div>
                  {fieldErrors.registrationNumber && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.registrationNumber}</span>
                    </div>
                  )}
                </div>

                {/* Date of Registration */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Date of Registration <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="calendar_today" className={fieldErrors.registrationDate ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="date"
                      name="registrationDate"
                      className={getInputClass("registrationDate")}
                      onChange={handleChange}
                      value={formData.registrationDate}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  {fieldErrors.registrationDate && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.registrationDate}</span>
                    </div>
                  )}
                </div>

                {/* Registering Authority */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Registering Authority <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="gavel" className={fieldErrors.registeringAuthority ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="registeringAuthority"
                      placeholder="e.g. Registrar of Societies"
                      className={getInputClass("registeringAuthority")}
                      onChange={handleChange}
                      value={formData.registeringAuthority}
                      required
                    />
                  </div>
                  {fieldErrors.registeringAuthority && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.registeringAuthority}</span>
                    </div>
                  )}
                </div>

                {/* PAN Number */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>PAN Number <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="credit_card" className={fieldErrors.ngoPan ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="ngoPan" // Using ngoPan for Text here temporarily, rename state ideally or map correctly
                      placeholder="AAAAA1234A"
                      className={getInputClass("ngoPan")}
                      onChange={(e) => {
                        // Simple uppercase enforcement
                        e.target.value = e.target.value.toUpperCase();
                        handleChange(e);
                      }}
                      value={formData.ngoPan} // NOTE: reusing ngoPan state key for text input
                      maxLength={10}
                      required
                    />
                  </div>
                  {fieldErrors.ngoPan && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.ngoPan}</span>
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Type of NGO</span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="category" className={fieldErrors.ngoType ? "text-red-500" : ""} />
                    </div>
                    <select
                      name="ngoType"
                      className={`${getInputClass("ngoType")} appearance-none pr-10`}
                      onChange={handleChange}
                      value={formData.ngoType}
                    >
                      <option value="trust">Trust</option>
                      <option value="society">Society</option>
                      <option value="section8">Section 8 Company</option>
                      <option value="international">International NGO</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 inset-y-0 my-auto text-gray-500 dark:text-gray-400 material-symbols-outlined">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* --- Merged Location, Contact & Operational Details --- */}

                {/* Contact Details (Moved Here) */}
                {/* Official Phone */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Official Phone Number <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white min-w-[85px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 36 27"
                          className="w-5 h-4"
                        >
                          <rect width="36" height="9" fill="#FF9933" />
                          <rect width="36" height="9" y="9" fill="#FFFFFF" />
                          <rect width="36" height="9" y="18" fill="#138808" />
                          <circle cx="18" cy="13.5" r="3.6" fill="#000080" />
                          <circle cx="18" cy="13.5" r="3.2" fill="#FFFFFF" />
                          <circle cx="18" cy="13.5" r="0.8" fill="#000080" />
                          <g fill="#000080">
                            {[...Array(24)].map((_, i) => {
                              const angle = ((i * 15 - 90) * Math.PI) / 180;
                              const x1 = 18 + 1.2 * Math.cos(angle);
                              const y1 = 13.5 + 1.2 * Math.sin(angle);
                              const x2 = 18 + 2.8 * Math.cos(angle);
                              const y2 = 13.5 + 2.8 * Math.sin(angle);
                              return (
                                <line
                                  key={i}
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke="#000080"
                                  strokeWidth="0.3"
                                />
                              );
                            })}
                          </g>
                        </svg>
                        <span>+91</span>
                      </div>
                      <div className="relative flex-1">
                        <div className={iconWrapperClass}>
                          <MaterialIcon name="call" className={fieldErrors.officialPhone ? "text-red-500" : ""} />
                        </div>
                        <input
                          type="tel"
                          name="officialPhone"
                          placeholder="e.g. 9876543210"
                          className={getInputClass("officialPhone")}
                          onChange={handleChange}
                          value={formData.officialPhone}
                          required
                        />
                      </div>
                    </div>
                    {fieldErrors.officialPhone && (
                      <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{fieldErrors.officialPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Email */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Official Email ID <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="mail" className={fieldErrors.officialEmail ? "text-red-500" : ""} />
                    </div>
                    <input
                      ref={officialEmailRef}
                      type="email"
                      name="officialEmail"
                      placeholder="official@ngo.org"
                      className={getInputClass("officialEmail")}
                      onChange={handleChange}
                      value={formData.officialEmail}
                      required
                    />
                  </div>
                  {fieldErrors.officialEmail && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.officialEmail}</span>
                    </div>
                  )}
                </div>

                {/* Website */}
                <div className="sm:col-span-2">
                  <span className={labelClass + " dark:text-gray-300"}>Website (if any)</span>
                  <div className="relative">
                    <div className={iconWrapperClass}><MaterialIcon name="language" className={fieldErrors.websiteUrl ? "text-red-500" : ""} /></div>
                    <input type="url" name="websiteUrl" placeholder="https://www.your-ngo.org" className={getInputClass("websiteUrl")} onChange={handleChange} value={formData.websiteUrl} />
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-gray-100 my-2"></div>

                {/* Map & Search (Moved from Operational) */}
                <div className="sm:col-span-2 space-y-3 pt-4 border-t border-gray-100 mt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <MaterialIcon name="pin_drop" />
                      <span>Pinpoint your NGO's location</span>
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
                        className={getInputClass("searchQuery")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleSearch())
                        }
                      />
                      {searchResults.length > 0 && (
                        <ul className="absolute z-[1000] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <li
                              key={index}
                              onClick={() => selectSearchResult(result)}
                              className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-50 dark:border-gray-700 flex items-start gap-2 text-gray-900 dark:text-gray-100"
                            >
                              <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">
                                location_on
                              </span>
                              <span className="text-gray-900 dark:text-gray-100">{result.display_name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="rounded-xl bg-[#11676a] text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0f5557]"
                    >
                      Search
                    </button>
                  </div>

                  {/* Leaflet Map */}
                  <div className="w-full h-[250px] mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative z-0">
                    <MapContainer
                      center={position}
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
                      <MapClickHandler />
                      {/* Map "Locate Me" Button Overlay */}
                      <div className="absolute bottom-2 right-2 z-[1000]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCurrentLocation();
                          }}
                          className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                          title="Use Current Location"
                        >
                          <span className="material-symbols-outlined text-xl">
                            my_location
                          </span>
                        </button>
                      </div>
                    </MapContainer>
                  </div>
                </div>

                {/* Latitude & Longitude (Read-only) */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Latitude
                    </label>
                    <div className="relative">
                      <div className={iconWrapperClass}>
                        <MaterialIcon name="my_location" />
                      </div>
                      <input
                        type="text"
                        value={position.lat}
                        readOnly
                        className={`${inputClass} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Longitude
                    </label>
                    <div className="relative">
                      <div className={iconWrapperClass}>
                        <MaterialIcon name="my_location" />
                      </div>
                      <input
                        type="text"
                        value={position.lng}
                        readOnly
                        className={`${inputClass} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Fields */}
                <div className="sm:col-span-2">
                  <span className={labelClass + " dark:text-gray-300"}>Official Address <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="location_on" className={fieldErrors.officeAddress ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="officeAddress"
                      placeholder="Street Address, Area"
                      className={getInputClass("officeAddress")}
                      onChange={handleChange}
                      value={formData.officeAddress}
                      required
                    />
                  </div>
                  {fieldErrors.officeAddress && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.officeAddress}</span>
                    </div>
                  )}
                </div>

                {/* City/State/Pin */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>City <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="location_city" className={fieldErrors.city ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      className={getInputClass("city")}
                      onChange={handleChange}
                      value={formData.city}
                      required
                    />
                  </div>
                  {fieldErrors.city && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.city}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>
                    State / Province <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    {/* Globe icon on the left */}
                    <div className={iconWrapperClass}>
                      <MaterialIcon
                        name="public"
                        className={fieldErrors.state ? "text-red-500" : ""}
                      />
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
                          paddingLeft: "2.75rem",
                          borderRadius: "0.75rem",
                          borderColor: fieldErrors.state
                            ? "#ef4444"
                            : state.isFocused
                              ? "#11676a"
                              : isDarkMode
                                ? "#4b5563"
                                : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(17,103,106,0.4)"
                            : "0 1px 2px rgba(0,0,0,0.05)",
                          backgroundColor: isDarkMode ? "#374151" : "#ffffff",
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
                          color: isDarkMode ? "#e5e7eb" : "#111827",
                        }),

                        placeholder: (base) => ({
                          ...base,
                          color: "#9ca3af",
                          fontSize: "0.875rem",
                        }),

                        singleValue: (base) => ({
                          ...base,
                          color: isDarkMode ? "#e5e7eb" : "#111827",
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
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          border: isDarkMode ? "1px solid #374151" : "none",
                        }),

                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isFocused
                            ? isDarkMode
                              ? "#374151"
                              : "#f0fdf9"
                            : "transparent",
                          color: isDarkMode
                            ? state.isFocused ? "#ffffff" : "#d1d5db"
                            : "#374151",
                          "&:active": {
                            backgroundColor: "#11676a",
                            color: "#ffffff",
                          },
                        }),
                      }}
                    />

                  </div>
                </div>
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Pincode <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="local_post_office" className={fieldErrors.pincode ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      className={getInputClass("pincode")}
                      onChange={handleChange}
                      value={formData.pincode}
                      maxLength={6}
                      required
                    />
                  </div>
                  {fieldErrors.pincode && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.pincode}</span>
                    </div>
                  )}
                </div>
                {/* Country */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Country</span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="public" />
                    </div>
                    <input
                      type="text"
                      name="country"
                      value={formData.country || "India"}
                      className={`${getInputClass("country")} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                      readOnly
                    />
                  </div>
                </div>

                {/* Contact Details (Moved Here) */}



                {/* Languages Multi-Select */}
                <div className="sm:col-span-2">
                  <span className={labelClass + " dark:text-gray-300"}>
                    Languages Spoken within Organization
                  </span>
                  <Select
                    isMulti
                    options={languageOptions}
                    value={formData.languages}
                    onChange={(selected) =>
                      setFormData((prev) => ({ ...prev, languages: selected || [] }))
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Select languages..."
                    styles={{
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                        backgroundColor: isDarkMode ? "#1f2937" : "white",
                        border: isDarkMode ? "1px solid #374151" : "none",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused
                          ? isDarkMode
                            ? "#374151"
                            : "#ecfdf5"
                          : "transparent",
                        color: isDarkMode
                          ? state.isFocused ? "white" : "#d1d5db"
                          : "black",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: isDarkMode ? "white" : "black",
                      }),
                      control: (base, state) => ({
                        ...base,
                        minHeight: "48px",
                        borderRadius: "0.75rem",
                        borderColor: state.isFocused ? "#11676a" : isDarkMode ? "#4b5563" : "#e5e7eb",
                        backgroundColor: isDarkMode ? "#374151" : "white",
                        boxShadow: state.isFocused ? "0 0 0 2px rgba(17,103,106,0.4)" : "0 1px 2px rgba(0,0,0,0.05)",
                        "&:hover": { borderColor: "#11676a" },
                      }),
                      input: (base) => ({
                        ...base,
                        color: isDarkMode ? "#e5e7eb" : "#111827",
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: isDarkMode ? "#0f5557" : "#ecfdf5",
                        borderRadius: "0.375rem",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: isDarkMode ? "#ccfbf1" : "#065f46",
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: isDarkMode ? "#ccfbf1" : "#065f46",
                        "&:hover": { backgroundColor: isDarkMode ? "#11676a" : "#d1fae5", color: isDarkMode ? "white" : "#047857" },
                      }),
                    }}
                  />
                </div>

                {/* Areas of Work */}
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <span className={labelClass + " dark:text-gray-300"}>Areas of Work (Multi-select) <span className="text-red-500">*</span></span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {Areas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleAreaChange(area)}
                        className={`h-9 sm:h-10 text-[0.7rem] sm:text-xs font-medium rounded-full border px-2 sm:px-3 transition duration-200 ${formData.areasOfWork.includes(area)
                          ? "bg-primary text-white border-primary shadow-md dark:bg-teal-600 dark:border-teal-500"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.areasOfWork && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.areasOfWork}</span>
                    </p>
                  )}
                </div>
              </div>
            </section>



            {/* 2. Authorized Person Details */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="person" className="text-primary!" />
                  <span>Authorized Person Details</span>
                </h2>
                <p className={sectionSubtitleClass}>Single person (Coordinator/Officer).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Full Name */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Full Name <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}><MaterialIcon name="person" className={fieldErrors.repName ? "text-red-500" : ""} /></div>
                    <input ref={repNameRef} type="text" name="repName" placeholder="Full Name" className={getInputClass("repName")} onChange={handleChange} value={formData.repName} required />
                  </div>
                  {fieldErrors.repName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repName}</span>
                    </div>
                  )}
                </div>
                {/* Designation */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Designation <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}><MaterialIcon name="badge" className={fieldErrors.repRole ? "text-red-500" : ""} /></div>
                    <input ref={repRoleRef} type="text" name="repRole" placeholder="e.g. Project Coordinator" className={getInputClass("repRole")} onChange={handleChange} value={formData.repRole} required />
                  </div>
                  {fieldErrors.repRole && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repRole}</span>
                    </div>
                  )}
                </div>
                {/* Mobile Number */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Mobile Number <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 min-w-[85px]">
                        {/* Flag SVG */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 36 27"
                          className="w-5 h-4"
                        >
                          <rect width="36" height="9" fill="#FF9933" />
                          <rect width="36" height="9" y="9" fill="#FFFFFF" />
                          <rect width="36" height="9" y="18" fill="#138808" />
                          <circle cx="18" cy="13.5" r="3.6" fill="#000080" />
                          <circle cx="18" cy="13.5" r="3.2" fill="#FFFFFF" />
                          <circle cx="18" cy="13.5" r="0.8" fill="#000080" />
                          <g fill="#000080">
                            {[...Array(24)].map((_, i) => {
                              const angle = ((i * 15 - 90) * Math.PI) / 180;
                              const x1 = 18 + 1.2 * Math.cos(angle);
                              const y1 = 13.5 + 1.2 * Math.sin(angle);
                              const x2 = 18 + 2.8 * Math.cos(angle);
                              const y2 = 13.5 + 2.8 * Math.sin(angle);
                              return (
                                <line
                                  key={i}
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke="#000080"
                                  strokeWidth="0.3"
                                />
                              );
                            })}
                          </g>
                        </svg>
                        <span>+91</span>
                      </div>
                      <div className="relative flex-1">
                        <div className={iconWrapperClass}>
                          <MaterialIcon name="phone_iphone" className={fieldErrors.repPhone ? "text-red-500" : ""} />
                        </div>
                        <input
                          ref={repPhoneRef}
                          type="tel"
                          name="repPhone"
                          placeholder="9876543210"
                          className={getInputClass("repPhone")}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 10) {
                              handleChange({
                                target: { name: "repPhone", value }
                              });
                            }
                          }}
                          value={formData.repPhone}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                    {fieldErrors.repPhone && (
                      <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <span>{fieldErrors.repPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Email ID */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>Email ID <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className={iconWrapperClass}><MaterialIcon name="email" className={fieldErrors.repEmail ? "text-red-500" : ""} /></div>
                    <input ref={repEmailRef} type="email" name="repEmail" placeholder="representative@email.com" className={getInputClass("repEmail")} onChange={handleChange} value={formData.repEmail} required />
                  </div>
                  {fieldErrors.repEmail && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repEmail}</span>
                    </div>
                  )}
                </div>
                {/* Date of Birth */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>
                    Date of Birth <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="calendar_month" className={fieldErrors.repDob ? "text-red-500" : ""} />
                    </div>
                    <input
                      ref={repDobRef}
                      type="date"
                      name="repDob"
                      className={getInputClass("repDob")}
                      onChange={handleChange}
                      value={formData.repDob}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  {fieldErrors.repDob && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repDob}</span>
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>
                    Gender <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="wc" className={fieldErrors.repGender ? "text-red-500" : ""} />
                    </div>
                    <select
                      ref={repGenderRef}
                      name="repGender"
                      className={`${getInputClass("repGender")} appearance-none pr-10`}
                      onChange={handleChange}
                      value={formData.repGender}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 inset-y-0 my-auto text-gray-500 dark:text-gray-400 material-symbols-outlined">
                      expand_more
                    </span>
                  </div>
                  {fieldErrors.repGender && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repGender}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Supporting Documents */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="description" className="text-primary!" />
                  <span>Supporting Documents</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Upload necessary documents for verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Registration Certificate */}
                <div>
                  <label className={labelClass + " dark:text-gray-300"}>Registration Certificate <span className="text-red-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center cursor-pointer ${fieldErrors.regCertificate ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                    {formData.regCertificate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile("regCertificate");
                        }}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-600"
                      >
                        <MaterialIcon name="delete" className="text-lg" />
                      </button>
                    )}
                    <input
                      type="file"
                      name="regCertificate"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      onClick={(e) => (e.target.value = null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <MaterialIcon name={formData.regCertificate ? "description" : "upload_file"} className={fieldErrors.regCertificate ? "text-red-500" : "text-gray-400"} />
                      <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                        {formData.regCertificate ? formData.regCertificate.name : "Click to upload Certificate"}
                      </span>
                      <span className="text-xs text-gray-400">PDF, JPG or PNG (Max 5MB)</span>
                    </div>
                  </div>
                  {fieldErrors.regCertificate && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.regCertificate}</span>
                    </div>
                  )}
                </div>

                {/* Darpan Certificate */}
                <div>
                  <label className={labelClass + " dark:text-gray-300"}>NGO Darpan Certificate (if applicable)</label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center cursor-pointer ${fieldErrors.darpanCertificate ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                    {formData.darpanCertificate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile("darpanCertificate");
                        }}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-600"
                      >
                        <MaterialIcon name="delete" className="text-lg" />
                      </button>
                    )}
                    <input
                      type="file"
                      name="darpanCertificate"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      onClick={(e) => (e.target.value = null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <MaterialIcon name={formData.darpanCertificate ? "description" : "upload_file"} className={fieldErrors.darpanCertificate ? "text-red-500" : "text-gray-400"} />
                      <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                        {formData.darpanCertificate ? formData.darpanCertificate.name : "Click to upload Darpan Cert"}
                      </span>
                      <span className="text-xs text-gray-400">PDF, JPG or PNG (Max 5MB)</span>
                    </div>
                  </div>
                  {fieldErrors.darpanCertificate && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.darpanCertificate}</span>
                    </div>
                  )}
                </div>

                {/* NGO PAN Card */}
                <div>
                  <label className={labelClass + " dark:text-gray-300"}>NGO PAN Card <span className="text-red-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center cursor-pointer ${fieldErrors.panCardFile ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                    {formData.panCardFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile("panCardFile");
                        }}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-600"
                      >
                        <MaterialIcon name="delete" className="text-lg" />
                      </button>
                    )}
                    <input
                      type="file"
                      name="panCardFile"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      onClick={(e) => (e.target.value = null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <MaterialIcon name={formData.panCardFile ? "description" : "upload_file"} className={fieldErrors.panCardFile ? "text-red-500" : "text-gray-400"} />
                      <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                        {formData.panCardFile ? formData.panCardFile.name : "Click to upload PAN Card"}
                      </span>
                      <span className="text-xs text-gray-400">PDF, JPG or PNG (Max 5MB)</span>
                    </div>
                  </div>
                  {fieldErrors.panCardFile && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.panCardFile}</span>
                    </div>
                  )}
                </div>

                {/* Representative ID Proof */}
                <div>
                  <label className={labelClass + " dark:text-gray-300"}>Authorized Person's ID Proof <span className="text-red-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center cursor-pointer ${fieldErrors.repIdProof ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600"}`}>
                    {formData.repIdProof && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile("repIdProof");
                        }}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-600"
                      >
                        <MaterialIcon name="delete" className="text-lg" />
                      </button>
                    )}
                    <input
                      type="file"
                      name="repIdProof"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      onClick={(e) => (e.target.value = null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <MaterialIcon name={formData.repIdProof ? "description" : "upload_file"} className={fieldErrors.repIdProof ? "text-red-500" : "text-gray-400"} />
                      <span className="text-sm text-gray-600 font-medium truncate max-w-full px-2">
                        {formData.repIdProof ? formData.repIdProof.name : "Click to upload ID Proof"}
                      </span>
                      <span className="text-xs text-gray-400">PDF, JPG or PNG (Max 5MB)</span>
                    </div>
                  </div>
                  {fieldErrors.repIdProof && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.repIdProof}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Legal Aid Commitment */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="balance" className="text-primary!" />
                  <span>Legal Aid Commitment</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Share how your NGO plans to collaborate on pro bono matters.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-3 py-3">
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                  Are you willing to coordinate pro bono legal cases through
                  your NGO?
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="proBonoCommitment"
                    checked={formData.proBonoCommitment}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full transition-colors peer-checked:bg-primary">
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.proBonoCommitment ? "translate-x-5" : ""
                        }`}
                    />
                  </div>
                  <span className="ml-2 text-xs sm:text-sm font-medium text-slate-700">
                    {formData.proBonoCommitment ? "Yes" : "No"}
                  </span>
                </label>
              </div>

              {formData.proBonoCommitment && (
                <div>
                  <span className={labelClass + " dark:text-gray-300"}>
                    Maximum number of monthly pro-bono cases
                  </span>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="analytics" className={fieldErrors.maxProBonoCases ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="number"
                      name="maxProBonoCases"
                      placeholder="e.g., 5"
                      min="1"
                      className={getInputClass("maxProBonoCases")}
                      onChange={handleChange}
                      value={formData.maxProBonoCases}
                      required
                    />
                  </div>
                </div>
              )}
            </section>





            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="security" className="text-primary!" />
                  <span>Security</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Protect your NGO partner dashboard with a secure password.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Password */}
                {!preRegToken ? (
                  <>
                    <div>
                      <span className={labelClass + " dark:text-gray-300"}>
                        Password <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <div className={iconWrapperClass}>
                          <MaterialIcon name="lock" className={fieldErrors.password ? "text-red-500" : ""} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Create Password (8–20 characters)"
                          className={`${getInputClass("password")} pr-14`}
                          value={formData.password}
                          onChange={handleChange}
                          minLength={8}
                          maxLength={20}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <span className="material-symbols-outlined">
                            {showPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>

                      {fieldErrors.password && (
                        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            error_outline
                          </span>
                          <span>{fieldErrors.password}</span>
                        </div>
                      )}

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              Password strength:
                            </span>
                            <span
                              className={`text-xs font-medium ${passwordStrength.score <= 2
                                ? "text-red-600"
                                : passwordStrength.score <= 4
                                  ? "text-yellow-600"
                                  : passwordStrength.score <= 5
                                    ? "text-blue-600"
                                    : "text-green-600"
                                }`}
                            >
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                              style={{
                                width: `${(passwordStrength.score / 6) * 100}%`,
                              }}
                            />
                          </div>

                          {passwordStrength.feedback.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600 mb-1">
                                To strengthen your password:
                              </p>
                              <ul className="text-xs text-gray-500 space-y-0.5">
                                {passwordStrength.feedback.map((item, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">
                                      arrow_right
                                    </span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Password must be 8–20 characters and include uppercase, lowercase,
                        number, and special character.
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <span className={labelClass + " dark:text-gray-300"}>
                        Confirm Password <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <div className={iconWrapperClass}>
                          <MaterialIcon name="lock_reset" className={fieldErrors.confirmPassword ? "text-red-500" : ""} />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          className={`${getInputClass("confirmPassword")} pr-14`}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          minLength={8}
                          maxLength={20}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <span className="material-symbols-outlined">
                            {showConfirmPassword ? "visibility" : "visibility_off"}
                          </span>
                        </button>
                      </div>

                      {fieldErrors.confirmPassword && (
                        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            error_outline
                          </span>
                          <span>{fieldErrors.confirmPassword}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="col-span-1 sm:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Note:</span> You are registering via Google. No password is required.
                    </p>
                  </div>
                )}
              </div>
            </section>


            {/* Submit + Login */}
            <section className="pt-1 pb-1 border-t border-gray-100 space-y-3 sm:space-y-4">
              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-px w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  required
                />
                <label
                  htmlFor="terms-checkbox"
                  className="text-xs sm:text-sm text-gray-600 leading-relaxed"
                >
                  I certify that all information provided above is accurate and
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:underline font-medium"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-primary hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>{" "}
                  of Jurify.
                </label>
              </div>

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="w-full rounded-xl sm:rounded-2xl bg-primary text-white py-3 sm:py-3.5 text-sm sm:text-base font-semibold shadow-md hover:bg-primary/90 transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2"
                disabled={!isAgreed || isSubmitting}
              >

                <>
                  <span className="material-symbols-outlined text-lg">
                    handshake
                  </span>
                  Register NGO
                </>
              </button>

              {/* Register Buttons */}
              <div className="flex justify-center gap-3 mb-4">
                <Link
                  to="/register-citizen"
                  className="h-12 px-6 bg-white text-primary border-primary text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[#11676a]">
                    person
                  </span>
                  {/* Register as Citizen */}
                </Link>

                <Link
                  to="/register-lawyer"
                  className="h-12 px-6 bg-white text-primary border-primary text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">gavel</span>
                  {/* Register as Lawyer */}
                </Link>
              </div>

              <p className="text-center text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Login here
                </Link>
              </p>
            </section>
          </form>

          {/* Loading/Success Overlay */}
          {/* Success Overlay */}
          {isSuccess && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 rounded-2xl sm:rounded-3xl flex items-center justify-center p-6">
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-blue-600 animate-pulse">
                    mark_email_unread
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Verify Your Email
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm sm:text-base mb-4">
                  We've sent a verification link to your email.
                </p>
                <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-sm animate-pulse mb-4">
                  Waiting for you to verify...
                </div>
                <p className="text-xs text-gray-400">
                  Keep this tab open. We'll automatically log you in once
                  verified.
                </p>
              </div>
            </div>
          )}
          <style jsx="true">{`
            .custom-scroll::-webkit-scrollbar {
              width: 4px;
            }
            @media (min-width: 640px) {
              .custom-scroll::-webkit-scrollbar {
                width: 6px;
              }
            }
            @media (min-width: 1024px) {
              .custom-scroll::-webkit-scrollbar {
                width: 8px;
              }
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: transparent;
              margin: 8px 0;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.5);
              border-radius: 999px;
              transition: background 0.2s ease;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(148, 163, 184, 0.9);
            }
            .custom-scroll::-webkit-scrollbar-thumb:active {
              background: rgba(102, 146, 163, 0.9);
            }

            /* Firefox scrollbar */
            .custom-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
            }

            /* Smooth scrolling */
            .custom-scroll {
              scroll-behavior: smooth;
            }
          `}</style>
        </div>
      </div>
      <AuthDarkModeToggle />
    </div >
  );
}
