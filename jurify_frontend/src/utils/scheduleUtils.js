// src/utils/scheduleUtils.js
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isPast, addMinutes, startOfDay, endOfDay } from 'date-fns';

// Constants
export const TIME_PERIODS = {
  MORNING: 'Morning',
  NOON: 'Noon',
  EVENING: 'Evening'
};

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'CONFIRMED',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

// 30-minute slot generator
export const generate30MinuteSlots = (startTime, endTime) => {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0, 0);

  let currentTime = startDate;
  while (currentTime < endDate) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, 30);
  }

  return slots;
};

// Generate half-hour slots for multi-selection (07:00 AM - 10:00 PM)
export const generateHalfHourSlots = (start = "07:00", end = "22:00") => {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  let current = h * 60 + m;
  const endMinutes = parseInt(end.split(":")[0]) * 60;

  while (current < endMinutes) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;

    const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    slots.push(label);
    current = current + 30;
  }

  return slots;
};

// Generate 30-minute slots for extended business hours (7:00 AM - 10:00 PM)
export const STANDARD_SLOTS = generateHalfHourSlots('07:00', '22:00');

// Export half-hour slots for use in components
export const HALF_HOUR_SLOTS = generateHalfHourSlots("07:00", "22:00");

// TIME_RANGES to use 30-minute slots (7 AM - 10 PM)
export const TIME_RANGES = {
  [TIME_PERIODS.MORNING]: generate30MinuteSlots('07:00', '12:00'),
  [TIME_PERIODS.NOON]: generate30MinuteSlots('12:00', '17:00'),
  [TIME_PERIODS.EVENING]: generate30MinuteSlots('17:00', '22:00')
};

// Group slots by hour ranges for grouped UI rendering
export const groupSlotsByHour = (slots) => {
  const grouped = {};

  slots.forEach(slot => {
    const hour = Number(slot.time.split(':')[0]);

    let rangeStart;
    let rangeEnd;

    if (hour < 17) {
      // Use 3rd blocks for day periods aligned to 0, 3, 6, 9, 12, 15
      rangeStart = Math.floor(hour / 3) * 3;
      rangeEnd = rangeStart + 3;
    } else {
      // Use 2rd blocks for evening period aligned to 17, 19, 21
      rangeStart = Math.floor((hour - 1) / 2) * 2 + 1; // Align 17, 19, 21
      // Correction: simple math for 17, 19, 21
      if (hour >= 17 && hour < 19) rangeStart = 17;
      else if (hour >= 19 && hour < 21) rangeStart = 19;
      else rangeStart = 21;

      rangeEnd = rangeStart + 2;
    }

    // Clamp to business hours (7 AM - 10 PM)
    if (rangeStart < 7) rangeStart = 7;
    if (rangeEnd > 22) rangeEnd = 22;

    const rangeKey = `${rangeStart}-${rangeEnd}`;

    if (!grouped[rangeKey]) {
      grouped[rangeKey] = [];
    }
    grouped[rangeKey].push(slot);
  });

  return grouped;
};

// ====================================================
// 📅 CALENDAR HELPERS
// ====================================================

export const getMonthDays = (date) => {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date)
  });
};

export const navigateMonth = (date, direction) => {
  return direction === 'prev' ? addMonths(date, -1) : addMonths(date, 1);
};

export const isSameCalendarDay = (dateA, dateB) => {
  return isSameDay(dateA, dateB);
};

// ====================================================
// ⏰ TIME HELPERS
// ====================================================

export const normalizeTime = (timeString) => {
  if (!timeString) return null;

  // Handle array [hour, minute] from Java LocalTime
  if (Array.isArray(timeString)) {
    const [hour, minute] = timeString;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Handle various time formats: "09:00", "09:00:00", "9:00 AM"
  const cleanTime = timeString.toString().trim();

  // Extract HH:mm format
  const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  return null;
};

export const isPastSlot = (date, time) => {
  if (!date || !time) return false;

  const slotDateTime = combineDateAndTime(date, time);
  return isPast(slotDateTime);
};

export const combineDateAndTime = (date, time) => {
  if (!date || !time) return null;

  const normalizedTime = normalizeTime(time);
  if (!normalizedTime) return null;

  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);

  return slotDate;
};

// ====================================================
// 🎯 SLOT LOGIC
// ====================================================

export const isSlotBusy = (time, busySlots, bookings) => {
  if (!time) return false;

  const normalizedTime = normalizeTime(time);
  if (!normalizedTime) return false;

  // Check if slot is in backend busy slots
  const isBackendBusy = busySlots?.includes(normalizedTime) || false;

  // Check if slot is booked (ONLY if confirmed)
  const isBooked = bookings?.some(booking =>
    booking.time &&
    normalizeTime(booking.time) === normalizedTime &&
    booking.status === APPOINTMENT_STATUS.CONFIRMED
  ) || false;

  return isBackendBusy || isBooked;
};

export const buildAvailableSlots = ({
  standardSlots = STANDARD_SLOTS,
  busySlots = [],
  bookings = [],
  selectedDate = new Date()
}) => {
  if (!Array.isArray(standardSlots) || !selectedDate) {
    return [];
  }

  return standardSlots.map(time => {
    const normalizedTime = normalizeTime(time);
    const isPast = isPastSlot(selectedDate, normalizedTime);
    const busy = isSlotBusy(normalizedTime, busySlots, bookings);

    return {
      time: normalizedTime,
      available: !busy && !isPast,
      isPast,
      isBusy: busySlots?.includes(normalizedTime) || false,
      isBooked: bookings?.some(booking =>
        booking.time &&
        normalizeTime(booking.time) === normalizedTime &&
        booking.status === APPOINTMENT_STATUS.CONFIRMED
      ) || false
    };
  });
};

export const getSlotsByTimePeriod = (slots, period) => {
  if (!Array.isArray(slots) || !TIME_RANGES[period]) {
    return [];
  }

  return slots.filter(slot =>
    TIME_RANGES[period].includes(slot.time)
  );
};

// ====================================================
// 📋 BOOKING VALIDATION
// ====================================================

export const canBookSlot = (slot, selectedDate) => {
  if (!slot || !selectedDate) return false;

  // Check if slot is available
  if (!slot.available) return false;

  // Check if slot is in the past
  if (slot.isPast) return false;

  return true;
};

export const canReschedule = (booking, userRole) => {
  if (!booking) return false;

  // Only confirmed appointments can be rescheduled
  if (booking.status !== APPOINTMENT_STATUS.CONFIRMED) return false;

  // All users can reschedule their own appointments
  // Admins can reschedule any appointment
  return userRole === 'USER' || userRole === 'ADMIN';
};

export const canCancel = (booking, userRole) => {
  if (!booking) return false;

  // Can't cancel already cancelled or rejected appointments
  if (booking.status === APPOINTMENT_STATUS.CANCELLED ||
    booking.status === APPOINTMENT_STATUS.REJECTED) {
    return false;
  }

  // All users can cancel their own appointments
  // Admins can cancel any appointment
  return userRole === 'USER' || userRole === 'ADMIN';
};

// ====================================================
// 🔒 SAFETY HELPERS
// ====================================================

export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue;

  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};

export const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

export const safeString = (value, defaultValue = '') => {
  return typeof value === 'string' ? value : defaultValue;
};

// ====================================================
// 🎨 UI HELPERS
// ====================================================

export const formatEventTime = (timeString) => {
  if (!timeString) return '';

  try {
    const normalizedTime = normalizeTime(timeString);
    if (!normalizedTime) return timeString;

    const [hours, minutes] = normalizedTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return format(date, 'h:mm a');
  } catch {
    return timeString;
  }
};

export const formatAppointmentDate = (dateString) => {
  if (!dateString) return '';

  try {
    let date;
    if (Array.isArray(dateString)) {
      // Handle [yyyy, MM, dd] or [yyyy, MM, dd, HH, mm]
      const [year, month, day, hour = 0, minute = 0] = dateString;
      date = new Date(year, month - 1, day, hour, minute);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return String(dateString);

    return format(date, 'MMM d, yyyy');
  } catch {
    return String(dateString);
  }
};

export const formatAppointmentTime = (timeString) => {
  return formatEventTime(timeString);
};

// ====================================================
// 🔧 VALIDATION HELPERS
// ====================================================

export const validateBookingData = (selectedDate, selectedSlot, title, notes) => {
  const errors = {};

  if (!selectedDate) {
    errors.date = 'Please select a date';
  }

  if (!selectedSlot) {
    errors.slot = 'Please select a time slot';
  }

  if (!title?.trim()) {
    errors.title = 'Please enter a title';
  }

  if (selectedSlot && selectedDate && isPastSlot(selectedDate, selectedSlot)) {
    errors.slot = 'Cannot book appointments in the past';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const buildBookingPayload = (selectedDate, selectedSlot, title, notes, providerId, userId, caseId, durationMinutes = 30) => {
  return {
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: normalizeTime(selectedSlot) + ':00',
    title: safeString(title?.trim()),
    notes: safeString(notes?.trim()),
    providerId: providerId,
    requesterId: userId,
    caseId: caseId || null,
    durationMinutes: durationMinutes
  };
};

// Duration helper for multi-slot selection
export const calculateDurationMinutes = (slots = []) => {
  if (!Array.isArray(slots) || slots.length === 0) return 30;
  return slots.length * 30;
};

// Error handling utilities
export const handleApiError = (error, defaultMessage = 'Operation failed') => {
  const message = error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    defaultMessage;

  console.error('API Error:', error);
  return message;
};

// Empty state checks
export const hasProviders = (providers) => {
  return providers && Array.isArray(providers) && providers.length > 0;
};

export const hasAvailableSlots = (availableSlots) => {
  return availableSlots && availableSlots.some(slot => slot.available);
};

export const hasAppointmentsForDate = (appointments, date) => {
  if (!appointments || !date) return false;
  const dateStr = format(date, "yyyy-MM-dd");
  return appointments.some(apt => apt.date === dateStr);
};

// URL parameter utilities
export const cleanOAuthParams = (searchParams, setSearchParams) => {
  if (searchParams.get('oauth_success')) {
    setSearchParams({});
  }
};

// Debounce utility for API calls
export const createDebouncedFetcher = (fetchFn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fetchFn(...args), delay);
  };
};

// Get upcoming appointments for a user
export const getUpcomingAppointments = (appointments, userId) => {
  if (!appointments || !userId) return [];

  const now = new Date();
  return safeArray(appointments).filter(apt => {
    const aptDateTime = combineDateAndTime(new Date(apt.date), apt.time);
    return (apt.requesterId === userId || apt.providerId === userId) &&
      aptDateTime > now &&
      apt.status !== APPOINTMENT_STATUS.CANCELLED &&
      apt.status !== APPOINTMENT_STATUS.REJECTED;
  }).sort((a, b) => {
    const dateA = combineDateAndTime(new Date(a.date), a.time);
    const dateB = combineDateAndTime(new Date(b.date), b.time);
    return dateA - dateB;
  });
};

// ====================================================
// 🔄 STATE HELPERS
// ====================================================

// Custom hook for loading state (instead of utility function)
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => setLoading(false), []);
  const setErrorMessage = useCallback((message) => setError(message), []);
  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setErrorMessage,
    clearError
  };
};

export const getAppointmentAriaLabel = (appointment) => {
  if (!appointment) return 'Appointment';

  const timeStr = formatEventTime(appointment.time);
  const dateStr = formatAppointmentDate(appointment.date);

  return `Appointment on ${dateStr} at ${timeStr}, Status: ${appointment.status}, Title: ${appointment.title || 'Consultation'}`;
};

export const getSlotAriaLabel = (slot, selectedDate) => {
  if (!slot || !selectedDate) return 'Time slot';

  const dateStr = format(selectedDate, 'MMMM d, yyyy');
  const timeStr = formatEventTime(slot.time);

  if (slot.isPast) {
    return `${timeStr} on ${dateStr} - Past time, not available`;
  }

  if (!slot.available) {
    return `${timeStr} on ${dateStr} - Not available`;
  }

  return `${timeStr} on ${dateStr} - Available, click to select`;
};

export const handleSlotKeyboardNavigation = (event, slots, currentIndex, onSelect) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % slots.length;
      if (slots[nextIndex]?.available) {
        onSelect(slots[nextIndex].time);
      }
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + slots.length) % slots.length;
      if (slots[prevIndex]?.available) {
        onSelect(slots[prevIndex].time);
      }
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (slots[currentIndex]?.available) {
        onSelect(slots[currentIndex].time);
      }
      break;
  }
};

export const getUserAppointmentPermissions = (appointment, userRole, userId) => {
  if (!appointment) {
    return {
      canCancel: false,
      canReschedule: false,
      canAccept: false,
      canReject: false
    };
  }

  const isOwner = appointment.requesterId === userId;
  const isProvider = appointment.providerId === userId;
  const isAdmin = userRole === 'ADMIN';

  return {
    canCancel: canCancel(appointment, userRole) && (isOwner || isAdmin),
    canReschedule: canReschedule(appointment, userRole) && (isOwner || isAdmin),
    canAccept: (userRole === 'LAWYER' || userRole === 'NGO') && isProvider && appointment.status === APPOINTMENT_STATUS.PENDING,
    canReject: (userRole === 'LAWYER' || userRole === 'NGO') && isProvider && appointment.status === APPOINTMENT_STATUS.PENDING
  };
};
