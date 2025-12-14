import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";
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

import Logo from "../common/Logo";
import LocationSelector from "../common/LocationSelector"; // Probably removable if we use inline map

const countryCodes = [{ code: "+91", country: "India", flag: "🇮🇳" }];

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

  // UTs
  { value: "Delhi", label: "Delhi" },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "Puducherry", label: "Puducherry" },
  {
    value: "Andaman and Nicobar Islands",
    label: "Andaman and Nicobar Islands",
  },
  {
    value: "Dadra and Nagar Haveli and Daman and Diu",
    label: "Dadra and Nagar Haveli and Daman and Diu",
  },
  { value: "Lakshadweep", label: "Lakshadweep" },
];

export default function LawyerRegistration() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    countryCode: "+91",
    barCouncilNumber: "",
    barCouncilState: "",
    enrollmentYear: "",
    lawFirmName: "",
    yearsOfExperience: 0,
    officeAddressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    bio: "",
    languages: "English",
    latitude: null,
    longitude: null,
    dateOfBirth: "",
    gender: "",
  });

  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    barCouncilNumber: "",
    barCouncilState: "",
    enrollmentYear: "",
    yearsOfExperience: "",
    officeAddressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    location: "",
    bio: "",
    languages: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });
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
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setFormData((prev) => ({ ...prev, latitude, longitude }));
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

  const getMaxDOBFor21Plus = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 21);
    return today.toISOString().split("T")[0];
  };

  const handleDOBChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: value,
    }));

    if (!value) {
      setFieldErrors((prev) => ({
        ...prev,
        dateOfBirth: "Date of birth is required",
      }));
      return;
    }

    const dob = new Date(value);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 21) {
      setFieldErrors((prev) => ({
        ...prev,
        dateOfBirth: "You must be at least 21 years old",
      }));
    } else {
      setFieldErrors((prev) => ({
        ...prev,
        dateOfBirth: "",
      }));
    }
  };

  // ✅ Enrollment Year handler
  const handleEnrollmentYearChange = (e) => {
    const value = e.target.value;
    const year = parseInt(value, 10);
    const currentYear = new Date().getFullYear();

    setFormData((prev) => {
      if (!value) {
        return {
          ...prev,
          enrollmentYear: "",
          yearsOfExperience: "",
        };
      }

      if (year > currentYear || year < 1950) {
        return {
          ...prev,
          enrollmentYear: value,
          yearsOfExperience: "",
        };
      }

      return {
        ...prev,
        enrollmentYear: value,
        yearsOfExperience: currentYear - year,
      };
    });

    setFieldErrors((prev) => ({
      ...prev,
      enrollmentYear: "",
      yearsOfExperience: "",
    }));
  };

  const genderButtonBase =
    "rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border transition duration-200 px-3 sm:px-4 py-2";

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
      } else if (value.trim().length < 2) {
        setFieldErrors((prev) => ({
          ...prev,
          lastName: "Last name must be at least 2 characters",
        }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          lastName: "Last name should only contain letters",
        }));
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

    if (name === "barCouncilNumber") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          barCouncilNumber: "Bar Council number is required",
        }));
      }
    }

    if (name === "barCouncilState") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          barCouncilState: "Bar Council state is required",
        }));
      }
    }

    if (name === "enrollmentYear") {
      const currentYear = new Date().getFullYear();
      const year = parseInt(value);
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          enrollmentYear: "Enrollment year is required",
        }));
      } else if (isNaN(year) || year < 1950 || year > currentYear) {
        setFieldErrors((prev) => ({
          ...prev,
          enrollmentYear: `Please enter a valid year between 1950 and ${currentYear}`,
        }));
      }
    }

    if (name === "yearsOfExperience") {
      const years = parseInt(value);
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          yearsOfExperience: "Years of experience is required",
        }));
      } else if (isNaN(years) || years < 0 || years > 70) {
        setFieldErrors((prev) => ({
          ...prev,
          yearsOfExperience: "Please enter valid years of experience (0-70)",
        }));
      }
    }

    if (name === "officeAddressLine1") {
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          officeAddressLine1: "Office address is required",
        }));
      } else if (value.trim().length < 5) {
        setFieldErrors((prev) => ({
          ...prev,
          officeAddressLine1: "Please enter a complete address",
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
      if (value.trim().length === 0) {
        setFieldErrors((prev) => ({ ...prev, state: "State is required" }));
      } else if (!/^[a-zA-Z\s]+$/.test(value)) {
        setFieldErrors((prev) => ({
          ...prev,
          state: "State should only contain letters",
        }));
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

  const validatePhoneNumber = (phoneNumber, countryCode = "+91") => {
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

  const validateAllFields = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      errors.firstName = "First name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.firstName))
      errors.firstName = "First name should only contain letters";

    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      errors.lastName = "Last name must be at least 2 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.lastName))
      errors.lastName = "Last name should only contain letters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      errors.email = "Please enter a valid email address";

    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) errors.phoneNumber = phoneValidation.message;

    if (!formData.barCouncilNumber.trim())
      errors.barCouncilNumber = "Bar Council number is required";

    if (!formData.barCouncilState.trim())
      errors.barCouncilState = "Bar Council state is required";

    const currentYear = new Date().getFullYear();
    const enrollmentYear = parseInt(formData.enrollmentYear);
    if (!formData.enrollmentYear.trim())
      errors.enrollmentYear = "Enrollment year is required";
    else if (
      isNaN(enrollmentYear) ||
      enrollmentYear < 1950 ||
      enrollmentYear > currentYear
    ) {
      errors.enrollmentYear = `Please enter a valid year between 1950 and ${currentYear}`;
    }

    if (formData.yearsOfExperience === null) {
      errors.yearsOfExperience = "Years of experience is required";
    } else if (
      isNaN(formData.yearsOfExperience) ||
      formData.yearsOfExperience < 0 ||
      formData.yearsOfExperience > 70
    ) {
      errors.yearsOfExperience =
        "Please enter valid years of experience (0-70)";
    }


    if (!formData.officeAddressLine1.trim())
      errors.officeAddressLine1 = "Office address is required";
    else if (formData.officeAddressLine1.trim().length < 5)
      errors.officeAddressLine1 = "Please enter a complete address";

    if (!formData.city.trim()) errors.city = "City is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.city))
      errors.city = "City should only contain letters";

    if (!formData.state.trim()) errors.state = "State is required";
    else if (!/^[a-zA-Z\s]+$/.test(formData.state))
      errors.state = "State should only contain letters";

    if (!formData.pincode.trim()) errors.pincode = "Postal code is required";
    else if (!/^[0-9]{4,10}$/.test(formData.pincode))
      errors.pincode = "Please enter a valid postal code";

    if (!formData.password) errors.password = "Password is required";
    else if (passwordStrength.score < 6)
      errors.password = "Password does not meet all requirements";

    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";



    if (!formData.latitude || !formData.longitude) {
      errors.location = "Please select your location on the map";
    }

    // File validation (Bar Council ID)
    if (!file) {
      errors.file = "Bar Council ID Card is required";
    }


    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [isAgreed, setIsAgreed] = useState(false);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateAllFields()) {
      setError("Please fix all errors before submitting");

      // Find first field that has an error
      const firstErrorField = Object.keys(fieldErrors).find(
        (key) => fieldErrors[key]
      );

      if (firstErrorField) {
        // 1️⃣ Try normal input/select by name
        let element = document.querySelector(
          `[name="${firstErrorField}"]`
        );

        // 2️⃣ Fallback for custom fields (file upload, react-select, etc.)
        if (!element) {
          element = document.querySelector(
            `[data-error="${firstErrorField}"]`
          );
        }

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // focus only if possible
          if (typeof element.focus === "function") {
            element.focus();
          }
        }
      }

      return;
    }


    if (!isAgreed) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }

    if (!file) {
      setError("Please upload your Bar Council ID Card.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const jsonPayload = {
      ...formData,
      role: "lawyer",
      enrollmentYear: parseInt(formData.enrollmentYear),
      yearsOfExperience: parseInt(formData.yearsOfExperience),
    };

    const finalFormData = new FormData();
    finalFormData.append(
      "data",
      new Blob([JSON.stringify(jsonPayload)], { type: "application/json" })
    );
    finalFormData.append("file", file);
    // Append role for authService routing (it reads .get('role'))
    finalFormData.append("role", "lawyer");

    try {
      const result = await register(finalFormData);

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

            const userObj = {
              id: data.userId,
              email: data.email,
              role: data.role,
              firstName: data.firstName,
              lastName: data.lastName,
              isEmailVerified: data.isEmailVerified,
            };
            localStorage.setItem("user", JSON.stringify(userObj));

            localStorage.setItem("userRole", data.role);
            localStorage.setItem("userEmail", data.email);
            localStorage.setItem("userId", data.userId);
            window.dispatchEvent(new Event("storage"));

            syncUser();

            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSuccess, pollingToken, syncUser]);

  const getInputClass = (fieldName) => {
    const baseClass =
      "w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border text-sm " +
      "focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400";

    if (fieldErrors[fieldName]) {
      return (
        baseClass +
        " border-red-300 bg-red-50 focus:ring-red-500/20 focus:border-red-500 text-red-900 placeholder:text-red-300"
      );
    }

    return (
      baseClass +
      " border-gray-200 bg-white shadow-sm focus:ring-[#11676a]/40 focus:border-[#11676a]"
    );
  };

  const inputClass =
    "w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[#11676a]/40 focus:border-[#11676a] transition-all duration-200 " +
    "placeholder:text-gray-400";

  const iconWrapperClass =
    "absolute top-1/2 -translate-y-1/2 left-3 z-20 pointer-events-none text-gray-400";

  const sectionCardClass =
    "rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 shadow-sm";

  const sectionTitleClass =
    "flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 mb-1";

  const sectionSubtitleClass = "text-xs text-gray-500";

  const MaterialIcon = ({ name }) => (
    <span className="material-symbols-outlined text-xl text-gray-500">
      {name}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-6xl w-full grid lg:grid-cols-[1.05fr_1.5fr] gap-6 sm:gap-8 lg:gap-10 items-stretch">
        {/* Left Panel - Hidden on mobile, visible on lg+ */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-linear-to-br from-[#0a4d68] via-primary to-[#2c3e50] text-white p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-black/15 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">
                  gavel
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-50/90">
                  Jurify for Lawyers
                </p>
                <h1 className="text-2xl font-semibold mt-1">
                  Join the Pro Bono Legal Network
                </h1>
              </div>
            </div>

            <p className="text-sm text-teal-50/95 leading-relaxed">
              Register as a verified lawyer on Jurify and offer pro bono legal
              support to citizens who need it most. Build your impact, grow your
              reputation, and be part of a trusted legal community.
            </p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Verified Lawyers
                </p>
                <p className="text-xl font-semibold mt-1">1,200+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Cases Supported
                </p>
                <p className="text-xl font-semibold mt-1">8,500+</p>
              </div>
              <div className="bg-white/5 border border-white/15 rounded-2xl px-3 py-3">
                <p className="text-[0.68rem] uppercase tracking-wide text-teal-50/80">
                  Avg. Rating
                </p>
                <p className="text-xl font-semibold mt-1 flex items-center gap-1">
                  4.8
                  <span className="material-symbols-outlined text-sm">
                    star
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium text-teal-50">
                Why lawyers trust Jurify
              </p>
              <ul className="space-y-2 text-xs text-teal-50/90">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>
                    Structured verification with Bar Council credentials.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>Get matched with curated pro bono matters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-[2px]">
                    check_circle
                  </span>
                  <span>
                    Impact dashboard to track the lives you've helped.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            <p className="text-[0.7rem] text-teal-50/90">
              "Access to justice should not depend on income. Jurify helps us
              change that."
            </p>
            <p className="mt-2 text-xs font-semibold text-teal-50">
              — Delhi High Court
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg p-4 sm:p-5 md:p-6 lg:p-8">
          {/* Home Link */}
          <Link
            to="/"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-primary transition-transform duration-200 hover:scale-110"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">
              home
            </span>
          </Link>

          {/* Header */}
          <header className="mb-5 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#6692a3] text-white shadow-md">
                <span className="material-symbols-outlined text-xl sm:text-2xl">
                  gavel
                </span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Register as a Lawyer
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Create your professional Jurify account for pro bono legal
                  assistance.
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-4 sm:mb-5 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-red-500">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-5 sm:space-y-6 max-h-[calc(100vh-200px)] sm:max-h-[78vh] overflow-y-auto pr-1 custom-scroll"
          >
            {/* Personal Information */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="person" />
                  <span>Personal Information</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  These details will be used to create your account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="person" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="e.g. Jane"
                      className={getInputClass("firstName")}
                      onChange={handleChange}
                      value={formData.firstName}
                      required
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="person" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="e.g. Smith"
                      className={getInputClass("lastName")}
                      onChange={handleChange}
                      value={formData.lastName}
                      required
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.lastName}</span>
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
                      <MaterialIcon name="mail" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. jane.smith@law.com"
                      className={getInputClass("email")}
                      onChange={handleChange}
                      value={formData.email}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        error
                      </span>
                      <span>{fieldErrors.email}</span>
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
                        <MaterialIcon name="phone_iphone" />
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="e.g. 9876543210"
                        className={getInputClass("phoneNumber")}
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          // allow only digits
                          const digitsOnly = e.target.value.replace(/\D/g, "");

                          // limit to 10 digits
                          if (digitsOnly.length <= 10) {
                            setFormData((prev) => ({
                              ...prev,
                              phoneNumber: digitsOnly,
                            }));

                            // clear error while typing
                            if (fieldErrors.phoneNumber) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                phoneNumber: "",
                              }));
                            }
                          }
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        required
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
                      <MaterialIcon name="calendar_today" />
                    </div>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className={getInputClass("dateOfBirth")}
                      value={formData.dateOfBirth}
                      onChange={handleDOBChange}
                      max={getMaxDOBFor21Plus()}
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
                        aria-pressed={formData.gender === g}
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
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="lock" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create strong password"
                      className={getInputClass("password")}
                      onChange={handleChange}
                      value={formData.password}
                      required
                      minLength={8}
                      maxLength={20}
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
                                  formData.password.length <= 20 && (
                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                      <span className="material-symbols-outlined text-sm">
                                        check_circle
                                      </span>
                                      <span>8-20 characters</span>
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
                                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/\?]/.test(
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
                      <MaterialIcon name="lock_reset" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      className={getInputClass("confirmPassword")}
                      onChange={handleChange}
                      value={formData.confirmPassword}
                      required
                      maxLength={20}
                    />
                    <span
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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

            {/* Bar Council Verification */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="gavel" />
                  <span>Bar Council Verification</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  We require valid Bar Council details to verify your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bar Council Registration Number{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="badge" />
                    </div>
                    <input
                      type="text"
                      name="barCouncilNumber"
                      placeholder="e.g. MAH/1234/2020"
                      className={getInputClass("barCouncilNumber")}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bar Council State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="location_on" className="text-xl" />
                    </div>
                    <Select
                      options={indianStates}
                      placeholder="e.g. Maharastra"
                      isSearchable
                      value={
                        indianStates.find(
                          (state) => state.value === formData.barCouncilState
                        ) || null
                      }
                      onChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          barCouncilState: selected?.value || "",
                        }));
                        setFieldErrors((prev) => ({
                          ...prev,
                          barCouncilState: "",
                        }));
                      }}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "48px",
                          height: "48px",
                          paddingLeft: "2.75rem",
                          paddingRight: "0.5rem",
                          borderRadius: "0.75rem",
                          borderColor: fieldErrors.barCouncilState
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
                          margin: "0",
                          padding: "0",
                        }),

                        singleValue: (base) => ({
                          ...base,
                          color: "#111827",
                          fontSize: "0.875rem",
                        }),

                        placeholder: (base) => ({
                          ...base,
                          color: "#9ca3af",
                          fontSize: "0.875rem",
                        }),

                        indicatorSeparator: () => ({
                          display: "none",
                        }),

                        dropdownIndicator: (base) => ({
                          ...base,
                          color: "#9ca3af",
                          paddingRight: "12px",
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
                </div>
              </div>

              {/* File Upload Section */}
              <div data-error="file" className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Bar Council ID Card{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                  {/* Delete icon (only when file exists) */}
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent file dialog
                        setFile(null);
                      }}
                      className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-600"
                    >
                      <MaterialIcon name="delete" className="text-lg" />
                    </button>
                  )}

                  <input
                    type="file"
                    name="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required={!file}
                  />

                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <MaterialIcon name={file ? "description" : "upload_file"} />
                    <span className="text-sm text-gray-600 font-medium">
                      {file ? file.name : "Click to upload ID Card"}
                    </span>
                    <span className="text-xs text-gray-400">
                      PDF, JPG or PNG (Max 5MB)
                    </span>
                  </div>
                </div>
                {fieldErrors.file && (
                  <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{fieldErrors.file}</span>
                  </div>
                )}
              </div>

              <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.7rem] text-amber-800 flex gap-2 items-start">
                <span className="material-symbols-outlined text-base mt-px shrink-0">
                  info
                </span>
                <p>
                  Your profile will be reviewed by our admin team. Verification
                  may take 24-48 hours.
                </p>
              </div>
            </section>

            {/* Professional Details */}
            <section className={sectionCardClass}>
              <div>
                <h2 className={sectionTitleClass}>
                  <MaterialIcon name="work" />
                  <span>Professional Details</span>
                </h2>
                <p className={sectionSubtitleClass}>
                  Help us understand your practice and experience.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Enrollment Year */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Year <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    {/* ICON */}
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="calendar_today" />
                    </div>

                    <input
                      type="number"               // ✅ keeps increment / decrement arrows
                      name="enrollmentYear"
                      placeholder="YYYY"
                      className={getInputClass("enrollmentYear")}
                      value={formData.enrollmentYear}
                      min={1950}
                      max={new Date().getFullYear()}
                      step={1}
                      onChange={(e) => {
                        let value = e.target.value;

                        // limit to 4 digits
                        if (value.length > 4) return;

                        const year = Number(value);
                        const currentYear = new Date().getFullYear();

                        setFormData((prev) => ({
                          ...prev,
                          enrollmentYear: value,
                          yearsOfExperience:
                            value.length === 4 &&
                              year >= 1950 &&
                              year <= currentYear
                              ? currentYear - year
                              : null,
                        }));

                        // validation
                        if (value.length < 4) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            enrollmentYear: "Enter the enrollment year",
                          }));
                        } else if (year < 1950 || year > currentYear) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            enrollmentYear: `Year must be between 1950 and ${currentYear}`,
                          }));
                        } else {
                          setFieldErrors((prev) => ({
                            ...prev,
                            enrollmentYear: "",
                          }));
                        }
                      }}
                      required
                      onFocus={(e) => e.target.select()}
                    />
                  </div>

                  {/* ERROR BELOW */}
                  {fieldErrors.enrollmentYear && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{fieldErrors.enrollmentYear}</span>
                    </div>
                  )}
                </div>


                {/* Years of Experience (Auto-calculated) */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="timelapse" />
                    </div>

                    <input
                      type="number"
                      name="yearsOfExperience"
                      placeholder="Experience"
                      className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                      value={formData.yearsOfExperience}
                      readOnly
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chamber / Firm Name{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className={iconWrapperClass}>
                    <MaterialIcon name="business_center" />
                  </div>
                  <input
                    type="text"
                    name="lawFirmName"
                    placeholder="e.g. Legal Associates"
                    className={getInputClass("lawFirmName")}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Languages Spoken{" "}
                    <span className="text-gray-400 font-normal">
                      (Default: English)
                    </span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="translate" />
                    </div>
                    <select
                      name="languages"
                      className={`${inputClass} appearance-none`}
                      value={formData.languages}
                      onChange={handleChange}
                    >
                      <option value="English">English</option>
                      <option value="English, Hindi">English & Hindi</option>
                      <option value="English, Hindi, Regional">
                        English, Hindi & Regional Language
                      </option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Bio{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <div className={iconWrapperClass}>
                      <MaterialIcon name="description" />
                    </div>
                    <textarea
                      name="bio"
                      rows={1}
                      placeholder="Short bio..."
                      className={`${getInputClass("bio")} resize-none`}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Office Address */}
              <div className="pt-1 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MaterialIcon name="pin_drop" />
                    <span>Office Address</span>
                  </div>
                  {/* Map replaces external button */}
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
                    Office Address Line 1{" "}
                    <span className="text-red-500">*</span>
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
                      value={formData.officeAddressLine1}
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
                        value={formData.city}
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
                        value={formData.pincode}
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country{" "}
                      <span className="text-gray-400 font-normal">
                        {/* (Optional) */}
                      </span>
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
                        value={formData.country}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms and Submit */}
            <section className="pt-1 pb-1 border-t border-gray-100 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-px w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                />
                <label htmlFor="terms" className="leading-relaxed">
                  I certify that all information provided above is accurate and
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-medium text-primary hover:text-[#0f5557] underline-offset-2 hover:underline"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and Privacy Policy of Jurify.
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl sm:rounded-2xl bg-primary text-white py-3 sm:py-3.5 text-sm sm:text-base font-semibold shadow-md hover:bg-primary/90 transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
                disabled={!isAgreed || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    Registering...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">
                      how_to_reg
                    </span>
                    Register as Lawyer
                  </>
                )}
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
                  to="/register-ngo"
                  className="h-12 px-6 bg-white text-primary border-primary text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">
                    volunteer_activism
                  </span>
                  {/* Register as NGO */}
                </Link>
              </div>

              <p className="text-center text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#11676a] hover:underline"
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

      {/* Custom scrollbar for the form scroll area */}
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
  );
}
