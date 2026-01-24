import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatbotContextStore } from '../services/chatbotContextStore';

export const useChatbotNavigation = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const navigateTo = (tabName, reason) => {
        if (!tabName) return;

        // Track context before navigating
        chatbotContextStore.setNavigationContext(tabName, reason);

        // Update the 'tab' search parameter
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', tabName);
            return newParams;
        });
    };

    return { navigateTo };
};
