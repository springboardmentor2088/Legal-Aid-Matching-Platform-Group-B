import React, { useState } from 'react';
import ChatLayout from '../components/ChatLayout';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { useChat } from '../hooks/useChat';
import { ROLES, canSendMessage } from '../utils/roleRules';

import {
  FiMessageCircle, FiLock, FiShield, FiSearch,
  FiCheckCircle, FiUsers, FiFileText, FiCircle
} from 'react-icons/fi';

const CitizenChat = () => {
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
  } = useChat(ROLES.CITIZEN);

  // Normalize online status for consistency
  const normalizedCases = filteredCases
    .filter(c => c.lawyer || c.ngo)
    .map(c => ({
      ...c,
      onlineStatus: c.onlineStatus || getOnlineStatus(c),
    }));

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleFileAttach = (files) => {
    const { maxSize } = getFileUploadLimits(ROLES.CITIZEN);
    if (files.some(f => f.size > maxSize * 1024 * 1024)) {
      alert(`Each file must be under ${maxSize}MB`);
      return;
    }
  };

  const handleSendMessage = (data) => {
    // Defensive send guard
    if (!receiverRole || !canSendMessage(ROLES.CITIZEN, receiverRole)) {
      return;
    }

    // Handle both message and files
    if (data.message || data.files) {
      // Call the useChat sendMessage with the message data
      sendMessage({
        message: data.message || '',
        files: data.files || []
      });
    }
  };


  // 🔑 Determine who the citizen is chatting with
  const receiverRole = selectedCase?.lawyer
    ? ROLES.LAWYER
    : selectedCase?.ngo
      ? ROLES.NGO
      : null;
  if (loading) {
    return (
      <ChatLayout className="flex items-center justify-center min-h-[600px] bg-linear-to-br from-[#e5f4f5] to-[#11676a]/10 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#e5f4f5] dark:border-gray-700 border-t-[#11676a] dark:border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading secure conversations...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Establishing encrypted connection</p>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout className="w-full h-full">

      {cases.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-linear-to-br from-gray-50 to-[#e5f4f5] dark:from-gray-900 dark:to-gray-800 p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-[#e5f4f5] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiLock className="w-10 h-10 text-[#11676a] dark:text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">No Active Conversations</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Once a lawyer is assigned to your case, you'll be able to start secure, encrypted communication here.
            </p>
            <div className="bg-white dark:bg-gray-800 border border-[#11676a]/20 dark:border-gray-700 rounded-xl p-6 text-left shadow-sm">
              <h4 className="font-semibold text-[#11676a] dark:text-teal-400 mb-3 flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Getting Started
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-teal-400 font-bold">1.</span>
                  <span>Submit a legal case through your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-teal-400 font-bold">2.</span>
                  <span>Wait for lawyer assignment and matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-teal-400 font-bold">3.</span>
                  <span>Access secure chat once your case is active</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#11676a] dark:text-teal-400 font-bold">4.</span>
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
              <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FiUsers className="w-5 h-5 text-[#11676a]" />
                    Jurify Chat
                  </h3>
                  <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
                    <FiLock className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Secure</span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search cases or lawyers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11676a] focus:border-transparent text-sm text-gray-900 dark:text-white"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  {['all', 'active', 'pending'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterStatus(filter)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${filterStatus === filter
                        ? 'bg-[#11676a] text-white border-[#11676a]'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'No cases found matching your search' : 'No cases found'}
                    </p>
                  </div>
                ) : (
                  normalizedCases.map((caseItem) => {
                    const onlineStatus = caseItem.onlineStatus;
                    const isSelected = selectedCase?.id === caseItem.id;

                    return (
                      <div
                        key={caseItem.id}
                        onClick={() => handleSelectCase(caseItem)}
                        className={`p-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-all ${isSelected
                          ? 'bg-[#11676a] border-l-4 border-l-[#11676a]'
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isSelected ? 'bg-gray-500' : 'bg-[#11676a]'
                              }`}>
                              {(caseItem.lawyer?.name || caseItem.ngo?.name || 'Unassigned').charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-semibold truncate text-sm ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                {caseItem.lawyer?.name || caseItem.ngo?.name || 'Unassigned'}
                              </h4>
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                {formatTimestamp(caseItem.lastMessageTime)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className={`text-[10px] font-sans font-black tracking-widest uppercase ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                  {caseItem.caseNumber}
                                </p>
                                {(caseItem.status === 'RESOLVED' || caseItem.status === 'CLOSED') && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'} `}>
                                    Resolved
                                  </span>
                                )}
                              </div>
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
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
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
                      selectedCase?.lawyer?.name ||
                      selectedCase?.ngo?.name ||
                      "Jurify Chat"
                    }
                    subtitle={`${selectedCase?.caseNumber || ''}`}
                    currentUserRole={ROLES.CITIZEN}
                    onlineStatus={selectedCase?.onlineStatus || 'offline'}
                    isMobileView={isMobileView}
                    onBackClick={handleBackClick}
                  />

                  {/* UNAVAILABLE BANNER */}
                  {selectedCase?.isLawyerAvailable === false && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {selectedCase.lawyer?.name || "Lawyer"} is currently unavailable. Messages will be delivered when they return.
                      </span>
                    </div>
                  )}

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
                    canSendMessage(ROLES.CITIZEN, receiverRole) &&
                    selectedCase.status !== 'RESOLVED' &&
                    selectedCase.status !== 'CLOSED' && (
                      <MessageInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        onSend={handleSendMessage}
                        sending={sending}
                        onFileAttach={handleFileAttach}
                        disabled={!selectedCase || !receiverRole || !canSendMessage(ROLES.CITIZEN, receiverRole)}
                      />
                    )}

                  {/* BLOCKED STATE - NO RECEIVER OR PERMISSION DENIED OR RESOLVED */}
                  {selectedCase && (
                    (!receiverRole || !canSendMessage(ROLES.CITIZEN, receiverRole)) ||
                    selectedCase.status === 'RESOLVED' ||
                    selectedCase.status === 'CLOSED'
                  ) && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                          {selectedCase.status === 'RESOLVED' || selectedCase.status === 'CLOSED' ? (
                            <>
                              <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                This case has been resolved. Messaging is closed.
                              </span>
                            </>
                          ) : (
                            <>
                              <FiLock className="w-4 h-4" />
                              <span>
                                {!receiverRole
                                  ? "No legal counsel assigned to this case yet"
                                  : "Messaging not available for this recipient"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-linear-to-br from-gray-50 to-[#e5f4f5] dark:from-gray-900 dark:to-gray-800 p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-[#e5f4f5] dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <FiMessageCircle className="w-10 h-10 text-[#11676a] dark:text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Select a Conversation</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      Choose a case from the sidebar to start or continue your secure conversation with your legal counsel.
                    </p>

                    <div className="bg-white dark:bg-gray-800 border border-[#11676a]/20 dark:border-gray-700 rounded-xl p-6 text-left shadow-sm">
                      <h4 className="font-semibold text-[#11676a] dark:text-teal-400 mb-4 flex items-center gap-2">
                        <FiShield className="w-5 h-5" />
                        Security Features
                      </h4>
                      <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start gap-3">
                          <FiLock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>End-to-end encryption for all messages</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiShield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Legally privileged attorney-client communications</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiFileText className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Secure file sharing and document storage</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <span>Real-time messaging with delivery receipts</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
      }
    </ChatLayout >
  );
};

export default CitizenChat;
