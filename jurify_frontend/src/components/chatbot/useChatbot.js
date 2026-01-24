import { useState } from 'react';
import { askChatbot } from './chatApi';

export const useChatbot = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am the Jurify Assistant. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = async (text, role = 'Citizen') => {
        if (!text.trim()) return;

        const userMessage = { sender: 'user', text };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const data = await askChatbot(text, role);
            const botMessage = { sender: 'bot', text: data.reply, action: data.action };
            setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
            setError('Failed to get response. Please try again.');
            setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const addBotMessage = (message) => {
        // Message can be string or object { text, action }
        const msgObject = typeof message === 'string'
            ? { sender: 'bot', text: message }
            : { sender: 'bot', text: message.text, action: message.action };

        setMessages((prev) => [...prev, msgObject]);
    };

    return { messages, isLoading, error, sendMessage, addBotMessage };
};
