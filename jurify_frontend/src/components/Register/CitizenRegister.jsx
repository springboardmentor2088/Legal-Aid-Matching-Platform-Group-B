import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

// Fix for default Leaflet marker icons in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const center = { lat: 20.5937, lng: 78.9629 }; // Default: India

// States to be appear in dropdown




export default function CitizenRegister() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    countryCode: "+91",
    gender: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    dateOfBirth: "",
    country: "India",
    latitude: null,
    longitude: null,
  });

  const [position, setPosition] = useState(center);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);



  // --- Leaflet Components ---
  const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
  };



  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition({ lat, lng });
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

  // --- Geocoding & Search ---

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        location: "Please enter a location to search",
      }));
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    setFieldErrors((prev) => ({ ...prev, location: "" }));

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
        setFieldErrors((prev) => ({
          ...prev,
          location: "Location not found. Please try a different search term.",
        }));
      }
    } catch (error) {
      setFieldErrors((prev) => ({
        ...prev,
        location: "Unable to search location. Please check your connection.",
      }));
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
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setFieldErrors((prev) => ({ ...prev, location: "" }));
  };

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    location: "",
    idProof: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });
  const [files, setFiles] = useState({
    idProof: null,
    profilePhoto: null,
  });

  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pollingToken, setPollingToken] = useState(null);
  const { register, login, syncUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");

    // Real-time validation
    if (name === "firstName") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          firstName: "First name is required",
        }));
      } else if (value.trim().length < 2) {
        setFieldErrors((prev) => ({
          ...prev,
          firstName: "First name must be at least 2 characters",
        }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          firstName: "First name should only contain letters",
        }));
      }
    }

    if (name === "lastName") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          lastName: "Last name is required",
        }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          lastName: "Last name should only contain letters",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, lastName: "" }));
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, email: "Email is required" }));
      } else if (!emailRegex.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      }
    }

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

    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      }
    }

    if (name === "phoneNumber") {
      const phoneValidation = validatePhoneNumber(value);
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: phoneValidation.isValid ? "" : phoneValidation.message,
      }));
    }

    if (name === "dateOfBirth") {
      const dobValidation = validateDateOfBirth(value);
      setFieldErrors((prev) => ({
        ...prev,
        dateOfBirth: dobValidation.isValid ? "" : dobValidation.message,
      }));
    }

    if (name === "addressLine1") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          addressLine1: "Street address is required",
        }));
      } else if (value.trim().length < 5) {
        setFieldErrors((prev) => ({
          ...prev,
          addressLine1: "Please enter a complete address",
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

    if (name === "state") {
      const filtered = indianStates.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);

      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, state: "State is required" }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          state: "State should only contain letters",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, state: "" }));
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

    if (name === "countryCode") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formData.phoneNumber) {
        const phoneValidation = validatePhoneNumber(
          formData.phoneNumber,
          value
        );
        setFieldErrors((prev) => ({
          ...prev,
          phoneNumber: phoneValidation.isValid ? "" : phoneValidation.message,
        }));
      }
      return;
    }
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

    // Strip '91' prefix if present
    if (local.length === 12 && local.startsWith("91")) {
      local = local.slice(2);
    }

    // Now local must be exactly 10 digits and start with 6-9
    const indianRegex = /^[6-9]\d{9}$/;

    if (!indianRegex.test(local)) {
      return {
        isValid: false,
        message: "Please enter a valid 10-digit Indian mobile number starting with 6–9.",
      };
    }

    return { isValid: true, message: "" };
  };

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) {
      return {
        isValid: false,
        message: "Date of birth is required",
      };
    }

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const minAge = 0;

    // Calculate age
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Check if date is in future
    if (dob > today) {
      return {
        isValid: false,
        message: "Date of birth cannot be in the future",
      };
    }

    // Check minimum age requirement
    if (age < minAge) {
      return {
        isValid: false,
        message: `You must be at least ${minAge} years old to register`,
      };
    }

    // Check reasonable maximum age (e.g., 120 years)
    if (age > 120) {
      return {
        isValid: false,
        message: "Please enter a valid date of birth",
      };
    }

    return {
      isValid: true,
      message: "",
    };
  };

  const handleRemoveFile = (field) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    setFieldErrors((prev) => ({ ...prev, idProof: "" }));
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFieldErrors((prev) => ({
        ...prev,
        location: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      location: "Getting your location...",
    }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        setFieldErrors((prev) => ({ ...prev, location: "" }));
      },
      (error) => {
        let errorMessage = "Unable to get your current location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out.";
        }
        setFieldErrors((prev) => ({ ...prev, location: errorMessage }));
      },
      { timeout: 10000 }
    );
  };

  const handleFileUpload = (e, field) => {
    try {
      const file = e.target.files[0];

      if (!file) {
        setFieldErrors((prev) => ({
          ...prev,
          idProof: "Please select a file",
        }));
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          idProof: "Please upload a valid file type (JPEG, PNG, or PDF)",
        }));
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setFieldErrors((prev) => ({
          ...prev,
          idProof: "File size should not exceed 5MB",
        }));
        return;
      }

      setFiles((prev) => ({ ...prev, [field]: file }));
      setFieldErrors((prev) => ({ ...prev, idProof: "" }));
      setError("");
    } catch (error) {
      setFieldErrors((prev) => ({
        ...prev,
        idProof: "An error occurred while uploading the file",
      }));
    }
  };

  const validateAllFields = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      errors.firstName = "First name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.firstName))
      errors.firstName = "First name should only contain letters";

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      errors.lastName = "Last name should only contain letters";
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      errors.email = "Please enter a valid email address";

    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) errors.phoneNumber = phoneValidation.message;

    const dobValidation = validateDateOfBirth(formData.dateOfBirth);
    if (!dobValidation.isValid) errors.dateOfBirth = dobValidation.message;

    if (!formData.gender) errors.gender = "Please select your gender";

    if (!formData.password) errors.password = "Password is required";
    else if (passwordStrength.score < 6)
      errors.password = "Password does not meet all requirements";

    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (!formData.addressLine1.trim())
      errors.addressLine1 = "Street address is required";
    else if (formData.addressLine1.trim().length < 5)
      errors.addressLine1 = "Please enter a complete address";

    if (!formData.city.trim()) errors.city = "City is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.city))
      errors.city = "City should only contain letters";

    if (!formData.state.trim()) errors.state = "State is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.state))
      errors.state = "State should only contain letters";

    if (!formData.pincode.trim()) errors.pincode = "Postal code is required";
    else if (!/^[0-9]{4,10}$/.test(formData.pincode))
      errors.pincode = "Please enter a valid postal code";

    if (!files.idProof) errors.idProof = "ID proof is required";

    if (!formData.latitude || !formData.longitude) {
      errors.location = "Please select your location on the map";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllFields()) {
      setError("Please fix all errors before submitting");

      // Scroll to first error
      const firstErrorField = Object.keys(fieldErrors).find(
        (key) => fieldErrors[key]
      );
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    if (!isAgreed) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    setError("");

    // Construct FormData for multipart/form-data request
    const formDataToSend = new FormData();
    formDataToSend.append("role", "citizen");

    // Append JSON data as a Blob part named 'data'
    const jsonPayload = { ...formData, role: "citizen" };
    formDataToSend.append(
      "data",
      new Blob([JSON.stringify(jsonPayload)], { type: "application/json" })
    );

    // Append file if exists
    if (files.idProof) {
      formDataToSend.append("file", files.idProof);
    }

    setIsSubmitting(true); // Start loading

    try {
      const result = await register(formDataToSend);

      if (result.success) {
        setIsSuccess(true);
        if (result.pollingToken) {
          setPollingToken(result.pollingToken);
        }
      } else {
        setError(result.error || "Registration failed");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
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
            const data = await response.json();

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            // Critical: Store full user object for authService/AuthContext
            const userObj = {
              id: data.userId,
              email: data.email,
              role: data.role,
              firstName: data.firstName,
              lastName: data.lastName,
              isEmailVerified: data.isEmailVerified,
            };
            localStorage.setItem("user", JSON.stringify(userObj));

            // Legacy individual items
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userId", data.userId);
            window.dispatchEvent(new Event("storage"));

            syncUser(); // Update AuthContext state, triggers PublicRoute redirect

            clearInterval(intervalId);

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
      "w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border text-sm " +
      "focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400";


    if (fieldErrors[fieldName]) {
      return `${baseClass} border-red-300 bg-red-50 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300`;
    }

    return `${baseClass} border-gray-200 bg-white shadow-sm focus:ring-[#11676a]/40 focus:border-[#11676a]`;
  };



  const iconWrapperClass =
    "absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 pointer-events-none text-gray-400";

  const sectionCardClass =
    "rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 shadow-sm";

  const sectionTitleClass =
    "flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 mb-1";

  const sectionSubtitleClass = "text-xs text-gray-500";

  const MaterialIcon = ({ name, className = "" }) => (
    <span
      className={`material-symbols-outlined text-lg sm:text-xl text-gray-500 ${className}`}
    >
      {name}
    </span>
  );

  const genderButtonBase =
    "rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border transition duration-200 px-3 sm:px-4 py-2";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-6xl w-full grid lg:grid-cols-[1fr_1.5fr] gap-6 sm:gap-8 lg:gap-10 items-stretch">
        {/* Left Panel - Hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0a4d68] via-[#11676a] to-[#2c3e50] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-black/15 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  gavel
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-50/90">
                  Jurify for Citizens
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold mt-1">
                  Get Trusted Pro Bono Legal Help
                </h1>
              </div>
            </div>

            <p className="text-sm text-teal-50/95 leading-relaxed">
              Create your Jurify citizen account to access verified lawyers who
              offer pro bono legal support. Share your legal concerns securely
              and receive guidance without worrying about fees.
            </p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Citizens Served
                </p>
                <p className="text-xl font-semibold mt-1">20,000+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Cities Covered
                </p>
                <p className="text-xl font-semibold mt-1">150+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Avg. Response Time
                </p>
                <p className="text-xl font-semibold mt-1 flex items-center gap-1">
                  &lt; 24h
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium text-teal-50">
                Why citizens trust Jurify
              </p>
              <ul className="space-y-2 text-xs text-teal-50/90">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>
                    All lawyers are verified with Bar Council details.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>
                    Simple intake form to describe your problem in your
                    language.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>
                    Private and secure communication, focused on your rights.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            <p className="text-[0.7rem] text-teal-50/90">
              "Jurify connected me to a lawyer who helped me understand my case
              without charging anything."
            </p>
            <p className="mt-2 text-xs font-semibold text-teal-50">
              — Registered Citizen
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg p-4 sm:p-6 lg:p-8">
          {/* Home Link */}
          <Link
            to="/"
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-primary transition-transform duration-200 hover:scale-110 z-10"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              home
            </span>
          </Link>

          {/* Header */}
          <header className="mb-5 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
            <div className="flex items-start gap-2.5 sm:gap-3 pr-8 sm:pr-10">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#11676a] text-white shadow-md shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-2xl">
                  account_circle
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                  Register as a Citizen
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-snug">
                  Create your Jurify account to request pro bono legal
                  assistance.
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-4 sm:mb-5 rounded-lg sm:rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-base sm:text-lg text-red-500 shrink-0">
                error
              </span>
              <span className="flex-1">{error}</span>
            </div>
          )}


          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] sm:max-h-[70vh] overflow-y-auto pr-1 custom-scroll"
          >
            {/* PERSONAL DETAILS */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="person" />
                  <span>Personal Details</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Tell us who you are so we can create your account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon
                        name="person"
                        className={fieldErrors.firstName ? "text-red-500" : ""}
                      />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="e.g. John"
                      className={getInputClass("firstName")}
                      onChange={handleChange}
                      value={formData.firstName}
                      required
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error_outline
                      </span>
                      {fieldErrors.firstName}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon
                        name="person"
                        className={fieldErrors.lastName ? "text-red-500" : ""}
                      />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="e.g. Doe"
                      className={getInputClass("lastName")}
                      onChange={handleChange}
                      value={formData.lastName}
                      required
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error_outline
                      </span>
                      {fieldErrors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon
                        name="mail"
                        className={fieldErrors.email ? "text-red-500" : ""}
                      />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. john@example.com"
                      className={getInputClass("email")}
                      onChange={handleChange}
                      value={formData.email}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error_outline
                      </span>
                      {fieldErrors.email}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 min-w-[85px]">
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
                        <MaterialIcon name="phone_iphone" className={fieldErrors.phoneNumber ? "text-red-500" : ""} />
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="e.g. 9876543210"
                        className={getInputClass("phoneNumber")}
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          // Allow only digits, max 10
                          const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          handleChange({ target: { name: "phoneNumber", value: onlyDigits } });
                        }}
                        maxLength={10}
                      />
                    </div>
                  </div>
                  {fieldErrors.phoneNumber && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="calendar_today" className={fieldErrors.dateOfBirth ? "text-red-500" : ""} />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className={getInputClass("dateOfBirth")}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {fieldErrors.dateOfBirth && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.dateOfBirth}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["MALE", "FEMALE", "OTHER"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, gender: g }))
                        }
                        className={
                          formData.gender === g
                            ? `${genderButtonBase} bg-primary text-white shadow-md border-primary`
                            : `${genderButtonBase} bg-white text-gray-700 hover:bg-gray-50 border-gray-200`
                        }
                      >
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  {fieldErrors.gender && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.gender}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ACCOUNT SECURITY */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="lock" />
                  <span>Account Security</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Create a strong password with uppercase, lowercase, numbers,
                  and special characters.
                </p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className={iconWrapperClass}>
                    <MaterialIcon name="lock" className={fieldErrors.password ? "text-red-500" : ""} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create strong password"
                    className={getInputClass("password")}
                    onChange={handleChange}
                    required
                    minLength="8"
                    maxLength="20"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer select-none text-lg sm:text-xl"
                  >
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">
                        Password Strength:
                      </span>
                      <span
                        className={`font-semibold ${passwordStrength.score <= 2
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

                    {/* Strength Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Requirements Checklist */}
                    {passwordStrength.feedback.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Password must include:
                        </p>
                        {passwordStrength.feedback.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-gray-600"
                          >
                            <span className="material-symbols-outlined text-sm text-red-500">
                              close
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                        {passwordStrength.score > 0 &&
                          passwordStrength.score < 6 && (
                            <>
                              {formData.password.length >= 8 &&
                                formData.password.length <= 128 && (
                                  <div className="flex items-center gap-2 text-xs text-green-600">
                                    <span className="material-symbols-outlined text-sm">
                                      check_circle
                                    </span>
                                    <span>8-128 characters</span>
                                  </div>
                                )}
                              {/[A-Z]/.test(formData.password) && (
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <span className="material-symbols-outlined text-sm">
                                    check_circle
                                  </span>
                                  <span>Uppercase letter</span>
                                </div>
                              )}
                              {/[a-z]/.test(formData.password) && (
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <span className="material-symbols-outlined text-sm">
                                    check_circle
                                  </span>
                                  <span>Lowercase letter</span>
                                </div>
                              )}
                              {/[0-9]/.test(formData.password) && (
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <span className="material-symbols-outlined text-sm">
                                    check_circle
                                  </span>
                                  <span>Number</span>
                                </div>
                              )}
                              {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                                formData.password
                              ) && (
                                  <div className="flex items-center gap-2 text-xs text-green-600">
                                    <span className="material-symbols-outlined text-sm">
                                      check_circle
                                    </span>
                                    <span>Special character</span>
                                  </div>
                                )}
                            </>
                          )}
                      </div>
                    )}

                    {/* Success Message */}
                    {passwordStrength.score === 6 && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <span className="material-symbols-outlined text-green-600 text-lg">
                          verified
                        </span>
                        <span className="text-xs text-green-700 font-medium">
                          Excellent! Your password is strong and secure.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className={iconWrapperClass}>
                    <MaterialIcon name="lock_reset" className={fieldErrors.confirmPassword ? "text-red-500" : ""} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repeat password"
                    className={getInputClass("confirmPassword")}
                    onChange={handleChange}
                    required
                    minLength="8"
                    maxLength="20"
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer select-none text-lg sm:text-xl"
                  >
                    {showConfirmPassword ? "visibility" : "visibility_off"}
                  </span>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <span className="material-symbols-outlined text-sm">
                          check_circle
                        </span>
                        <span>Passwords match</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <span className="material-symbols-outlined text-sm">
                          cancel
                        </span>
                        <span>Passwords do not match</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-[0.7rem] text-blue-800 space-y-1">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-base mt-px shrink-0">
                    shield
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium">Password Security Tips:</p>
                    <ul className="space-y-0.5 ml-1">
                      <li>• Use a unique password you don't use elsewhere</li>
                      <li>
                        • Avoid personal information like names or birthdates
                      </li>
                      <li>• Consider using a password manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATION / ADDRESS */}
            <section className={sectionCardClass}>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MaterialIcon name="pin_drop" />
                    <span>Address Details</span>
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
                      className={getInputClass("location")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleSearch())
                      }
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute z-[1000] w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
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
                    className="rounded-xl bg-[#11676a] text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0f5557]"
                  >
                    Search
                  </button>
                </div>

                {/* Leaflet Map */}
                <div className="w-full h-[250px] mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 relative z-0">
                  <MapContainer
                    center={center}
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
                        className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-700 transition-colors"
                        title="Use Current Location"
                      >
                        <span className="material-symbols-outlined text-xl">
                          my_location
                        </span>
                      </button>
                    </div>
                  </MapContainer>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address / Locality{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="apartment" className={fieldErrors.addressLine1 ? "text-red-500" : ""} />
                    </div>
                    <textarea
                      rows={3}
                      name="addressLine1"
                      placeholder="e.g. 123 Main St"
                      className={`${getInputClass("addressLine1")} resize-none py-2.5! sm:py-3! align-top`}
                      onChange={handleChange}
                      value={formData.addressLine1}
                      required
                    />
                  </div>


                  {fieldErrors.addressLine1 && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error_outline</span>
                      {fieldErrors.addressLine1}
                    </div>
                  )}
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
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
                        <span className="material-symbols-outlined text-sm">error_outline</span>
                        {fieldErrors.city}
                      </div>
                    )}

                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State / Province <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className={iconWrapperClass}>
                        <MaterialIcon name="public" className={fieldErrors.state ? "text-red-500" : ""} />
                      </div>
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        className={getInputClass("state")}
                        value={formData.state}
                        onChange={handleChange}
                        required
                        autoComplete="off"
                      />
                    </div>

                    {/* Error message */}
                    {fieldErrors.state && (
                      <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
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
                        <MaterialIcon name="local_post_office" className={fieldErrors.pincode ? "text-red-500" : ""} />
                      </div>
                      <input
                        type="text"
                        name="pincode"
                        placeholder="Pincode"
                        className={getInputClass("pincode")}
                        onChange={handleChange}
                        value={formData.pincode}
                        required
                      />
                    </div>
                    {fieldErrors.pincode && (
                      <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error_outline</span>
                        <span>{fieldErrors.pincode}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className={iconWrapperClass}>
                        <MaterialIcon name="flag" className={fieldErrors.country ? "text-red-500" : ""} />
                      </div>
                      <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        className={getInputClass("country")}
                        onChange={handleChange}
                        value={formData.country}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg sm:rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[0.7rem] text-sky-800 flex gap-2 items-start">
                <span className="material-symbols-outlined text-base mt-px shrink-0">
                  info
                </span>
                <p className="leading-relaxed">
                  Your address helps us suggest nearby verified lawyers. It will
                  not be shared publicly.
                </p>
              </div>

            </section>

            {/* DOCUMENT UPLOAD */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="upload_file" />
                  <span>Required Documents</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Please upload the following documents for verification
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  ID Proof (Aadhaar/Passport/Driving License){" "}
                  <span className="text-red-500">*</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-[#11676a] transition-all ${fieldErrors.idProof ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MaterialIcon name="upload_file" className="text-4xl text-gray-400" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Click to upload ID Proof</span><br />
                      <span className="text-xs text-gray-500">PDF, JPG or PNG (Max 5MB)</span>
                    </p>
                    {files.idProof && (
                      <p className="text-green-600 text-xs mt-2 truncate">
                        Selected: {files.idProof.name}
                      </p>
                    )}
                  </div>
                </div>


                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "idProof")}
                  required
                  ref={fileInputRef}
                  className="hidden"
                />

                {files.idProof && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile("idProof")}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      <span>Remove File</span>
                    </button>
                  </div>
                )}
                {fieldErrors.idProof && (
                  <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      error_outline
                    </span>
                    <span>{fieldErrors.idProof}</span>
                  </div>
                )}
              </div>
            </section>


            {/* SUBMIT */}
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
                className="w-full rounded-xl sm:rounded-2xl bg-primary text-white py-3 sm:py-3.5 text-sm sm:text-base font-semibold shadow-md hover:bg-primary/90 transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                disabled={!isAgreed || isSubmitting}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg sm:text-xl">
                    how_to_reg
                  </span>
                  <span className="hidden xs:inline">
                    {isSubmitting ? "Registering..." : "Create Citizen Account"}
                  </span>
                  <span className="xs:hidden">
                    {isSubmitting ? "Registering..." : "Register as Citizen"}
                  </span>
                </span>
              </button>
              {/* Global error message */}
              {error && (
                <div className="text-red-600 text-sm font-medium mt-2">{error}</div>
              )}


              {/* Register Buttons */}
              <div className="flex justify-center gap-3 mb-4">
                <Link
                  to="/register-lawyer"
                  className="h-12 px-6 bg-white text-primary border-primary text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">gavel</span>
                  {/* Register as Lawyer */}
                </Link>

                <Link
                  to="/register-ngo"
                  className="h-12 px-6 bg-white text-primary border-primary text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">volunteer_activism</span>
                  {/* Register as NGO */}
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
          {(isSubmitting || isSuccess) && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 rounded-2xl sm:rounded-3xl flex items-center justify-center p-6">
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                {isSuccess ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-3xl sm:text-4xl text-green-600 animate-bounce">
                        mail
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                      Verify Your Email
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm sm:text-base mb-4">
                      We've sent a verification link to your email. Please check
                      your inbox to activate your account.
                    </p>
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-sm animate-pulse mb-4">
                      Waiting for you to verify...
                    </div>
                    {/* fallback button */}
                    <button
                      type="button"
                      onClick={() => {
                        fetch(
                          "http://localhost:8080/api/auth/poll-verification",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ pollingToken }),
                          }
                        ).then(async (res) => {
                          if (res.ok) {
                            const data = await res.json();
                            localStorage.setItem(
                              "accessToken",
                              data.accessToken
                            );
                            localStorage.setItem(
                              "refreshToken",
                              data.refreshToken
                            );

                            const userObj = {
                              id: data.userId,
                              email: data.email,
                              role: data.role,
                              firstName: data.firstName,
                              lastName: data.lastName,
                              isEmailVerified: data.isEmailVerified,
                            };
                            localStorage.setItem(
                              "user",
                              JSON.stringify(userObj)
                            );

                            localStorage.setItem("userRole", data.role);
                            localStorage.setItem("userEmail", data.email);
                            localStorage.setItem("userId", data.userId);
                            window.dispatchEvent(new Event("storage"));

                            syncUser(); // Quick sync, PublicRoute will handle redirect


                          } else {
                            alert(
                              "Verification not detected yet. Please click the link in your email."
                            );
                          }
                        });
                      }}
                      className="text-primary hover:text-primary-dark underline text-sm mb-2"
                    >
                      I have verified my email
                    </button>

                    <p className="text-xs text-gray-400">
                      Keep this tab open. We'll automatically log you in once
                      verified.
                    </p>
                    <p className="text-[10px] text-gray-300 mt-2">
                      Token: {pollingToken || "None"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                      Creating Account
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Please wait while we process your details...
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div >
  );
}
