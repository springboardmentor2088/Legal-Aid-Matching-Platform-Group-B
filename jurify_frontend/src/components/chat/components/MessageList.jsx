import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  FiLock,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFile,
  FiDownload,
  FiX,
  FiZoomIn,
  FiFileText,
} from "react-icons/fi";
import chatBg from "../../../assets/chat.png";
import chatDarkBg from "../../../assets/chatdark.png";
import { useTheme } from "../../../context/ThemeContext";

const MessageList = ({
  messages = [],
  currentUserRole,
  isTyping = false,
  showEncryptionBadge = true,
  className = "",
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageBtn, setShowNewMessageBtn] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);

  const getFileIcon = (file) => {
    const name = file.name?.toLowerCase() || "";

    if (name.endsWith(".pdf")) {
      return { icon: FiFileText, color: "text-red-600 bg-red-50 border-red-200" };
    }
    if (name.endsWith(".doc") || name.endsWith(".docx")) {
      return { icon: FiFileText, color: "text-blue-600 bg-blue-50 border-blue-200" };
    }
    if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
      return { icon: FiFile, color: "text-green-600 bg-green-50 border-green-200" };
    }
    if (name.endsWith(".zip") || name.endsWith(".rar")) {
      return { icon: FiDownload, color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    }

    return { icon: FiFile, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };


  // Reusable FilePreviewCard component (file cards only for documents, thumbnails for images)
  const FilePreviewCard = ({ file, className = "", isMine }) => {
    const fileUrl = useMemo(() => {
      if (file.preview) return file.preview;
      if (file.file) return URL.createObjectURL(file.file);
      return null;
    }, [file]);

    // Cleanup object URL on unmount
    useEffect(() => {
      return () => {
        if (file.file && fileUrl) {
          URL.revokeObjectURL(fileUrl);
        }
      };
    }, [fileUrl]);

    // Text color based on message ownership (sender vs receiver)
    // Mine: White text on dark background
    // Others: Dark text on light background
    const textColor = isMine ? "text-white" : "text-gray-900";
    const subTextColor = isMine ? "text-white/70" : "text-gray-500";

    return (
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${className}`}>
        {/* Image files - show thumbnail */}
        {file.type?.startsWith("image/") ? (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-300">
            <img
              src={fileUrl}
              alt={file.name}
              className="w-12 h-12 object-cover rounded-md border border-gray-300 shrink-0"
            />
          </div>
        ) : (
          /* All other files - show file card with icon */
          (() => {
            const fileIcon = getFileIcon(file);
            const Icon = fileIcon.icon;
            return (
              <div className={`w-12 h-12 rounded-md flex items-center justify-center border ${fileIcon.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            );
          })()
        )}

        <div className="min-w-0 flex-1">
          <span
            className={`block text-sm font-semibold truncate md:text-base ${textColor}`}
          >
            {file.name}
          </span>
          <p className={`text-xs md:text-sm ${subTextColor}`}>
            {file.type?.startsWith("image/")
              ? "Image"
              : file.name.split('.').pop().toUpperCase()} • {formatFileSize(file.size || file.file?.size)}
          </p>
        </div>
      </div >
    );
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 80; // px from bottom
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;

    setIsAtBottom(atBottom);

    if (atBottom) {
      setShowNewMessageBtn(false);
    }
  };

  /*AUTO SCROLL*/
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      setShowNewMessageBtn(true);
    }
  }, [messages, isTyping]);

  /* HELPERS */
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const downloadFile = async (file) => {
    // If we have the actual file object with blob data
    if (file.file instanceof File || file.file instanceof Blob) {
      // Create download link for the actual file
      const url = URL.createObjectURL(file.file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (file.preview || file.url) {
      // Fetch file from backend proxy to avoid CORS issues from R2
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Use proxy endpoint
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const proxyUrl = `${baseUrl}/chat/download?key=${encodeURIComponent(file.attachmentKey || file.key)}`;
        // Note: We need file.attachmentKey. If not present in 'file' object, we might fail.
        // The 'file' object structure in MessageList comes from:
        //   { url, preview, type, name, attachmentKey (added in useChat transformation) }

        // If we don't have a key, try to extract from valid URL or fallback
        let fetchUrl = proxyUrl;
        if (!file.attachmentKey && !file.key) {
          console.warn("No attachment key found, falling back to direct URL");
          fetchUrl = file.preview || file.url; // Use the original fileUrl here
        }

        const response = await fetch(fetchUrl, { headers });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = file.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed (likely CORS or Network):", error);
        // Fallback: Final attempt in new tab if proxy fails
        const fileUrl = file.preview || file.url; // Re-declare fileUrl for fallback
        const newWindow = window.open(fileUrl, '_blank');
        if (!newWindow) {
          alert('Pop-up blocked. Please allow pop-ups to download this file.');
        }
      }
    } else {
      // Fallback
      window.open(file.preview || file.url, '_blank');
    }
  };

  const resolveMessageStatus = (message) => {
    // explicit status wins
    if (message.status) return message.status;

    // fallback to read flag
    if (message.read) return "delivered";
    return "sent";
  };

  const StatusIcon = ({ message }) => {
    if (message.sender !== "me") return null;

    if (message.status === "sending") {
      return <FiClock className="w-2.5 h-2.5" />;
    }

    const isRead = message.isRead;

    return (
      <div className="flex items-center -space-x-2">
        <FiCheck className={`w-3.5 h-3.5 ${isRead ? "text-[#4fc3f7]" : "text-white/50"}`} />
        <FiCheck className={`w-3.5 h-3.5 ${isRead ? "text-[#4fc3f7]" : "text-white/50"}`} />
      </div>
    );
  };

  const FileAttachment = ({ file, isMine }) => {
    const handleFileClick = () => {
      if (file.type?.startsWith("image/")) {
        setSelectedImage(file.preview || (file.file && URL.createObjectURL(file.file)));
      } else {
        // Documents - open logic handled by buttons now, but card click can still default to open
        const fileUrl = file.preview || (file.file && URL.createObjectURL(file.file));
        if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    };

    const handleOpen = (e) => {
      e.stopPropagation();
      const fileUrl = file.preview || (file.file && URL.createObjectURL(file.file));
      if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
    };

    const handleSaveAs = (e) => {
      e.stopPropagation();
      downloadFile(file);
    };

    return (
      <div className={`rounded-lg overflow-hidden transition border ${isMine
        ? "bg-white/10 border-white/20"
        : "bg-gray-50 border-gray-200"
        }`}>
        {/* File Info Area */}
        <div
          role="button"
          tabIndex={0}
          className="p-3 cursor-pointer hover:bg-black/5 transition-colors"
          onClick={handleFileClick}
        >
          <FilePreviewCard file={file} className="w-full" isMine={isMine} />
        </div>

        {/* Action Footer - Show for all files */}
        <div className={`flex border-t divide-x ${isMine ? "border-white/20 divide-white/20" : "border-gray-200 divide-gray-200"}`}>
          <button
            onClick={handleOpen}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition ${isMine ? "text-white" : "text-[#11676a]"}`}
          >
            Open
          </button>
          <button
            onClick={handleSaveAs}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-black/5 transition ${isMine ? "text-white" : "text-[#11676a]"}`}
          >
            Save as...
          </button>
        </div>

      </div>
    );
  };

  /* RENDER */
  const { isDarkMode } = useTheme();

  return (
    <div className={`overflow-hidden bg-gray-50 dark:bg-gray-900 relative ${className}`}>
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `url(${isDarkMode ? chatDarkBg : chatBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto overscroll-contain p-4 relative z-10">
        <div className="space-y-4">
          {/* DATE SEPARATOR (MVP) */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
              Today
            </div>
          </div>

          {messages.map((message) => {
            const isMine = message.sender === currentUserRole;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm ${isMine
                    ? "bg-[#11676a] text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  {/* FILE ATTACHMENTS */}
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.files.map((file, index) => (
                        <FileAttachment
                          key={index}
                          file={file}
                          isMine={isMine}
                        />
                      ))}
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-end mt-1 gap-1.5 text-[10px] ${isMine ? "text-white/70" : "text-gray-400"
                      }`}
                  >
                    <span>{formatTimestamp(message.timestamp)}</span>

                    {isMine && (
                      <div className="flex items-center">
                        {showEncryptionBadge && message.encrypted && (
                          <FiLock
                            className="w-2.5 h-2.5 mr-1"
                            title="End-to-end encrypted"
                          />
                        )}
                        <StatusIcon message={message} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {showNewMessageBtn && (
            <button
              onClick={() =>
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#11676a] text-white px-4 py-2 rounded-full shadow-lg text-sm hover:bg-[#0f5a5d] transition"
            >
              New messages ↓
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* LIGHTBOX FOR IMAGES */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <FiX className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MessageList;
