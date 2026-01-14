import React, { useState } from "react";
import {
  FiLock,
  FiShield,
  FiPhone,
  FiVideo,
  FiMoreVertical,
  FiArrowLeft,
  FiMessageCircle,
  FiInfo,
} from "react-icons/fi";

const ChatHeader = ({
  title = "My Chat",
  subtitle = "End-to-end encrypted communications",
  onlineStatus = "online | away | offline",
  currentUserRole = "CITIZEN | LAWYER | NGO",
  showSecurityBadge = true,
  showActionButtons = true,
  isMobileView = false,
  onBackClick,
  onSecurityInfoToggle,
  className = "",
}) => {
  const [showChatOptions, setShowChatOptions] = useState(false);

  /** Role-based permissions */
  const canCall =
    currentUserRole === "LAWYER" || currentUserRole === "NGO";

  return (
    <div className="relative">
      {/* HEADER BAR */}
      <div
        className={`bg-gradient-to-r from-[#11676a] to-[#0f5a5d] text-white p-4 flex items-center justify-between ${className}`}
      >
        <div className="flex items-center gap-3">
          {isMobileView && onBackClick && (
            <button
              onClick={onBackClick}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
          )}

          <FiMessageCircle className="w-6 h-6 shrink-0" />

          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              {title}
              <span className={`w-2.5 h-2.5 rounded-full ${onlineStatus === 'online' ? 'bg-green-400' : 'bg-gray-400'}`} />
            </h2>
            <p className="text-[10px] font-sans font-black tracking-widest uppercase text-white/70 flex items-center gap-2">
              <span>{subtitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SECURITY BADGE */}
          {showSecurityBadge && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium">
              <FiLock className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
          )}

          {/* SECURITY INFO */}
          {onSecurityInfoToggle && (
            <button
              onClick={onSecurityInfoToggle}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Security Information"
            >
              <FiInfo className="w-5 h-5" />
            </button>
          )}

          {/* ACTION BUTTONS */}
          {showActionButtons && canCall && (
            <>
              <button className="p-2 hover:bg-white/10 rounded-lg transition">
                <FiPhone className="text-lg" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition">
                <FiVideo className="text-lg" />
              </button>
            </>
          )}

          {/* OPTIONS */}
          <button
            className="p-2 hover:bg-white/10 rounded-lg transition"
            onClick={() => setShowChatOptions(!showChatOptions)}
          >
            <FiMoreVertical className="text-lg" />
          </button>
        </div>
      </div>

      {/* OPTIONS DROPDOWN */}
      {showChatOptions && (
        <div className="absolute top-full right-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[200px]">
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <FiShield className="text-sm" />
            View Security Details
          </button>
          {canCall && (
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              Request Call
            </button>
          )}
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            Chat Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
