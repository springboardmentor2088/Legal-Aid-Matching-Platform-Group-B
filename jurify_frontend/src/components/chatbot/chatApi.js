import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const API_BASE_URL = `${BASE_URL}/public/chatbot`;

export const askChatbot = async (message, role) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
            message,
            role
        });
        return response.data;
    } catch (error) {
        console.error("Chatbot API Error:", error);
        throw error;
    }
};
