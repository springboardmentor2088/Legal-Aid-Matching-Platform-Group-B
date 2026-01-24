import React, { useState, useEffect } from "react";
import { FiX, FiMail, FiPhone, FiClock, FiStar, FiUser, FiCalendar } from "react-icons/fi";
import { api } from "../../services/api";
import { adminService } from "../../services/adminService";

const ProfileViewModel = ({ profile, onClose, onRequestConsultation, showConsultationButton, submissionMode = false }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    if (activeTab === "reviews" && profile?.id) {
      fetchReviews();
    }
    if (activeTab === "cases" && profile?.id) {
      fetchUserCases();
    }
  }, [activeTab, profile]);

  const fetchUserCases = async () => {
    try {
      setLoadingCases(true);
      const res = await adminService.getUserCases(profile.id);
      // Backend returns Page<AdminCaseDTO>, content is the array
      setCases(res.content || []);
    } catch (err) {
      console.error("Failed to fetch user cases", err);
      // Fallback empty
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      // profile.id is the directory entry ID (local mock might be different, but for real API this is correct)
      // If using static data logic in DirectorySearch, we might not have a real endpoint.
      // But we just added one: /api/public/directory/{id}/reviews
      const res = await api.get(`/public/directory/${profile.id}/reviews`);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      // Fallback for demo if API fails
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!profile) return null;

  const handleRequestConsultation = () => {
    if (onRequestConsultation) {
      onRequestConsultation(profile);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      {/* Blur backdrop */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/30" onClick={onClose} />

      {/* Modal box */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-4 border-teal-600 dark:border-teal-700 p-0 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
          >
            <FiX size={22} />
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {profile.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
            {profile.type?.toUpperCase()} • {profile.city}, {profile.state}
          </p>

          <div className="flex gap-6 mt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "reviews" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Reviews ({profile.casesHandled || 0})
            </button>
            <button
              onClick={() => setActiveTab("cases")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "cases" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Cases History
            </button>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Meta info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
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
                    <FiClock className="text-gray-500 dark:text-gray-400" />
                    <span>{profile.experience} yrs experience</span>
                  </div>
                )}
                {profile.rating && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <FiStar className="fill-current" />
                    <span className="text-gray-800 dark:text-white font-medium">{profile.rating}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({profile.casesHandled} cases)
                    </span>
                  </div>
                )}
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="space-y-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Qualification</h4>
                  <p>{profile.qualification || "Not specified"}</p>
                </div>

                {profile.mission && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Mission</h4>
                    <p>{profile.mission}</p>
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Languages</h4>
                    <div className="flex gap-2 flex-wrap">
                      {profile.languages.map((lang, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.specialization?.length > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Specializations</h4>
                    <div className="flex gap-2 flex-wrap">
                      {profile.specialization.map((spec, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">{spec}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Verified badge */}
              {profile.verified && (
                <div className="mt-3 text-xs sm:text-sm text-green-600 font-medium flex items-center gap-2">
                  ✅ Verified {profile.type === "lawyer" ? "Bar Council" : "NGO Darpan"}
                </div>
              )}
            </div>
          ) : activeTab === "cases" ? (
            <div className="space-y-4">
              {loadingCases ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : cases.length > 0 ? (
                cases.map((c) => (
                  <div key={c.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{c.description ? (c.description.length > 50 ? c.description.substring(0, 50) + '...' : c.description) : `Case ${c.id}`}</p>
                      <p className="text-xs text-gray-500">{c.regDate || 'No date'} • {c.id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        c.status === 'IN_PROGRESS' || c.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                        {c.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{c.category || 'General'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FiCalendar className="mx-auto text-3xl mb-2 opacity-50" />
                  <p>No case history available.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loadingReviews ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500">
                          <FiUser />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{review.reviewerName || "Anonymous User"}</p>
                          <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm">
                        <FiStar className="fill-current" />
                        <span>{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FiStar className="mx-auto text-3xl mb-2 opacity-50" />
                  <p>No reviews yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {onRequestConsultation && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={handleRequestConsultation}
              disabled={profile.isRequested || profile.isLoading}
              className={`w-full py-3 rounded-xl font-semibold shadow-lg transition transform duration-200 
                ${profile.isRequested
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : profile.isLoading
                    ? "bg-primary/70 cursor-wait text-white"
                    : "bg-primary text-white hover:bg-[#0e5658] hover:shadow-xl active:scale-95"
                }`}
            >
              {profile.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : profile.isRequested ? (
                "Request Sent"
              ) : (
                "Request Consultation"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileViewModel;
