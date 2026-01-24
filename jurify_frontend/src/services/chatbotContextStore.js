
const STORAGE_KEY_CONTEXT = 'chatbot_navigation_context';
const STORAGE_KEY_INSIGHTS = 'chatbot_insights';

export const chatbotContextStore = {
    setNavigationContext: (tab, reason) => {
        const context = {
            lastNavigationTab: tab,
            navigationReason: reason || 'general',
            timestamp: Date.now(),
            status: 'PENDING'
        };
        localStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(context));
    },

    getContext: () => {
        try {
            const context = localStorage.getItem(STORAGE_KEY_CONTEXT);
            return context ? JSON.parse(context) : null;
        } catch (e) {
            console.error("Error parsing context", e);
            return null;
        }
    },

    clearContext: () => {
        localStorage.removeItem(STORAGE_KEY_CONTEXT);
    },

    saveInsight: (data) => {
        try {
            const existing = localStorage.getItem(STORAGE_KEY_INSIGHTS);
            const insights = existing ? JSON.parse(existing) : [];
            insights.push({ ...data, timestamp: Date.now() });
            localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(insights));
        } catch (e) {
            console.error("Error saving insight", e);
        }
    }
};
