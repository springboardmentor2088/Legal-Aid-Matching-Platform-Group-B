import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const AuthDarkModeToggle = ({ className = '' }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={`fixed bottom-6 left-6 z-50 ${className}`}>
            <button
                onClick={toggleTheme}
                className={`
                relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none shadow-lg
                ${isDarkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'}
            `}
                aria-label="Toggle dark mode"
            >
                <div
                    className={`
                    absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center
                    ${isDarkMode
                            ? 'translate-x-8 bg-slate-900 text-yellow-400'
                            : 'translate-x-0 bg-amber-100 text-amber-500'}
                `}
                >
                    {isDarkMode ? <FiMoon size={14} /> : <FiSun size={14} />}
                </div>
            </button>
        </div>
    );
};

export default AuthDarkModeToggle;
