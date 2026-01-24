import { useEffect, useRef } from 'react';

// Trigger a UI action globally
export const triggerUIAction = (action, payload) => {
    console.log(`[UIBUS] Dispatching: ${action}`, payload);
    window.dispatchEvent(new CustomEvent("UI_ACTION", { detail: { action, payload } }));
};

// Hook to listen for UI actions
export const useUIActionListener = (handlers) => {
    const handlersRef = useRef(handlers);

    // Always keep ref in sync with latest handlers
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handler = (e) => {
            console.log("[UIBUS] Event received", e.detail);
            const { action, payload } = e.detail;
            const fn = handlersRef.current[action];
            if (fn) {
                console.log(`[UIBUS] Executing handler for: ${action}`);
                fn(payload);
            } else {
                console.warn(`[UIBUS] No handler found for: ${action}`);
            }
        };

        window.addEventListener("UI_ACTION", handler);
        return () => window.removeEventListener("UI_ACTION", handler);
    }, []); // Only bind once
};
