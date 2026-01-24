import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from './useChatbot';
import { chatbotAnalyticsService } from '../../services/chatbotAnalyticsService';
import { useChatbotNavigation } from '../../hooks/useChatbotNavigation';
import { chatbotContextStore } from '../../services/chatbotContextStore';
import { triggerUIAction } from '../../services/uiActionBus';
import ChatbotImage from '../../assets/Chatbot.png';


const ChatWindow = ({ onClose, role }) => {
    const { messages, isLoading, sendMessage, addBotMessage } = useChatbot();
    const [input, setInput] = useState('');
    const { navigateTo } = useChatbotNavigation();
    const messagesEndRef = useRef(null);
    const lastProcessedMessageIndex = useRef(-1);

    // Auto-trigger UI Actions
    useEffect(() => {
        const lastMsgIndex = messages.length - 1;
        const lastMsg = messages[lastMsgIndex];


        if (lastMsgIndex > lastProcessedMessageIndex.current && lastMsg && lastMsg.sender === 'bot' && lastMsg.action && lastMsg.action.autoTrigger) {
            console.log("Auto-triggering action:", lastMsg.action);

            // Trigger specific UI Action event if present
            if (lastMsg.action.uiAction) {
                triggerUIAction(lastMsg.action.uiAction, lastMsg.action.payload);
            }

            // Trigger robust URL navigation if tab is provided (ensures deep linking/refresh persistence)
            if (lastMsg.action.tab) {
                navigateTo(lastMsg.action.tab, lastMsg.action.reason || lastMsg.action.label || 'ui_action');
            }

            // Set context for follow-up only if an action occurred
            if (lastMsg.action.uiAction || lastMsg.action.tab) {
                chatbotContextStore.setNavigationContext(lastMsg.action.label, lastMsg.action.reason || 'ui_action');

                // trigger smart follow-up logic immediately or after small delay
                setTimeout(() => {
                    const currentContext = chatbotContextStore.getContext();
                    if (currentContext && currentContext.status === 'PENDING') {
                        addBotMessage({
                            text: `Did that solve your problem?`,
                            isFollowUp: true,
                            context: currentContext
                        });
                    }
                }, 30000);
            }

            lastProcessedMessageIndex.current = lastMsgIndex;
        } else if (lastMsgIndex > lastProcessedMessageIndex.current && lastMsg && lastMsg.sender === 'bot') {
            // Mark non-auto-trigger messages as processed too, to avoid re-checking
            lastProcessedMessageIndex.current = lastMsgIndex;
        }
    }, [messages]);

    // Fetch smart greeting on mount
    useEffect(() => {
        const fetchGreeting = async () => {
            const greeting = await chatbotAnalyticsService.getSmartGreeting(role);
            if (greeting) {
                addBotMessage(greeting);
            }
        };
        fetchGreeting();

        // Check for pending follow-up (e.g. user returning)
        const checkFollowUp = () => {
            const context = chatbotContextStore.getContext();

            if (context && context.status === 'PENDING') {

                const isRecent = (Date.now() - context.timestamp) < 24 * 60 * 60 * 1000;
                if (isRecent) {
                    addBotMessage({
                        text: `Did you find what you were looking for in the ${context.lastNavigationTab} tab?`,
                        isFollowUp: true,
                        context: context
                    });
                }
            }
        };

        // Small delay to ensure greeting comes first if any
        setTimeout(checkFollowUp, 1000);

    }, [role]); // Only run when role changes/init


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input, role);
            setInput('');
        }
    };

    const handleActionClick = (action) => {
        if (action) {

            // Check for UI Action
            if (action.uiAction) {
                triggerUIAction(action.uiAction, action.payload);
                addBotMessage("I’ve opened the form for you. Let me know if you need help filling it.");


                setTimeout(() => {
                    const currentContext = chatbotContextStore.getContext();

                    chatbotContextStore.setNavigationContext(action.label, action.reason || 'ui_action');

                }, 500);

                // Trigger visual follow up check
                setTimeout(() => {
                    const currentContext = chatbotContextStore.getContext();
                    if (currentContext && currentContext.status === 'PENDING') {
                        addBotMessage({
                            text: `Did that solve your problem?`,
                            isFollowUp: true,
                            context: currentContext
                        });
                    }
                }, 30000);

                return;
            }

            // Fallback to URL navigation if no uiAction
            if (action.tab) {
                addBotMessage(`Opening ${action.label} for you...`);
                // Small delay to allow user to read
                setTimeout(() => {
                    navigateTo(action.tab, action.reason);

                    // Trigger follow-up after 30 seconds if chat stays open
                    setTimeout(() => {
                        const currentContext = chatbotContextStore.getContext();
                        if (currentContext && currentContext.status === 'PENDING') {
                            addBotMessage({
                                text: `Did that solve your problem?`,
                                isFollowUp: true,
                                context: currentContext
                            });
                        }
                    }, 30000);

                }, 800);
            }
        }
    };

    const handleFollowUpResponse = (response, context) => {
        if (response === 'yes') {
            addBotMessage("Glad I could help! Let me know if you need anything else.");
            chatbotContextStore.clearContext();
            chatbotContextStore.saveInsight({
                solved: true,
                reason: context.navigationReason,
                tab: context.context?.lastNavigationTab
            });
        } else {
            // Handle No
            chatbotContextStore.saveInsight({
                solved: false,
                reason: context.navigationReason
            });

            // Clarification logic
            const reason = context.navigationReason;
            let clarificationMsg = "How can I help you further?";

            if (reason === 'pending_appointments') {
                clarificationMsg = "Are you trying to reschedule or contact your lawyer?";
            } else if (reason === 'case_status') {
                clarificationMsg = "Are you looking for case progress or documents?";
            } else if (reason === 'submit_case') {
                clarificationMsg = "Do you need help with the legal forms?";
            } else if (reason === 'verification_pending') {
                clarificationMsg = "Are you having trouble with the verification documents?";
            }

            addBotMessage(clarificationMsg);
            // Could add specific buttons here based on clarification, but simple text is okay for now mostly.
            // Or prompt checking support.
            setTimeout(() => {
                addBotMessage({
                    text: "If you are still stuck, you can contact support.",
                    action: { label: "Contact Support", tab: "support" }
                });
            }, 2000);

            chatbotContextStore.clearContext(); // Cleared after handling
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const promptsByRole = {
        CITIZEN: [
            "How to submit a case?",
            "How to track my case?",
            "How does verification work?",
            "View dashboard stats"
        ],
        LAWYER: [
            "How do I accept cases?",
            "Where can I manage appointments?",
            "How to find new cases?",
            "Update my availability"
        ],
        NGO: [
            "What is the role of an NGO?",
            "How to monitor case distribution?",
            "Process for verifying documents",
            "View beneficiary stats"
        ],
        ADMIN: [
            "How to approve users?",
            "View platform analytics",
            "Manage user roles"
        ]
    };

    const userRoleKey = role ? role.toUpperCase() : 'CITIZEN';
    const quickPrompts = promptsByRole[userRoleKey] || promptsByRole['CITIZEN'];

    const handleQuickPrompt = (prompt) => {
        sendMessage(prompt, role);
    };

    return (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 transform scale-100 origin-bottom-right font-sans h-[560px]">
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center text-white">
                <div className="flex items-center space-x-2">
                    <div className="bg-white/20 p-1 rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
                        <img src={ChatbotImage} alt="Jurify Bot" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Jurify Helper</h3>
                        <span className="text-xs text-blue-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            {role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Citizen'} Assistant
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide bg-gray-50 dark:bg-gray-900 h-80 min-h-[300px]">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1 overflow-hidden border border-primary/20">
                                    <img src={ChatbotImage} alt="Bot" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                <p>{msg.text}</p>
                                {msg.action && (
                                    <button
                                        onClick={() => handleActionClick(msg.action)}
                                        className="mt-3 text-xs bg-primary/10 hover:bg-primary/20 text-primary dark:text-blue-300 font-medium py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors w-full justify-center"
                                    >
                                        <span>{msg.action.label}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </button>
                                )}

                                {msg.isFollowUp && (
                                    <div className="mt-3 flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleFollowUpResponse('yes', msg.context)}
                                            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            ✅ Yes, thanks
                                        </button>
                                        <button
                                            onClick={() => handleFollowUpResponse('no', msg.context)}
                                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            ❌ Still need help
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1 overflow-hidden border border-primary/20">
                                <img src={ChatbotImage} alt="Bot" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 flex space-x-1 items-center h-10">
                                <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-gray-500 text-xs font-medium">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Actions (only show if few messages or initially?) - keeping it simple as requested "Optional quick question buttons" */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 overflow-x-auto whitespace-nowrap scrollbar-hide flex space-x-2 border-t border-gray-100 dark:border-gray-800">
                {quickPrompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Jurify..."
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
