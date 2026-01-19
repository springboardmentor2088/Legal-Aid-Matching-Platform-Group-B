// calendarService.js
import api from './api';

export default {
    // Generate Google OAuth URL
    connectCalendar: async (redirectUri) => {
        return api.get(`/calendar/connect?redirectUri=${encodeURIComponent(redirectUri)}`);
    },

    // Exchange code for token
    syncCalendar: async (code, redirectUri) => {
        return api.post('/calendar/sync', { code, redirectUri });
    },

    // Get available slots (merged busy times)
    getAvailableSlots: async (providerId, date, requesterId) => {
        // date format: yyyy-MM-dd
        let url = `/appointments/slots?providerId=${providerId}&date=${date}`;
        if (requesterId) {
            url += `&requesterId=${requesterId}`;
        }
        return api.get(url);
    },

    // Create appointment request
    requestAppointment: async (appointmentData) => {
        return api.post('/appointments/request', appointmentData);
    },

    // Get appointments for provider
    getProviderAppointments: async (providerId) => {
        return api.get(`/appointments/provider/${providerId}`);
    },

    // Update status (Accept/Reject)
    updateStatus: async (id, status) => {
        return api.post(`/appointments/${id}/status`, { status });
    },

    // Reschedule appointment
    rescheduleAppointment: async (appointmentId, newDate, newTime) => {
        return api.put(`/appointments/${appointmentId}/reschedule`, {
            date: newDate,
            time: newTime
        });
    },

    // Cancel appointment
    cancelAppointment: async (id) => {
        return api.post(`/appointments/${id}/cancel`);
    },

    // Fetch all providers (Lawyers/NGOs) for dropdown
    getAllProviders: async () => {
        const res = await api.get('/public/directory/search?type=LAWYER&size=100');
        return res.content || [];
    },

    // Check if Google Calendar is connected
    checkStatus: async () => {
        return api.get('/calendar/status');
    }
};
