import React from 'react';
import { useTheme } from '../../context/ThemeContext';

import logo from '../../assets/logo.png';
import logo5 from '../../assets/logo5.png';

const Logo = ({ className = "", src }) => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src={src || (isDarkMode ? logo5 : logo)}
                alt="Jurify Logo"
                className="h-20 w-auto object-contain"
            />
        </div>
    );
};

export default Logo;
