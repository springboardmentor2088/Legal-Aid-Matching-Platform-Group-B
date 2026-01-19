import React, { useRef, useState } from "react";
import { FiSend, FiPaperclip, FiLock, FiX } from "react-icons/fi";

const MessageInput = ({
  newMessage = "",
  setNewMessage,
  onSend,
  sending = false,
  maxLength = 500,
  showSecurityNotice = true,
  placeholder = "Type your message... (Press Enter to send)",
  className = "",
  onFileAttach,
}) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  /*  HANDLERS  */

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!onSend) return;
    if (sending) return;

    const trimmed = newMessage.trim();
    const hasContent = trimmed || attachedFiles.length > 0;
    
    if (!hasContent) return;
    if (trimmed.length > maxLength) return;

    // Pass both message and files to the parent
    onSend({
      message: trimmed,
      files: attachedFiles.map(f => f.file)
    });

    // Clear the input and files after sending
    setNewMessage('');
    setAttachedFiles([]);
    
    // Revoke object URLs for all files
    attachedFiles.forEach(fileObj => {
      if (fileObj.preview) {
        URL.revokeObjectURL(fileObj.preview);
      }
    });
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files && files.length > 0) {
      // Create file objects with preview URLs for images
      const fileObjects = files.map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      setAttachedFiles(prev => [...prev, ...fileObjects]);
      
      // Call the parent handler if provided
      if (onFileAttach) {
        onFileAttach(files);
      }
    }
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setAttachedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URLs for removed image files
      const removed = prev.find(f => f.id === fileId);
      if (removed && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  /* RENDER */

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        {/* ATTACHMENT */}
        <button
          type="button"
          onClick={handleFileClick}
          className="p-2.5 text-gray-400 hover:text-[#11676a] hover:bg-[#e5f4f5] rounded-lg transition shrink-0"
          title="Attach file"
        >
          <FiPaperclip className="w-5 h-5" />
        </button>

        {/* HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* INPUT */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            maxLength={maxLength}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11676a] focus:border-transparent resize-none text-gray-800 dark:text-white placeholder-gray-400"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />

          <span className="absolute right-3 bottom-3 text-xs text-gray-400">
            {newMessage.length}/{maxLength}
          </span>
        </div>

        {/* SEND */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!newMessage.trim() && attachedFiles.length === 0) || sending}
          className="p-3 bg-[#11676a] text-white rounded-xl hover:bg-[#0f5a5d] transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
          title="Send message"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>

      {attachedFiles.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((fileObj) => (
              <div
                key={fileObj.id}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 max-w-xs"
              >
                {/* File Preview/Icon */}
                <div className="shrink-0">
                  {fileObj.preview ? (
                    <img
                      src={fileObj.preview}
                      alt={fileObj.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <span className="text-lg">{getFileIcon(fileObj.type)}</span>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {fileObj.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileObj.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(fileObj.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition"
                  title="Remove file"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECURITY NOTICE */}
      {showSecurityNotice && (
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <FiLock className="w-3 h-3 text-green-600" />
            <span>Messages are encrypted end-to-end</span>
          </div>
          <span className="text-gray-400">Shift + Enter for new line</span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
