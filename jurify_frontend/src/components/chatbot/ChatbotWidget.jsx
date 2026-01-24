import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import ChatbotIcon from '../../assets/Chatbot.png';

import { useLocation } from 'react-router-dom';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();
    const userRole = user?.role || 'Citizen';

    const allowedPaths = ['/citizen', '/lawyer', '/ngo'];
    const isVisible = allowedPaths.some(path => location.pathname.startsWith(path));

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[1000] font-sans">
            {isOpen ? (
                <ChatWindow onClose={() => setIsOpen(false)} role={userRole} />
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center justify-center p-1 bg-primary hover:bg-primary-dark text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50"
                    aria-label="Open Support Chat"
                >
                    <img
                        src={ChatbotIcon}
                        alt="Chatbot"
                        className="w-14 h-14 drop-shadow-xl"
                    />
                </button>
            )}
        </div>
    );
};

export default ChatbotWidget;


