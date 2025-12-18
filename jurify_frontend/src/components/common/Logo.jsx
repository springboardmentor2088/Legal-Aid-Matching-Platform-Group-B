import React from 'react';

import logo from '../../assets/logo.png';

const Logo = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img src={logo} alt="Jurify Logo" className="h-[84px] w-auto object-contain" />
        </div>
    );
};

export default Logo;
