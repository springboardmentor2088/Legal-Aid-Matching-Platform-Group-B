import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ChatLayout from '../components/ChatLayout';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { useChat } from '../hooks/useChat';
import { ROLES, canSendMessage } from '../utils/roleRules';

import {
  FiMessageCircle, FiLock, FiShield, FiSearch, FiUsers, FiFileText, FiCircle
} from 'react-icons/fi';

import { authService } from '../../../services/authService';

const LawyerChat = () => {
  const { user } = useAuth();
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [isProfileOffline, setIsProfileOffline] = useState(false);

  // Check own profile status (availability)
  React.useEffect(() => {
    const checkAvailability = async () => {
      try {
        const profile = await authService.getProfile();
        // If isActive is false, it means we are offline/unavailable
        if (profile && profile.isActive === false) {
          setIsProfileOffline(true);
        } else {
          setIsProfileOffline(false);
        }
      } catch (err) {
        console.error("Failed to fetch profile status", err);
      }
    };
    checkAvailability();
  }, []);

  // Use shared chat hook
  const {
    cases,
    filteredCases,
    selectedCase,
    messages,
    newMessage,
    loading,
    sending,
    isTyping,
    isMobileView,
    showSidebar,
    setNewMessage,
    handleSelectCase,
    handleBackClick,
    sendMessage,
    getOnlineStatus,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
  } = useChat(ROLES.LAWYER);

  // Lawyer can only chat with Citizen
  const receiverRole = ROLES.CITIZEN;

  // Normalize online status for consistency
  const normalizedCases = filteredCases.map(c => ({
    ...c,
    onlineStatus: c.onlineStatus || getOnlineStatus(c),
  }));

  const handleFileAttach = (files) => {
    const { maxSize } = getFileUploadLimits(ROLES.LAWYER);
    if (files.some(f => f.size > maxSize * 1024 * 1024)) {
      alert(`Each file must be under ${maxSize}MB`);
      return;
    }
    // Only validate files - MessageInput will handle sending
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      review: 'bg-[#e5f4f5] text-[#11676a]'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getOnlineStatusColor = (status) => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  if (loading) {
    return (
      <ChatLayout className="flex items-center justify-center min-h-[600px] bg-linear-to-br from-[#e5f4f5] to-[#11676a]/10 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#e5f4f5] border-t-[#11676a] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading client cases...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Establishing secure connection</p>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout className="w-full h-full">
      {/* Offline Banner */}
      {isProfileOffline && (
        <div className="bg-slate-800 text-white text-xs py-1 px-3 text-center font-medium shadow-sm z-50">
          You are currently set to Offline. Clients cannot see you in the directory.
        </div>
      )}

      {cases.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-linear-to-br from-gray-50 to-[#e5f4f5] dark:from-gray-900 dark:to-gray-800 p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-[#e5f4f5] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiLock className="w-10 h-10 text-[#11676a] dark:text-[#198f93]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Active Conversations</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Once clients are assigned to your cases, you'll be able to start secure, encrypted communication here.
            </p>
            <div className="bg-white dark:bg-gray-800 border border-[#11676a]/20 dark:border-gray-700 rounded-xl p-6 text-left shadow-sm">
              <h4 className="font-semibold text-[#11676a] dark:text-[#198f93] mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Getting Started
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-[#198f93] font-bold">1.</span>
                  <span>Wait for client case assignments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-[#198f93] font-bold">2.</span>
                  <span>Review case details and client information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-[#198f93] font-bold">3.</span>
                  <span>Start secure conversations with clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-[#198f93] font-bold">4.</span>
                  <span>All communications are encrypted and privileged</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full overflow-hidden">
          {/* Sidebar */}
          {(!isMobileView || showSidebar) && (
            <div className={`${isMobileView ? 'w-full' : 'w-80'} bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden`}>
              {/* Sidebar Header */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-[#11676a] dark:text-[#198f93]" />
                    Jurify Chat
                  </h3>
                  <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <FiLock className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-400 font-medium">Secure</span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search cases or clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11676a] focus:border-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  {['all', 'active', 'pending'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterStatus(filter)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${filterStatus === filter
                        ? 'bg-[#11676a] text-white shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      {filter === 'active' ? 'Ongoing' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {normalizedCases.length === 0 ? (
                  <div className="p-8 text-center">
                    <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No cases found</p>
                  </div>
                ) : (
                  normalizedCases.map((caseItem) => {
                    const isSelected = selectedCase?.id === caseItem.id;

                    return (
                      <div
                        key={caseItem.id}
                        onClick={() => handleSelectCase(caseItem)}
                        className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all ${isSelected
                          ? 'bg-[#11676a] border-l-4 border-l-[#11676a]'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isSelected ? 'bg-gray-500' : 'bg-[#11676a]'
                              }`}>
                              {(caseItem.citizen?.name || 'Unknown Client').charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${caseItem.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-semibold truncate text-sm ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                                {caseItem.citizen?.name || 'Unknown Client'}
                              </h4>
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                {formatTimestamp(caseItem.lastMessageTime)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className={`text-[10px] font-sans font-black tracking-widest uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                {caseItem.caseNumber}
                              </p>
                              {caseItem.unreadCount > 0 && (
                                <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                  {caseItem.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <FiShield className="w-4 h-4 text-green-600" />
                    <span>End-to-end encrypted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiCircle className="w-2 h-2 fill-green-500 text-green-500" />
                    <span>{normalizedCases.filter(c => c.onlineStatus === 'online').length} online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Area */}
          {(!isMobileView || !showSidebar) && (
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
              {selectedCase ? (
                <>
                  {/* STATIC HEADER — MUST NOT SCROLL */}
                  <ChatHeader
                    title={
                      selectedCase?.citizen?.name ||
                      "Jurify Chat"
                    }
                    subtitle={`${selectedCase?.caseNumber || ''}`}
                    currentUserRole={ROLES.LAWYER}
                    onlineStatus={selectedCase?.onlineStatus || 'offline'}
                    isMobileView={isMobileView}
                    onBackClick={handleBackClick}
                  />

                  {/* ONLY THIS AREA SCROLLS */}
                  {/* ONLY THIS AREA SCROLLS */}
                  <div className="flex-1 overflow-hidden pointer-events-auto" key={selectedCase?.id}>
                    <MessageList
                      messages={messages}
                      currentUserRole="me"
                      isTyping={isTyping}
                      showEncryptionBadge={true}
                      className="h-full"
                    />
                  </div>

                  {/* STATIC INPUT — MUST NOT SCROLL */}
                  {receiverRole &&
                    canSendMessage(ROLES.LAWYER, receiverRole) && (
                      <MessageInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        onSend={sendMessage}
                        sending={sending}
                        onFileAttach={handleFileAttach}
                        canSend={canSendMessage(ROLES.LAWYER, receiverRole)}
                      />
                    )}

                  {/* BLOCKED STATE - NO RECEIVER OR PERMISSION DENIED */}
                  {selectedCase && (!receiverRole || !canSendMessage(ROLES.LAWYER, receiverRole)) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <FiLock className="w-4 h-4" />
                        <span>
                          {!receiverRole
                            ? "No client available for this case"
                            : "Messaging not available for this recipient"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-linear-to-br from-gray-50 to-[#e5f4f5] dark:from-gray-900 dark:to-gray-800 p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-[#e5f4f5] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <FiMessageCircle className="w-10 h-10 text-[#11676a] dark:text-[#198f93]" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Select a Client Case</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      Choose a case from the sidebar to start or continue your secure conversation with your client.
                    </p>

                    <div className="bg-white dark:bg-gray-800 border border-[#11676a]/20 dark:border-gray-700 rounded-xl p-6 text-left shadow-sm">
                      <h4 className="font-semibold text-[#11676a] dark:text-[#198f93] mb-4 flex items-center gap-2">
                        <FiShield className="w-5 h-5" />
                        Lawyer Features
                      </h4>
                      <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start gap-3">
                          <FiLock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>End-to-end encrypted client communications</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiShield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Attorney-client privilege protection</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiFileText className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Secure document sharing capabilities</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Professional case management tools</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ChatLayout>
  );
};

export default LawyerChat;
