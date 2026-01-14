import { useState, useEffect, useCallback, useRef } from "react";
import { caseService } from "../../../services/caseService";
import { useAuth } from "../../../context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../../../services/api";
import { chatEvents } from "../../../utils/chatEvents";

export const useChat = (userRole) => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [messagesByCase, setMessagesByCase] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef({});
  const selectedCaseRef = useRef(null);

  /* MOBILE DETECT */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile && selectedCase) setShowSidebar(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedCase]);

  /* 1. INITIALIZE WEBSOCKET */
  useEffect(() => {
    // Determine backend URL (assuming localhost:8080 for dev if not proxied)
    const socketUrl = "http://localhost:8080/ws";

    const token = localStorage.getItem("accessToken"); // Key from authService.js

    const client = new Client({
      // Use SockJS fallback
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log("Connected to WebSocket");
        // Subscribe to personal unread updates
        client.subscribe("/user/queue/unread", (message) => {
          console.log("WS: Received unread update", message.body);
          const data = JSON.parse(message.body);
          setCases(prev => prev.map(c =>
            c.id == data.caseId ? { ...c, unreadCount: data.unreadCount } : c
          ));
        });

        // Subscribe to global presence updates
        client.subscribe("/topic/presence", (message) => {
          const data = JSON.parse(message.body);
          setCases(prev => prev.map(c => {
            const isTarget = (c.lawyer && c.lawyer.email === data.email) ||
              (c.citizen && c.citizen.email === data.email) ||
              (c.ngo && c.ngo.email === data.email);

            // If the update is from our lawyer, update availability too
            if (isTarget && c.lawyer && c.lawyer.email === data.email && data.isAvailable !== undefined) {
              return { ...c, onlineStatus: data.status, isLawyerAvailable: data.isAvailable };
            }
            return isTarget ? { ...c, onlineStatus: data.status } : c;
          }));
        });
      },
      beforeConnect: () => {
        // Ensure we use the latest token on every connect/reconnect attempt
        const currentToken = localStorage.getItem("accessToken");
        client.connectHeaders = {
          Authorization: `Bearer ${currentToken}`,
        };
        console.log("Updating WebSocket headers with a fresh token before connecting");
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  /* 2. FETCH CASES */
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch cases using existing My Cases logic
      // Note: Backend 'getMyCases' should return assignments for Lawyers
      const myCases = await caseService.getMyCases();

      // Transform logic if needed to match Chat UI expected format
      const formattedCases = myCases.map(c => ({
        ...c,
        // Ensure standardized fields for chat listing
        citizen: c.citizen || (c.citizenName ? { name: c.citizenName, id: c.citizenId, email: c.citizenEmail } : { name: "Unknown Client" }),
        lawyer: c.lawyer || (c.lawyerName && c.lawyerName !== "Unassigned" ? { name: c.lawyerName, email: c.lawyerEmail } : null),
        ngo: c.ngo || (c.ngoName ? { name: c.ngoName, email: c.ngoEmail } : null),
        caseNumber: c.caseNumber || `CASE-${new Date(c.createdAt || Date.now()).getFullYear()}-${c.id.toString().padStart(3, '0')}`,
        // Initial online status from backend
        onlineStatus: c.onlineStatus || "offline",
        isLawyerAvailable: c.isLawyerAvailable,
        unreadCount: c.unreadCount || 0
      }));

      setCases(formattedCases);

      // Auto-select from URL if present
      const params = new URLSearchParams(window.location.search);
      const caseIdParam = params.get("caseId");
      if (caseIdParam) {
        const target = formattedCases.find(c => c.id.toString() === caseIdParam);
        if (target) {
          handleSelectCase(target);
          // Clear param
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (!isMobileView && formattedCases.length > 0 && !selectedCase) {
          handleSelectCase(formattedCases[0]);
        }
      } else if (!isMobileView && formattedCases.length > 0 && !selectedCase) {
        handleSelectCase(formattedCases[0]);
      }

    } catch (err) {
      console.error("Failed to fetch cases", err);
    } finally {
      setLoading(false);
    }
  }, [isMobileView, selectedCase]);

  useEffect(() => {
    fetchCases();
  }, []); // Run once on mount

  /* 3. SELECT CASE & SUBSCRIBE */
  const handleSelectCase = useCallback(async (caseItem) => {
    console.log("Selecting case:", caseItem.id, "Title:", caseItem.title);
    setSelectedCase(caseItem);
    selectedCaseRef.current = caseItem;
    if (isMobileView) setShowSidebar(false);

    // A. Load History
    if (!messagesByCase[caseItem.id]) {
      try {
        console.log("Fetching history for case:", caseItem.id);
        const history = await api.get(`/chat/history/${caseItem.id}`);
        // Transform history to match UI
        if (history && Array.isArray(history)) {
          const formattedHistory = history.map(msg => ({
            id: msg.id,
            sender: msg.senderId === user.email ? "me" : "other", // Match UI logic
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: msg.isRead,
            files: msg.attachmentUrl ? [{
              url: msg.attachmentUrl,
              preview: msg.attachmentUrl,
              type: msg.attachmentType,
              name: msg.attachmentName,
              attachmentKey: msg.attachmentKey,
              size: msg.attachmentSize,
              size: msg.attachmentSize
            }] : []
          }));

          setMessagesByCase(prev => ({
            ...prev,
            [caseItem.id]: formattedHistory
          }));

          // Mark as read on frontend too if selected
          if (caseItem.unreadCount > 0) {
            setCases(prev => prev.map(c => c.id === caseItem.id ? { ...c, unreadCount: 0 } : c));
            api.put(`/chat/read/${caseItem.id}`).catch(e => console.error(e));
          }
        } else {
          console.warn("Unexpected history format:", history);
          setMessagesByCase(prev => ({ ...prev, [caseItem.id]: [] }));
        }

      } catch (e) {
        console.error("Failed to load history", e);
      }
    } else {
      // Optimistically clear unread count if we already have history loaded
      if (caseItem.unreadCount > 0) {
        setCases(prev => prev.map(c => c.id === caseItem.id ? { ...c, unreadCount: 0 } : c));
        setMessagesByCase(prev => ({
          ...prev,
          [caseItem.id]: (prev[caseItem.id] || []).map(m => m.sender === "other" ? { ...m, isRead: true } : m)
        }));
        api.put(`/chat/read/${caseItem.id}`).catch(e => console.error(e));
      }
    }

    // B. Subscribe to Topic
    const client = stompClientRef.current;
    if (client && client.connected) {
      if (!subscriptionsRef.current[caseItem.id]) {
        console.log("Subscribing to topic:", `/topic/cases/${caseItem.id}`);
        const sub = client.subscribe(`/topic/cases/${caseItem.id}`, (message) => {
          const msg = JSON.parse(message.body);
          console.log("Received message for case:", msg.caseId, "Current Active:", selectedCaseRef.current?.id);

          // Optimistic Read for incoming messages in active chat
          const isFromOther = msg.senderId.toLowerCase() !== user.email.toLowerCase();
          console.log("WS Check: Sender=", msg.senderId, "Me=", user.email, "isFromOther=", isFromOther);

          const isCaseActive = selectedCaseRef.current && selectedCaseRef.current.id === msg.caseId;
          const shouldMarkRead = isFromOther && isCaseActive;

          const newMsg = {
            id: msg.id,
            sender: isFromOther ? "other" : "me", // Consistent derived check
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: shouldMarkRead ? true : msg.isRead,
            files: msg.attachmentUrl ? [{
              url: msg.attachmentUrl,
              preview: msg.attachmentUrl,
              type: msg.attachmentType,
              name: msg.attachmentName
            }] : []
          };

          setMessagesByCase(prev => ({
            ...prev,
            [msg.caseId]: [...(prev[msg.caseId] || []), newMsg]
          }));

          // Update lastMessageTime in cases list for sidebar sorting/display
          setCases(prev => prev.map(c =>
            c.id === msg.caseId ? { ...c, lastMessageTime: msg.timestamp } : c
          ));

          // If this is the active case, mark as read on backend
          if (shouldMarkRead) {
            api.put(`/chat/read/${msg.caseId}`).catch(e => console.error(e));
          } else {
            // ROBUST CLIENT-SIDE INCREMENT
            // Only if message is from OTHER person
            if (isFromOther) {
              setCases(prev => prev.map(c =>
                c.id === msg.caseId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
              ));

              // If not active, trigger notification sound via event bus
              chatEvents.emit({
                type: 'NEW_MESSAGE',
                payload: {
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  senderName: msg.senderId.split('@')[0], // Fallback name
                  caseId: msg.caseId,
                  caseNumber: caseItem.caseNumber,
                  createdAt: msg.timestamp,
                  isOwnMessage: msg.senderId === user.email
                }
              });
            }
          }
        });
        subscriptionsRef.current[caseItem.id] = sub;

        // Subscribe to Read Events
        const readSub = client.subscribe(`/topic/cases/${caseItem.id}/read`, (message) => {
          const data = JSON.parse(message.body);
          // If I am the one who didn't read (receiver of the read event), update my messages to isRead=true
          setMessagesByCase(prev => ({
            ...prev,
            [data.caseId]: (prev[data.caseId] || []).map(m => m.sender === "me" ? { ...m, isRead: true } : m)
          }));
        });
        subscriptionsRef.current[`${caseItem.id}_read`] = readSub;
      }
    }


  },
    [isMobileView, messagesByCase, user.email]
  );

  /* 4. SEND MESSAGE */
  const sendMessage = useCallback(async (messageData = null) => {
    const messageText = messageData?.message || newMessage;
    const files = messageData?.files || [];

    if (!messageText.trim() && files.length === 0) return;
    if (!selectedCase || sending) return;

    setSending(true);

    try {
      let attachment = null;
      // Upload file if present
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("file", files[0]); // Handle single file for now
        formData.append("caseId", selectedCase.id);

        const uploadRes = await api.post("/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        attachment = uploadRes; // api.post already returns response.data
      }

      // Determine receiver based on role (Case Insensitive)
      let receiverId = null;
      const role = user.role?.toUpperCase();

      if (role === 'LAWYER') {
        // Lawyer sends to Citizen
        receiverId = selectedCase.citizen?.email;
      } else if (role === 'CITIZEN') {
        // Citizen sends to Lawyer or NGO
        receiverId = selectedCase.lawyer?.email || selectedCase.ngo?.email;
      } else if (role === 'NGO') {
        // NGO sends to Citizen or Lawyer
        receiverId = selectedCase.citizen?.email || selectedCase.lawyer?.email;
      }

      const payload = {
        caseId: selectedCase.id,
        content: messageText,
        receiverId: receiverId, // Specific receiver
        attachmentKey: attachment?.attachmentKey,
        attachmentUrl: attachment?.attachmentUrl,
        attachmentType: attachment?.attachmentType,
        attachmentName: attachment?.attachmentName,
        attachmentSize: attachment?.attachmentSize
      };

      console.log("WS: Sending message to receiver:", receiverId, "Payload:", payload);

      stompClientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(payload),
      });

      setNewMessage("");

    } catch (e) {
      console.error("Failed to send message", e);
      alert("Failed to send message or upload file.");
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedCase, sending]);

  /* FILTER LOGIC */
  useEffect(() => {
    setFilteredCases(
      cases.filter(
        (c) => {
          const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesFilter = (filterStatus === "all" || c.status.toLowerCase() === filterStatus);

          // USER REQUEST: Show ALL assigned cases regardless of chat history
          // This ensures that for multiple cases with same client, all are visible and can be started separately.
          return matchesSearch && matchesFilter;
        }
      )
    );
  }, [cases, searchTerm, filterStatus, messagesByCase, selectedCase]);


  /* PRESENCE */
  const getOnlineStatus = (caseItem) => {
    // If we have a selected case, we can use the onlineStatus from the messages or a dedicated state
    // For now, return "online" if selectedCase matches, or browse cases
    if (caseItem && caseItem.onlineStatus === "online") return "online";
    return "offline";
  };

  const handleBackClick = () => {
    setShowSidebar(true);
    setSelectedCase(null);
    selectedCaseRef.current = null;
  };

  const currentSelectedCase = cases.find(c => c.id === selectedCase?.id) || selectedCase;

  return {
    cases,
    selectedCase: currentSelectedCase,
    messages: currentSelectedCase && messagesByCase[currentSelectedCase.id] ? messagesByCase[currentSelectedCase.id] : [],
    newMessage,
    searchTerm,
    filterStatus,
    loading,
    sending,
    isTyping,
    showSecurityInfo,
    isMobileView,
    showSidebar,
    filteredCases, // EXPORT FILTERED CASES

    setNewMessage,
    setSearchTerm,
    setFilterStatus,
    setShowSecurityInfo,
    setShowSidebar,
    handleSelectCase,
    sendMessage,
    handleBackClick,
    fetchCases,
    getOnlineStatus,
  };
};
