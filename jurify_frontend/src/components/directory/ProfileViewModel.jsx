import React from "react";
import { FiX, FiMail, FiPhone, FiClock, FiStar } from "react-icons/fi";

const ProfileViewModel = ({ profile, onClose }) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur backdrop */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Modal box */}
      <div className="relative bg-white rounded-2xl shadow-2xl border-4 border-teal-600 p-6 sm:p-8 w-full max-w-3xl">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <FiX size={22} />
        </button>

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {profile.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          {profile.type?.toUpperCase()} • {profile.city}, {profile.state}
        </p>

        {/* Meta info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
          <div className="flex items-center gap-2">
            <FiMail className="text-blue-600" />
            <a href={`mailto:${profile.email}`} className="hover:underline">
              {profile.email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <FiPhone className="text-green-600" />
            <a href={`tel:${profile.phone}`} className="hover:underline">
              {profile.phone}
            </a>
          </div>
          {profile.experience && (
            <div className="flex items-center gap-2">
              <FiClock className="text-gray-500" />
              <span>{profile.experience} yrs experience</span>
            </div>
          )}
          {profile.rating && (
            <div className="flex items-center gap-2 text-yellow-500">
              <FiStar className="fill-current" />
              <span className="text-gray-800 font-medium">{profile.rating}</span>
              <span className="text-xs text-gray-500">
                ({profile.casesHandled} cases)
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-200" />

        <div className="text-sm text-gray-700 mb-2">
  🎓 <span className="font-medium">Qualification:</span> {profile.qualification || "Not specified"}
</div>

        {profile.mission && (
          <div className="text-sm text-gray-700 mb-2">
            🎯 <span className="font-medium">Mission:</span> {profile.mission}
          </div>
        )}
        {profile.languages?.length > 0 && (
          <div className="text-sm text-gray-700 mb-2">
            🗣️ <span className="font-medium">Languages:</span> {profile.languages.join(", ")}
          </div>
        )}

        {/* Verified badge */}
        {profile.verified && (
          <div className="mt-3 text-xs sm:text-sm text-green-600 font-medium">
            ✅ Verified {profile.type === "lawyer" ? "Bar Council" : "NGO Darpan"}
          </div>
        )}

        {/* CTA button */}
        <button
          className="mt-6 w-full bg-primary text-white py-2 rounded-lg hover:bg-[#0e5658] transition"
        >
          Request Consultation
        </button>
      </div>
    </div>
  );
};

export default ProfileViewModel;