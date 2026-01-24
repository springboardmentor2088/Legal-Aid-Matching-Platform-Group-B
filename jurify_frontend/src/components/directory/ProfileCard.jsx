import React from "react";
import { FiUser, FiBriefcase, FiMapPin, FiStar, FiClock, FiMail, FiPhone } from "react-icons/fi";

function getSpecializationColor(spec) {
  // Example: assign colors based on specialization
  switch (spec.toLowerCase()) {
    case "criminal law":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    case "corporate law":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
    case "human rights":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  }
}

function ProfileCard({ profile, onContact, viewMode = "square", submissionMode = false }) {
  // Square/compact card (original)
  if (viewMode === "square") {
    return (
      <div
        className="
          flex flex-col h-full
          bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800
          p-4 sm:p-5
          hover:shadow-xl hover:-translate-y-1
          transition-all duration-300 overflow-hidden
        "
      >
        {/* Header Section */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={`
              w-11 h-11 sm:w-12 sm:h-12 rounded-full
              flex items-center justify-center shrink-0
              ${profile.type === "lawyer"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"}
            `}
          >
            {profile.type === "lawyer" ? (
              <FiUser className="text-lg sm:text-xl" />
            ) : (
              <FiBriefcase className="text-lg sm:text-xl" />
            )}
          </div>

          {/* Name and Location */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {profile.name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">
              {profile.type}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              <FiMapPin className="shrink-0" />
              <span className="truncate">
                {profile.city}, {profile.state}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-yellow-500 text-xs">
              <FiStar className="fill-current" />
              <span className="font-semibold text-gray-800">{profile.rating}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              ({profile.casesHandled} cases)
            </span>
          </div>
        </div>

        {/* Meta + Tags Section */}
        <div className="mt-3 space-y-2.5">
          {/* Specialization Tags */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {profile.specialization?.map((spec, index) => (
              <span
                key={index}
                className={`
                  px-2 py-0.5 rounded-full text-[10px]
                  whitespace-nowrap font-medium shrink-0
                  ${getSpecializationColor(spec)}
                `}
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <FiClock className="text-gray-400 shrink-0" />
              <span>{profile.experience} yrs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`
                  w-1.5 h-1.5 rounded-full shrink-0
                  ${profile.available ? "bg-green-500" : "bg-red-500"}
                `}
              ></span>
              <span>{profile.available ? "Available" : "Busy"}</span>
            </div>
          </div>

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold shrink-0">Speaks:</span>
              <div className="flex gap-1 flex-wrap">
                {profile.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px]"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-2.5">
            {/* Contact Info Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-xs min-w-0 flex-1">
                {/* Mobile Icons */}
                <div className="flex gap-2 sm:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${profile.email}`;
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Email"
                  >
                    <FiMail className="text-xs" />
                  </button>
                  {profile.phoneNumber && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${profile.phoneNumber}`;
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Phone"
                    >
                      <FiPhone className="text-xs" />
                    </button>
                  )}
                </div>

                {/* Desktop Details */}
                <div className="hidden sm:flex flex-col gap-1.5 min-w-0 flex-1">
                  <a
                    href={`mailto:${profile.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors min-w-0"
                  >
                    <FiMail className="shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </a>
                  {profile.phoneNumber && (
                    <a
                      href={`tel:${profile.phoneNumber}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <FiPhone className="shrink-0" />
                      <span className="truncate">{profile.phoneNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Row: Verified Badge + Contact Button */}
            <div className="flex items-center justify-between gap-2 mt-2">
              {profile.isRequested ? (
                <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 shrink-0">
                  <span className="bg-amber-100 dark:bg-amber-900/30 p-0.5 rounded-full">📨</span>
                  <span>Request Sent</span>
                </div>
              ) : profile.verified ? (
                <div className="text-[10px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5 shrink-0">
                  <span className="bg-green-100 dark:bg-green-900/30 p-0.5 rounded-full">✅</span>
                  <span>Verified {profile.type === "lawyer" ? "Bar Council" : "NGO Darpan"}</span>
                </div>
              ) : (
                <div></div> // Spacer
              )}

              <button
                className={`group relative overflow-hidden px-4 py-2 text-xs rounded-lg transition-all duration-300 shadow-md font-semibold flex items-center justify-center gap-1.5
                  ${profile.isRequested
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-linear-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!profile.isRequested) onContact(profile);
                }}
                disabled={profile.isRequested}
                aria-label={profile.isRequested ? "Already Requested" : `Contact ${profile.name}`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <FiMail className="text-xs" />
                  <span>{profile.isRequested ? "Requested" : "Contact"}</span>
                </span>
                {!profile.isRequested && (
                  <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed rectangular card (list view)
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-start gap-6"
    >
      {/* Left: Avatar */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0
            ${profile.type === "lawyer" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
        {profile.type === "lawyer" ? (
          <FiUser className="text-2xl" />
        ) : (
          <FiBriefcase className="text-2xl" />
        )}
      </div>

      {/* Middle: Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{profile.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-1">{profile.type}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FiMapPin />
              <span className="truncate">{profile.city}, {profile.state}</span>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              <FiStar />
              <span className="font-semibold text-gray-800 dark:text-white">{profile.rating}</span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">({profile.casesHandled} cases)</span>
          </div>
        </div>

        {/* Specializations */}
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.specialization?.slice(0, 6).map((spec, i) => (
            <span key={i} className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(spec)}`}>
              {spec}
            </span>
          ))}
        </div>

        {/* Languages & Experience */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <FiClock />
            <span>{profile.experience || 0} yrs</span>
          </div>
          {profile.languages && profile.languages.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Speaks:</span>
              <div className="flex gap-1">
                {profile.languages.slice(0, 3).map((lang, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">{lang}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact details (desktop) */}
        <div className="mt-4 hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <a href={`mailto:${profile.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:text-primary">
            <FiMail /> <span className="truncate">{profile.email}</span>
          </a>
          {profile.phoneNumber && (
            <a href={`tel:${profile.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:text-primary">
              <FiPhone /> <span>{profile.phoneNumber}</span>
            </a>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-3 items-stretch">
        {submissionMode ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContact(profile);
            }}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e5658] transition shadow-md whitespace-nowrap"
          >
            Request Assistance
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContact(profile);
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-105 transition"
            >
              Message
            </button>
            <a
              href={`mailto:${profile.email}`}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 text-sm text-slate-700 dark:text-white text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition"
            >
              Email
            </a>
          </>
        )}
      </div>

      {/* Verification */}
      {profile.verified && (
        <div className="absolute top-3 right-3 text-[10px] text-green-600">
          ✅ Verified {profile.type === "lawyer" ? "Bar Council" : "NGO Darpan"}
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
