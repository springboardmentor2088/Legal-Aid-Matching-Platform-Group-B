import { api } from './api';

export const chatbotAnalyticsService = {
    getSmartGreeting: async (role) => {
        if (!role) return null;

        const roleKey = role.toUpperCase();

        try {
            if (roleKey === 'CITIZEN') {

                const [appointments, cases] = await Promise.all([
                    api.get('/appointments/upcoming').catch(() => []),
                    api.get('/cases').catch(() => [])
                ]);


                const pendingAppointments = appointments.filter(a => a.status === 'PENDING' || a.status === 'REQUESTED');

                if (pendingAppointments.length > 0) {
                    return {
                        text: "You have pending appointment requests. Want to check your schedule?",
                        action: { label: "Check Schedule", tab: "schedule", uiAction: "OPEN_SCHEDULE_MODAL", reason: "pending_appointments" }
                    };
                }

                const activeCases = cases.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS');
                if (activeCases.length > 0) {
                    return {
                        text: "Your case is currently in progress. I can help you track it.",
                        action: { label: "View Cases", tab: "cases", reason: "case_status" }

                    };
                }

                return {
                    text: "Need help submitting a new case?",
                    action: { label: "Submit Case", tab: "submit-case", reason: "submit_case" }
                };
            }

            if (roleKey === 'LAWYER') {
                const [cases, appointments] = await Promise.all([
                    api.get('/cases').catch(() => []),
                    api.get('/appointments/upcoming').catch(() => [])
                ]);


                const assignedCases = cases.filter(c => c.status === 'ASSIGNED');
                if (assignedCases.length > 0) {
                    return {
                        text: "You have new cases waiting for review.",
                        action: { label: "Review Cases", tab: "cases", uiAction: "OPEN_ASSIGNED_CASE", reason: "case_review" }
                    };
                }

                // "If schedule today: -> You have appointments scheduled today."
                const today = new Date().toISOString().split('T')[0];
                const appointmentsToday = appointments.filter(a => a.date && a.date.startsWith(today));

                if (appointmentsToday.length > 0) {
                    return {
                        text: "You have appointments scheduled today.",
                        action: { label: "View Schedule", tab: "schedule", uiAction: "OPEN_SCHEDULE_MODAL", reason: "appointments_today" }
                    };
                }
            }

            if (roleKey === 'NGO') {
                const [profile] = await Promise.all([
                    api.get('/auth/me').catch(() => ({})) // Get full profile for verification status
                ]);


                const isVerificationPending = profile.verificationStatus === 'PENDING';

                if (isVerificationPending) {
                    return {
                        text: "There are pending verifications needing your review.",
                        action: { label: "Go to Verification", tab: "verification", reason: "verification_pending" }
                    };
                }
            }

            return null; // Fallback to default greeting
        } catch (error) {
            console.error("Failed to fetch smart greeting analytics", error);
            return null;
        }
    }
};
