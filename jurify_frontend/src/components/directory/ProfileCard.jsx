import React from "react";
import { FiUser, FiBriefcase, FiMapPin, FiStar, FiClock, FiMail, FiPhone } from "react-icons/fi";

function getSpecializationColor(spec) {
  // Example: assign colors based on specialization
  switch (spec.toLowerCase()) {
    case "criminal law":
      return "bg-red-100 text-red-600";
    case "corporate law":
      return "bg-blue-100 text-blue-600";
    case "human rights":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function ProfileCard({ profile, onContact }) {
  return (
    <div
      className="
        bg-white rounded-2xl border border-gray-200
        p-4 sm:p-6
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-300 overflow-hidden
      "
    >
      {/* TOP */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`
              w-11 h-11 sm:w-14 sm:h-14 rounded-full
              flex items-center justify-center shrink-0
              ${profile.type === "lawyer"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"}
            `}
          >
            {profile.type === "lawyer" ? (
              <FiUser className="text-xl sm:text-2xl" />
            ) : (
              <FiBriefcase className="text-xl sm:text-2xl" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {profile.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">
              {profile.type}
            </p>

            <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-gray-500">
              <FiMapPin />
              <span className="truncate">
                {profile.city}, {profile.state}
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col items-end shrink-0 max-w-[72px]">
          <div className="flex items-center gap-1 text-yellow-500 text-sm">
            <FiStar className="fill-current" />
            <span className="font-semibold text-gray-800">{profile.rating}</span>
          </div>
          <span className="text-[11px] text-gray-500 whitespace-nowrap">
            ({profile.casesHandled} cases)
          </span>
        </div>
      </div>

      {/* TAGS */}
      <div className="flex gap-2 mt-3 overflow-x-auto sm:flex-wrap scrollbar-hide">
        {profile.specialization?.map((spec, index) => (
          <span
            key={index}
            className={`
              px-3 py-1 rounded-full text-[11px] sm:text-xs
              whitespace-nowrap font-medium
              ${getSpecializationColor(spec)}
            `}
          >
            {spec}
          </span>
        ))}
      </div>

      {/* META */}
      <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FiClock className="text-gray-400" />
          <span>{profile.experience} yrs</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`
              w-2 h-2 rounded-full
              ${profile.available ? "bg-green-500" : "bg-red-500"}
            `}
          ></span>
          <span>{profile.available ? "Available" : "Busy"}</span>
        </div>
      </div>

      {/* LANGUAGES */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-500">
          <span className="font-semibold">Speaks:</span>
          {profile.languages.join(", ")}
        </div>
      )}

      {/* CONTACT */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-600 text-xs sm:text-sm">
          {/* Mobile Icons */}
          <div className="flex gap-3 sm:hidden">
            <FiMail />
            <FiPhone />
          </div>

          {/* Desktop details */}
          <span className="hidden sm:flex items-center gap-2">
            <FiMail /> {profile.email}
          </span>
          {profile.phoneNumber && (
            <span className="hidden sm:flex items-center gap-2">
              <FiPhone /> {profile.phoneNumber}
            </span>
          )}
        </div>

        <button
          className="
            bg-primary text-white px-4 py-2
            text-xs sm:text-sm rounded-xl
            hover:bg-[#0e5658] transition
          "
          onClick={(e) => {
            e.stopPropagation();
            onContact(profile); // ✅ opens modal
          }}
        >
          Contact
        </button>
      </div>

      {/* VERIFIED */}
      {profile.verified && (
        <div className="mt-3 text-[11px] sm:text-xs text-green-600">
          ✅ Verified {profile.type === "lawyer" ? "Bar Council" : "NGO Darpan"}
        </div>
      )}
    </div>
  );
}

export default ProfileCard;