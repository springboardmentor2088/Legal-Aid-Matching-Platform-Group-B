import React from 'react';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import { FiLoader, FiCheck, FiX } from 'react-icons/fi';

const GlobalLoader = () => {
    const { isLoading, message, status } = useGlobalLoader();

    if (!isLoading) return null;

    // Blocking Loader Layout
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className={`
                flex flex-col items-center gap-4 px-8 py-6 rounded-2xl shadow-2xl transition-all duration-300 transform scale-100 opacity-100 min-w-[300px]
                ${status === 'loading' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200' : ''}
                ${status === 'success' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500' : ''}
                ${status === 'error' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-2 border-red-500' : ''}
            `}>
                <div className="flex-shrink-0">
                    {status === 'loading' && <FiLoader className="w-12 h-12 animate-spin text-primary" />}
                    {status === 'success' && <FiCheck className="w-12 h-12 text-emerald-500" />}
                    {status === 'error' && <FiX className="w-12 h-12 text-red-500" />}
                </div>
                <span className="font-semibold text-lg text-center leading-relaxed">
                    {message}
                </span>
            </div>
        </div>
    );
};

export default GlobalLoader;
