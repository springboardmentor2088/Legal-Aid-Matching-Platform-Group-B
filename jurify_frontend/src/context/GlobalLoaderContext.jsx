import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalLoaderContext = createContext();

export const useGlobalLoader = () => {
    const context = useContext(GlobalLoaderContext);
    if (!context) {
        throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider');
    }
    return context;
};

export const GlobalLoaderProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const startLoading = useCallback((msg = 'Loading...') => {
        setIsLoading(true);
        setMessage(msg);
        setStatus('loading');
    }, []);

    const stopLoading = useCallback((success = true, msg = '') => {
        if (success) {
            setStatus('success');
            setMessage(msg || 'Completed successfully');
        } else {
            setStatus('error');
            setMessage(msg || 'An error occurred');
        }

        // Auto-hide after a delay for success/error
        setTimeout(() => {
            setIsLoading(false);
            setStatus('idle');
            setMessage('');
        }, 3000);
    }, []);

    return (
        <GlobalLoaderContext.Provider value={{ isLoading, message, status, startLoading, stopLoading }}>
            {children}
        </GlobalLoaderContext.Provider>
    );
};
