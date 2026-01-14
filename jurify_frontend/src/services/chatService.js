import { api } from './api';

export const chatService = {
  getChatSessions: () => api.get('/chat/sessions'),

  getMessages: (sessionId) =>
    api.get(`/chat/sessions/${sessionId}/messages`),

  sendMessage: async (sessionId, content, attachments = []) => {
    if (!content?.trim() && attachments.length === 0) {
      throw new Error('Cannot send empty message');
    }

    const formData = new FormData();
    formData.append('content', content);

    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    return api.post(
      `/chat/sessions/${sessionId}/messages`,
      formData
    );
  },

  createChatSession: (caseId) =>
    api.post('/chat/sessions', { caseId }),

  markMessagesAsRead: (sessionId, messageIds) =>
    api.patch(
      `/chat/sessions/${sessionId}/messages/read`,
      { messageIds }
    ),

  getParticipantStatus: (sessionId) =>
    api.get(`/chat/sessions/${sessionId}/participants/status`),

  uploadFile: (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    return api.post('/chat/upload', formData);
  },

  downloadFile: (fileId) =>
    api.get(`/chat/files/${fileId}/download`, {
      responseType: 'blob',
    }),

  deleteMessage: (sessionId, messageId) =>
    api.delete(`/chat/sessions/${sessionId}/messages/${messageId}`),

  reportMessage: (sessionId, messageId, reason) =>
    api.post(
      `/chat/sessions/${sessionId}/messages/${messageId}/report`,
      { reason }
    ),

  getEncryptionKey: (sessionId) =>
    api.get(`/chat/sessions/${sessionId}/encryption`),

  verifyMessage: (messageId, signature) =>
    api.post(`/chat/messages/${messageId}/verify`, { signature }),

  connectToChat: (sessionId, onMessage, onTyping, onStatusChange) => {
    const protocol =
      window.location.protocol === 'https:' ? 'wss' : 'ws';
    const token = localStorage.getItem('authToken');

    const socket = new WebSocket(
      `${protocol}://${window.location.host}/ws/chat/${sessionId}?token=${token}`
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'MESSAGE') onMessage(data.payload);
      if (data.type === 'TYPING') onTyping(data.payload);
      if (data.type === 'STATUS_CHANGE') onStatusChange(data.payload);
    };

    return {
      socket,
      disconnect: () => socket.close(),
    };
  },

  endChatSession: (sessionId) =>
    api.post(`/chat/sessions/${sessionId}/end`),

  getChatStats: () => api.get('/chat/stats'),

  searchMessages: (sessionId, query) =>
    api.get(
      `/chat/sessions/${sessionId}/search?q=${encodeURIComponent(query)}`
    ),

  exportChatHistory: (sessionId, format = 'pdf', signal) =>
    api.get(
      `/chat/sessions/${sessionId}/export?format=${format}`,
      { responseType: 'blob', signal }
    ),
};
