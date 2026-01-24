import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { FiCalendar, FiClock, FiEdit2, FiX, FiSun, FiMoon, FiUser } from "react-icons/fi";
import calendarService from "../../services/calendarService";
import { caseService } from "../../services/caseService";
import { useGlobalLoader } from "../../context/GlobalLoaderContext";
import { useToast } from "../common/ToastContext";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getMonthDays,
  navigateMonth,
  TIME_PERIODS,
  TIME_RANGES,
  APPOINTMENT_STATUS,
  STANDARD_SLOTS,
  buildAvailableSlots,
  canBookSlot,
  canReschedule,
  canCancel,
  formatAppointmentDate,
  formatAppointmentTime,
  buildBookingPayload,
  handleApiError,
  hasProviders,
  hasAvailableSlots,
  hasAppointmentsForDate,
  cleanOAuthParams,
  createDebouncedFetcher,
  getUserAppointmentPermissions,
  getSlotAriaLabel,
  getAppointmentAriaLabel,
  handleSlotKeyboardNavigation,
  getSlotsByTimePeriod,
  validateBookingData,
  useLoadingState,
  normalizeTime,
  groupSlotsByHour,
  HALF_HOUR_SLOTS,
  calculateDurationMinutes
} from "../../utils/scheduleUtils";
import { addMinutes } from "date-fns";
import { useTheme } from "../../context/ThemeContext";

// Helper to format slot as range display
const formatSlotRange = (time, durationMinutes = 30) => {
  const start = time; // time is already in HH:mm format
  const startDate = new Date(`2000-01-01T${start}:00`);
  const endDate = addMinutes(startDate, durationMinutes);
  const end = format(endDate, 'HH:mm');
  return `${start} - ${end}`;
};

// Helper to get appointments for a specific day
const getDayAppointments = (day, scheduleEvents) => {
  const dateStr = format(day, "yyyy-MM-dd");
  return scheduleEvents.filter(a =>
    a.date === dateStr &&
    a.status !== APPOINTMENT_STATUS.CANCELLED
  );
};

// Helper to infer duration from appointment data
const inferDurationMinutes = (appointment, recentlyBookedSlots) => {
  // If backend provides duration, use it
  if (appointment.durationMinutes) {
    return appointment.durationMinutes;
  }

  // Check if this was recently booked with multi-slot selection
  const recentBooking = recentlyBookedSlots.find(
    slot => slot.date === appointment.date && slot.time === appointment.time?.substring(0, 5)
  );

  if (recentBooking) {
    return recentBooking.durationMinutes;
  }

  // Default fallback: try to infer from time pattern or default to 30
  // For now, default to 30 minutes
  return 30;
};

// Helper to build slot blocks for visual representation
const buildSlotBlocks = (startTime, durationMins = 60) => {
  const blocks = Math.min(durationMins / 30, 2);
  return Array.from({ length: 2 }).map((_, i) => i < blocks);
};

// Material Icon helper
const MaterialIcon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined align-middle ${className}`}>
    {name}
  </span>
);

// Helper to format hours (e.g., 7 -> "7 am", 14 -> "2 pm")
const formatHour = (h) => {
  if (h === 0) return '12 am';
  if (h < 12) return `${h} am`;
  if (h === 12) return '12 pm';
  return `${h - 12} pm`;
};

const ScheduleDashboard = ({ userRole: propUserRole, user: propUser, selectedProviderId: forcedProviderId, refreshKey }) => {
  const { user: authUser, userRole: authRole } = useAuth();
  const user = propUser || authUser;
  const userRole = propUserRole || (user?.role || authRole);

  const { isDarkMode } = useTheme();
  const { startLoading, stopLoading } = useGlobalLoader();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerBusySlots, setProviderBusySlots] = useState([]);

  // URL Params
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId');

  // Case Context
  const [caseContext, setCaseContext] = useState(null);
  const [userCases, setUserCases] = useState([]);

  // Fetch User Cases (for Citizens)
  // Fetch User Cases (For ALL roles now, to allow selection)
  useEffect(() => {
    // Determine if we should load cases. 
    // Citizens: see their cases.
    // Lawyers/NGOs: see assigned cases.
    // Logic: Always fetch "my cases" if we want to support this flow.
    const fetchUserCases = async () => {
      try {
        const cases = await caseService.getMyCases();
        setUserCases(cases);
      } catch (err) {
        console.error("Failed to fetch user cases", err);
      }
    };
    fetchUserCases();
  }, [userRole]);

  const handleCaseSelect = async (caseId) => {
    console.log('[ScheduleDashboard] handleCaseSelect called with caseId:', caseId);

    if (!caseId) {
      setSearchParams({});
      setCaseContext(null);
      setSelectedProviderId(null);
      return;
    }

    setSearchParams({ caseId });

    // Ensure caseId is a number
    const numericCaseId = typeof caseId === 'string' ? parseInt(caseId, 10) : caseId;
    console.log('[ScheduleDashboard] Looking for case with ID:', numericCaseId);

    const mapCase = (c) => ({
      ...c,
      displayId: c.displayId || `CASE-${new Date(c.createdAt || Date.now()).getFullYear()}-${c.id.toString().padStart(3, '0')}`
    });

    // Check if we already have the full case object in the list
    const existingCase = userCases.find(c => c.id === numericCaseId);
    console.log('[ScheduleDashboard] Existing case in userCases:', existingCase);

    if (existingCase) {
      const mapped = mapCase(existingCase);
      setCaseContext(mapped);
      console.log('[ScheduleDashboard] Set case context from userCases:', mapped);
      if (mapped.lawyerId) {
        setSelectedProviderId(mapped.lawyerId);
        console.log('[ScheduleDashboard] Set provider ID from case:', mapped.lawyerId);
      } else {
        // If full details might be missing, fetch specifically
        try {
          const fullCase = await caseService.getCaseById(numericCaseId);
          const fullMapped = mapCase(fullCase);
          setCaseContext(fullMapped);
          console.log('[ScheduleDashboard] Fetched full case details:', fullMapped);
          if (fullMapped.lawyerId) setSelectedProviderId(fullMapped.lawyerId);
        } catch (e) {
          console.error("[ScheduleDashboard] Failed to fetch full case details:", e);
        }
      }
    } else {
      // Fallback fetch
      console.log('[ScheduleDashboard] Case not in userCases, fetching from API...');
      try {
        const res = await caseService.getCaseById(numericCaseId);
        const mapped = mapCase(res);
        setCaseContext(mapped);
        console.log('[ScheduleDashboard] Fetched case from API:', mapped);
        if (mapped.lawyerId) setSelectedProviderId(mapped.lawyerId);
      } catch (err) {
        console.error('[ScheduleDashboard] Failed to load case details:', err);
        showToast({ type: 'error', message: 'Failed to load case details' });
      }
    }
  };

  // Use forcedProviderId if provided, else waiting for fetch or user selection
  const [selectedProviderId, setSelectedProviderId] = useState(forcedProviderId || (userRole === 'LAWYER' ? user?.id : null));

  // Form state
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(TIME_PERIODS.MORNING);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingErrors, setBookingErrors] = useState({});

  // Modal states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionType, setActionType] = useState(''); // 'cancel' or 'reschedule'

  // Modal-local calendar state to prevent main calendar contamination
  const [modalMonth, setModalMonth] = useState(new Date());
  const [modalDate, setModalDate] = useState(new Date());

  // Expanded day state for popover
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedDayData, setExpandedDayData] = useState(null);

  // Track recently booked appointments for duration inference
  const [recentlyBookedSlots, setRecentlyBookedSlots] = useState([]);

  const { showToast } = useToast();

  // Simple status badge component (since not exported from utils)
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      [APPOINTMENT_STATUS.CONFIRMED]: {
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium',
        text: 'Confirmed'
      },
      [APPOINTMENT_STATUS.PENDING]: {
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium',
        text: 'Pending'
      },
      [APPOINTMENT_STATUS.CANCELLED]: {
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium',
        text: 'Cancelled'
      },
      [APPOINTMENT_STATUS.REJECTED]: {
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium',
        text: 'Rejected'
      }
    };

    const config = statusConfig[status] || statusConfig[APPOINTMENT_STATUS.PENDING];
    return <span className={config.className}>{config.text}</span>;
  };

  // Memoized calendar days
  const days = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const monthStartWeekday = useMemo(() => startOfMonth(currentMonth).getDay(), [currentMonth]);

  // Memoized available slots - fixed to use object parameter
  const availableSlots = useMemo(() => {
    const bookingsForDate = scheduleEvents.filter(apt =>
      apt.date === format(selectedDate, "yyyy-MM-dd")
    );

    return buildAvailableSlots({
      standardSlots: STANDARD_SLOTS,
      busySlots: providerBusySlots,
      bookings: bookingsForDate,
      selectedDate: selectedDate
    });
  }, [scheduleEvents, providerBusySlots, selectedDate]);

  // Memoized slots by time period - computed once
  const slotsByPeriod = useMemo(() => ({
    [TIME_PERIODS.MORNING]: getSlotsByTimePeriod(availableSlots, TIME_PERIODS.MORNING),
    [TIME_PERIODS.NOON]: getSlotsByTimePeriod(availableSlots, TIME_PERIODS.NOON),
    [TIME_PERIODS.EVENING]: getSlotsByTimePeriod(availableSlots, TIME_PERIODS.EVENING)
  }), [availableSlots]);

  // Memoized grouped slots by hour for UI rendering
  const groupedSlots = useMemo(() => {
    return groupSlotsByHour(slotsByPeriod[selectedTimePeriod]);
  }, [slotsByPeriod, selectedTimePeriod]);



  // Cache for availability results
  const availabilityCache = useRef(new Map());

  // Auto-refresh interval
  const refreshInterval = useRef(null);

  // Debounced fetch functions
  const debouncedFetchAppointments = useCallback(
    createDebouncedFetcher(async (providerId) => {
      if (!providerId) return;
      try {
        const apps = await calendarService.getProviderAppointments(providerId);
        setScheduleEvents(apps || []);
      } catch (err) {
        const errorMessage = handleApiError(err, 'Failed to load appointments');
        showToast({ type: 'error', message: errorMessage });
      }
    }, 300),
    [showToast]
  );

  const debouncedFetchAvailability = useCallback(
    createDebouncedFetcher(async (providerId, date, requesterId) => {
      if (!providerId || !date) return;

      setLoadingSlots(true); // Start loading

      // Check cache first
      const cacheKey = `${providerId}_${requesterId || 'no-req'}_${format(date, 'yyyy-MM-dd')}`;
      if (availabilityCache.current.has(cacheKey)) {
        setProviderBusySlots(availabilityCache.current.get(cacheKey));
        setLoadingSlots(false);
        return;
      }

      try {
        const busy = await calendarService.getAvailableSlots(providerId, format(date, "yyyy-MM-dd"), requesterId);
        console.log("Fetched busy slots (combined):", busy);
        setProviderBusySlots(busy || []);

        // Cache the result
        availabilityCache.current.set(cacheKey, busy || []);
      } catch (err) {
        console.error("Failed to fetch slots", err);
        setProviderBusySlots([]);
      } finally {
        setLoadingSlots(false); // Stop loading
      }
    }, 300),
    [availabilityCache] // Include cache in dependencies
  );

  // Real-time refresh listener
  useEffect(() => {
    const handleRefresh = (event) => {
      console.log("Real-time refresh triggered for schedule:", event.detail);

      // 1. Clear availability cache to ensure fresh fetch
      if (availabilityCache.current) {
        availabilityCache.current.clear();
      }

      // 2. Fetch appointments
      if (selectedProviderId) {
        debouncedFetchAppointments(selectedProviderId);
      }

      // 3. Fetch availability
      // Logic:
      // If Lawyer/NGO: Provider = Me, Requester = Client (from Case)
      // If Citizen: Provider = Lawyer (from Case), Requester = Me
      const pid = (userRole === 'LAWYER' || userRole === 'NGO') ? user?.id : selectedProviderId;
      // Determine requester
      let reqId = user?.id; // Default to current user (Citizen case)
      if ((userRole === 'LAWYER' || userRole === 'NGO') && caseContext?.citizenUserId) {
        reqId = caseContext.citizenUserId;
      }

      if (pid && selectedDate) {
        debouncedFetchAvailability(pid, selectedDate, reqId);
      }
    };

    window.addEventListener('JURIFY_REFRESH_DATA', handleRefresh);
    return () => window.removeEventListener('JURIFY_REFRESH_DATA', handleRefresh);
  }, [selectedProviderId, selectedDate, user?.id, userRole, debouncedFetchAppointments, debouncedFetchAvailability]);

  // Event handlers
  const handlePrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNext = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setSelectedSlot('');
    setBookingErrors({});
  };

  const handleHalfSlotSelect = (slot) => {
    setSelectedSlots(prev => {
      // If slot is already selected, toggle it off
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      }

      // If no slots selected, select this slot
      if (prev.length === 0) {
        return [slot];
      }

      // If one slot selected, check if new slot is adjacent
      if (prev.length === 1) {
        const existingSlot = prev[0];
        const existingTime = new Date(`2000-01-01T${existingSlot}:00`);
        const newTime = new Date(`2000-01-01T${slot}:00`);
        const timeDiff = Math.abs(newTime - existingTime) / (1000 * 60);

        // If slots are adjacent (30 min difference), allow selection for 1 hour total
        if (timeDiff === 30) {
          return [...prev, slot].sort();
        }
        // If not adjacent, reset to only the new slot
        return [slot];
      }

      // If 2 slots already selected (1 hour total), reset to only the new slot
      // This limits bookings to max 1 hour
      return [slot];
    });
  };

  const handleSlotSelect = useCallback((slot) => {
    const slotData = availableSlots.find(s => s.time === slot);
    if (slotData?.available) {
      setSelectedSlot(slot);
      setBookingErrors({});

      // Auto-scroll selected slot into view
      const slotElement = document.querySelector(`[data-slot-time="${slot}"]`);
      if (slotElement) {
        slotElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [availableSlots]);

  const handleSlotKeyDown = (event, slot, index, slots) => {
    handleSlotKeyboardNavigation(event, slots, index, handleSlotSelect);
  };

  const handleConnectCalendar = async () => {
    try {
      // Consistent OAuth redirect URI
      const redirectUri = `${window.location.origin}/dashboard`;
      const response = await calendarService.connectCalendar(redirectUri);

      // API service returns the data directly, so response IS the data object
      const oauthUrl = response?.authorizationUrl || response?.url;

      if (!oauthUrl) {
        console.error("OAuth Response:", response); // Debug log
        throw new Error('OAuth URL not found in response');
      }

      window.location.href = oauthUrl;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to connect calendar');
      showToast({ type: 'error', message: errorMessage });
    }
  };



  const handleBook = async () => {
    if (selectedSlots.length === 0) {
      setBookingErrors({ slot: 'Please select at least one time slot' });
      return;
    }

    // Sort slots and calculate duration
    const sortedSlots = [...selectedSlots].sort();
    const primarySlot = sortedSlots[0];
    const durationMinutes = sortedSlots.length * 30;

    const validation = validateBookingData(selectedDate, primarySlot, title, notes);

    if (!validation.isValid) {
      setBookingErrors(validation.errors);
      return;
    }

    // Block booking for resolved cases
    if (caseContext && (caseContext.status === 'RESOLVED' || caseContext.status === 'CLOSED')) {
      showToast({ type: 'error', message: 'Cannot book appointments for resolved cases' });
      return;
    }

    // Additional safety check using canBookSlot
    const slotData = availableSlots.find(s => s.time === primarySlot);
    if (!canBookSlot(slotData, selectedDate)) {
      setBookingErrors({ slot: 'Selected slot is not available' });
      return;
    }

    startLoading("Requesting appointment...");
    try {
      const bookingData = buildBookingPayload(
        selectedDate,
        primarySlot,
        title,
        notes,
        selectedProviderId, // Lawyer ID
        // If Lawyer/NGO, requester is the Client (from case). If Citizen, requester is Me.
        (userRole === 'LAWYER' || userRole === 'NGO') && caseContext?.citizenUserId
          ? caseContext.citizenUserId
          : user?.id,
        caseIdParam,
        durationMinutes
      );

      await calendarService.requestAppointment(bookingData);

      // Store recently booked slot for duration inference
      setRecentlyBookedSlots(prev => [
        ...prev,
        {
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: primarySlot,
          durationMinutes: durationMinutes
        }
      ]);

      stopLoading(true, 'Appointment requested successfully!');
      setTitle('');
      setNotes('');
      setSelectedSlot('');
      setSelectedSlots([]); // Clear multi-slot selection

      // Refresh appointments and availability to prevent conflicts
      debouncedFetchAppointments(selectedProviderId);
      debouncedFetchAvailability(selectedProviderId, selectedDate, user?.id);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to book appointment');
      stopLoading(false, errorMessage);

      // Auto-refresh availability on booking failure to prevent stale data
      if (err.response?.status === 409 || err.response?.status === 422) {
        debouncedFetchAvailability(selectedProviderId, selectedDate, user?.id);
      }
    } finally {
      setLoading(false); // Can keep this if needed for UI state, or remove if GlobalLoader fully replaces it. I'll keep it for local disabling if buttons depend on it.
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await calendarService.updateStatus(appointmentId, newStatus);
      showToast({
        type: 'success',
        message: `Appointment ${newStatus.toLowerCase()} successfully!`
      });

      // Refresh appointments
      debouncedFetchAppointments(selectedProviderId);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to update appointment status');
      showToast({ type: 'error', message: errorMessage });
    }
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setActionType('reschedule');
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (newDate, newSlot) => {
    if (!selectedAppointment) return;

    try {
      await calendarService.rescheduleAppointment(
        selectedAppointment.id,
        format(newDate, 'yyyy-MM-dd'),
        normalizeTime(newSlot) + ':00'  // Use normalizeTime for consistent time format
      );

      showToast({ type: 'success', message: 'Appointment rescheduled successfully!' });
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);

      // Refresh appointments
      debouncedFetchAppointments(selectedProviderId);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to reschedule appointment');
      showToast({ type: 'error', message: errorMessage });
    }
  };

  const handleCancel = (appointment) => {
    setSelectedAppointment(appointment);
    setActionType('cancel');
    setConfirmDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      await calendarService.cancelAppointment(selectedAppointment.id);

      showToast({ type: 'success', message: 'Appointment cancelled successfully!' });
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);

      // Refresh appointments
      debouncedFetchAppointments(selectedProviderId);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to cancel appointment');
      showToast({ type: 'error', message: errorMessage });
    }
  };

  // Fetch Case Context (if caseId is present in URL)
  useEffect(() => {
    if (caseIdParam) {
      // Use handleCaseSelect to ensure consistent logic
      handleCaseSelect(caseIdParam);
    }
  }, [caseIdParam]); // Only re-run when caseIdParam changes

  // Separate effect to update title when caseContext changes
  useEffect(() => {
    if (caseContext) {
      setTitle(`Meeting for Case: ${caseContext.title || caseContext.caseNumber || 'Consultation'}`);
    }
  }, [caseContext]);

  // Fetch Providers (Real Backend Data)
  useEffect(() => {
    // Only fetch providers if NOT in a forced case context or provider context
    if (userRole !== 'LAWYER' && !forcedProviderId && !caseContext) {
      const fetchProviders = async () => {
        try {
          const fetchedProviders = await calendarService.getAllProviders();

          let finalProviders = fetchedProviders;
          if (userRole === 'CITIZEN') {
            // Filter providers to only those assigned in userCases
            // Logic: Collect all unique lawyerIds from userCases
            // Note: userCases must be populated. If it's empty, we might show none?
            // Or we rely on the fact that if it's loading, we wait.
            // But here we just filter if we have cases.
            if (userCases.length > 0) {
              const assignedLawyerIds = new Set(
                userCases
                  .filter(c => c.lawyerId) // Ensure case has lawyer
                  .map(c => c.lawyerId)
              );
              finalProviders = fetchedProviders.filter(p => assignedLawyerIds.has(p.userId || p.id));
            } else {
              // If citizen has no cases, maybe show empty list or all?
              // Requirement: "Filter out unassigned lawyers".
              // Use Empty list to be safe.
              finalProviders = [];
            }
          }

          setProviders(finalProviders);

          // Auto-select first if none selected and NOT in case context
          if (finalProviders.length > 0 && !selectedProviderId && !caseIdParam) {
            setSelectedProviderId(finalProviders[0].userId || finalProviders[0].id);
          }
        } catch (err) {
          console.error("Failed to fetch providers", err);
          showToast({ type: 'error', message: "Failed to load lawyers list" });
        }
      };

      // If citizen, wait for userCases to be populated? 
      // userCases is initialized to []. We fetch it in another useEffect.
      // We should probably depend on userCases.
      fetchProviders();
    }
  }, [userRole, forcedProviderId, caseContext, caseIdParam, userCases]);

  // Check Google Calendar Connection Status
  const [isGCalConnected, setIsGCalConnected] = useState(false);

  // Poll for status or check on mount/redirect
  useEffect(() => {
    if (true) {
      const checkConnection = async () => {
        try {
          // Only check calendar status if user is authenticated and service is available
          if (calendarService && typeof calendarService.checkStatus === 'function') {
            const res = await calendarService.checkStatus();
            setIsGCalConnected(res.connected);
          } else {
            // console.warn('Calendar service not available, skipping status check');
            setIsGCalConnected(false);
          }

          // If redirected from backend with success param
          if (searchParams.get('oauth_success')) {
            showToast({ type: 'success', message: 'Google Calendar Connected Successfully!' });
            // Clear param to clean URL
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev);
              newParams.delete('oauth_success');
              return newParams;
            });
          }
        } catch (err) {
          console.error("Failed to check calendar status", err);
          // Set to false on error to prevent UI issues
          setIsGCalConnected(false);
        }
      };

      checkConnection();
    }
  }, [userRole, searchParams, setSearchParams]); // Re-run when params change (redirect back)

  // Fetch Appointments
  const loadSchedule = async () => {
    if (!selectedProviderId) return;
    try {
      const apps = await calendarService.getProviderAppointments(selectedProviderId);
      setScheduleEvents(apps || []);
    } catch (err) {
      console.error("Failed to load schedule", err);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedProviderId, refreshKey]);

  // Handle outside click to close expanded day popover
  useEffect(() => {
    const closeExpandedDay = (e) => {
      // Close if click is outside any popover content
      if (!e.target.closest('.day-popover') && !e.target.closest('.more-indicator')) {
        setExpandedDay(null);
      }
    };

    document.addEventListener('click', closeExpandedDay);
    return () => document.removeEventListener('click', closeExpandedDay);
  }, []);

  // Auto-close popover on scroll, resize, and escape key
  useEffect(() => {
    if (!expandedDay) return;

    const closePopover = () => setExpandedDay(null);

    window.addEventListener('scroll', closePopover, true);
    window.addEventListener('resize', closePopover);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePopover();
    });

    return () => {
      window.removeEventListener('scroll', closePopover, true);
      window.removeEventListener('resize', closePopover);
      window.removeEventListener('keydown', closePopover);
    };
  }, [expandedDay]);

  // Main effect to fetch availability when date or provider changes
  useEffect(() => {
    if (selectedProviderId && selectedDate) {
      // Logic:
      // If Lawyer/NGO: Provider = Me, Requester = Client (from Case)
      // If Citizen: Provider = Lawyer (from Case), Requester = Me
      let reqId = user?.id;
      if ((userRole === 'LAWYER' || userRole === 'NGO') && caseContext?.citizenUserId) {
        reqId = caseContext.citizenUserId;
      }
      debouncedFetchAvailability(selectedProviderId, selectedDate, reqId);
    }
  }, [selectedProviderId, selectedDate, user?.id, debouncedFetchAvailability]);

  // Auto-refresh availability every 20 seconds
  // Auto-refresh availability every 20 seconds
  useEffect(() => {
    if (!selectedProviderId || !selectedDate) return;

    // Set up interval
    refreshInterval.current = setInterval(() => {
      let reqId = user?.id;
      if ((userRole === 'LAWYER' || userRole === 'NGO') && caseContext?.citizenUserId) {
        reqId = caseContext.citizenUserId;
      }
      debouncedFetchAvailability(selectedProviderId, selectedDate, reqId);
    }, 20000); // 20 seconds

    // Cleanup on unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [selectedProviderId, selectedDate, debouncedFetchAvailability, userRole, caseContext, user?.id]);


  // Memoized selected slot data to avoid inline find() calls
  const selectedSlotData = useMemo(() =>
    availableSlots.find(s => s.time === selectedSlot),
    [availableSlots, selectedSlot]
  );

  // Filter events for the day
  const bookingsForDate = useMemo(() => {
    const ds = format(selectedDate, "yyyy-MM-dd");
    return scheduleEvents.filter((a) => a.date === ds);
  }, [scheduleEvents, selectedDate]);


  return (
    <div className="w-full mx-0 px-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-0 bg-primary text-white px-6 py-4">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <FiCalendar className="w-5 h-5" />
          Appointment Schedule
        </h2>

        {/* Google Calendar Connect Button */}
        <div className="flex items-center gap-2">
          {isGCalConnected ? (
            <div className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-md font-medium shadow-sm flex items-center gap-2 border border-green-200">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-4 h-4" />
              Connected
            </div>
          ) : (
            <button onClick={handleConnectCalendar} className="text-sm bg-white text-primary px-3 py-1.5 rounded-md font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-4 h-4" />
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">

        {/* SECTION 1: Case Selection (ALL Roles) */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Case to Book Appointment</label>
          <select
            value={caseContext?.id || caseIdParam || ""}
            onChange={(e) => handleCaseSelect(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
          >
            <option value="">-- Select a Case --</option>
            {userCases
              .filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REMOVED' && c.lawyerId)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} (Case #{c.displayId || c.caseNumber || c.id})
                </option>
              ))}
          </select>
          {!caseContext && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
              Please select a case to view available slots.
            </p>
          )}
        </div>

        {/* SECTION 2: Case Details Card (Shown when case selected) */}
        {caseContext && (
          <div className="w-full bg-blue-50/50 dark:bg-gray-800/50 rounded-xl border border-blue-100 dark:border-gray-700 p-5 flex flex-wrap gap-x-12 gap-y-4 items-center animate-fadeIn shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">Case Number</span>
              <span className="font-bold text-gray-800 dark:text-white text-lg">{caseContext.displayId || caseContext.caseNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">Type</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{caseContext.category || caseContext.type}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">Urgency</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 w-fit
                  ${caseContext.urgency === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  caseContext.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                {caseContext.urgency || 'NORMAL'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider">
                {(userRole === 'LAWYER' || userRole === 'NGO') ? 'Client' : 'Lawyer'}
              </span>
              <span className="font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">
                  {(userRole === 'LAWYER' || userRole === 'NGO') ? 'person' : 'gavel'}
                </span>
                {(userRole === 'LAWYER' || userRole === 'NGO')
                  ? (caseContext.citizenName || 'Unknown')
                  : (caseContext.lawyerName || 'Unassigned')}
              </span>
            </div>
          </div>
        )}

        {/* SECTION 3: Main Schedule Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT: Calendar */}
          <div className="w-full lg:w-[480px] xl:w-[500px] shrink-0">
            <div className="bg-[#ebf8f8] dark:bg-gray-800 rounded-2xl border border-transparent shadow-sm p-4 sm:p-6 sticky top-24">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{format(currentMonth, "MMMM yyyy")}</h3>
                <div className="flex gap-2">
                  <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-300 transition-colors text-xs">
                    <span className="material-symbols-outlined !text-sm">chevron_left</span>
                  </button>
                  <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-300 transition-colors text-xs">
                    <span className="material-symbols-outlined !text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-3 text-center mb-4 text-xs font-normal text-gray-500 dark:text-gray-400">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: monthStartWeekday }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayAppointments = getDayAppointments(day, scheduleEvents);
                  const hasApts = dayAppointments.length > 0;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border-2
                            ${isSelected ? 'bg-white dark:bg-gray-800 border-[#1a5f5f] dark:border-teal-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}
                          `}
                    >
                      <span className={`text-sm ${isSelected ? 'font-bold text-[#1a5f5f] dark:text-teal-400' : 'font-medium'}`}>{format(day, 'd')}</span>
                      {hasApts && (
                        <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-[#1a5f5f] dark:bg-teal-500' : 'bg-primary'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Today's Schedule Header */}
              <div className="mt-10 pt-4">
                <div className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1a5f5f] dark:text-teal-400 text-lg">calendar_today</span>
                  {isSameDay(selectedDate, new Date()) ? "Today's Schedule" : `Schedule for ${format(selectedDate, 'MMM d')}`}
                </div>
                {/* Mini Schedule List for Selected Day */}
                <div className="space-y-3">
                  {bookingsForDate.length > 0 ? bookingsForDate.map(b => (
                    <div key={b.id} className="text-xs bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{b.time?.substring(0, 5)}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-24">{b.title || 'Consultation'}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          b.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {/* Join Meeting Button */}
                        {b.status === 'CONFIRMED' && b.meetLink && (
                          <a
                            href={b.meetLink.startsWith('http') ? b.meetLink : `https://${b.meetLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm border border-transparent"
                            title="Join video consultation"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-sm">videocam</span>
                            Join Meeting
                          </a>
                        )}

                        {/* Accept/Reject for whomever is receiving the request */}
                        {b.status === 'PENDING' && (
                          (b.initiatedBy && String(b.initiatedBy) !== String(user?.id)) ||
                          (!b.initiatedBy && userRole === 'LAWYER')
                        ) && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(b.id, 'CONFIRMED'); }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-medium transition-colors"
                                title="Accept appointment"
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(b.id, 'REJECTED'); }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-medium transition-colors"
                                title="Reject appointment"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}

                        {/* Reschedule for confirmed appointments */}
                        {canReschedule(b, userRole) && b.status === 'CONFIRMED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReschedule(b); }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium transition-colors"
                            title="Reschedule"
                          >
                            <FiEdit2 className="w-2.5 h-2.5 inline mr-0.5" /> Reschedule
                          </button>
                        )}

                        {/* Cancel button */}
                        {canCancel(b, userRole) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancel(b); }}
                            className="text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            title="Cancel"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )) : null}
                </div>
                {!bookingsForDate.length && (
                  <p className="text-sm text-gray-400 text-center mt-12 py-10">
                    No appointments for this day
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Time Slots & Booking Form (Wider Area) */}
          <div className="flex-1 min-w-0">
            {/* 
                Show slots ONLY if:
                1. Provider is selected
                2. Case is selected (Required for all roles now to ensure context)
            */}
            {(selectedProviderId && caseContext) ? (
              <>
                {/* Time Period Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit min-w-[300px] border border-gray-200 dark:border-gray-700">
                  {Object.values(TIME_PERIODS).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimePeriod(period)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200
                        ${selectedTimePeriod === period
                          ? "bg-white dark:bg-gray-700 text-primary dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                      {period === TIME_PERIODS.MORNING && <FiSun className="w-4 h-4" />}
                      {period === TIME_PERIODS.NOON && <MaterialIcon name="light_mode" className="text-lg" />}
                      {period === TIME_PERIODS.EVENING && <FiMoon className="w-4 h-4" />}
                      {period}
                    </button>
                  ))}
                </div>

                {/* Horizontal Time Bar Display */}
                <div className="space-y-6">
                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="font-medium text-sm">Loading availability...</p>
                    </div>
                  ) : Object.keys(groupedSlots).length > 0 ? (
                    Object.entries(groupedSlots)
                      .filter(([rangeKey]) => {
                        const [startHour] = rangeKey.split('-').map(Number);
                        // Filter based on selectedTimePeriod
                        if (selectedTimePeriod === TIME_PERIODS.MORNING) return startHour < 12;
                        if (selectedTimePeriod === TIME_PERIODS.NOON) return startHour >= 12 && startHour < 17;
                        if (selectedTimePeriod === TIME_PERIODS.EVENING) return startHour >= 17;
                        return true;
                      })
                      .map(([rangeKey, slots]) => {
                        const [startHour, endHour] = rangeKey.split('-').map(Number);
                        return (
                          <div key={rangeKey} className="relative">
                            <div className="relative h-5 mb-1.5 mx-2">
                              {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                                const h = startHour + i;
                                const leftPercent = (i / (endHour - startHour)) * 100;
                                return (
                                  <span
                                    key={h}
                                    className="absolute text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap"
                                    style={{
                                      left: `${leftPercent}%`,
                                      transform: i === 0 ? 'none' : i === (endHour - startHour) ? 'translateX(-100%)' : 'translateX(-50%)'
                                    }}
                                  >
                                    {formatHour(h)}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl h-14 border-2 border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide flex min-w-0">
                              {slots.map((slot, idx) => {
                                const isSelected = selectedSlots.includes(slot.time);
                                const isAvailable = slot.available;
                                return (
                                  <button
                                    key={slot.time}
                                    onClick={() => isAvailable && handleHalfSlotSelect(slot.time)}
                                    disabled={!isAvailable}
                                    className={`flex-1 relative transition-all duration-200 border-r border-gray-300 dark:border-gray-700 last:border-r-0
                                      ${!isAvailable ? 'bg-striped-grey dark:bg-striped-grey-dark cursor-not-allowed opacity-60' :
                                        isSelected ? 'bg-primary text-white shadow-inner' :
                                          'hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-gray-600 cursor-pointer'}
                                    `}
                                    title={`${slot.time} ${isAvailable ? '' : '(Not available)'}`}
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center min-w-[70px] sm:min-w-[80px]">
                                      <span className={`text-[11px] sm:text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {slot.time}
                                      </span>
                                    </div>
                                    {idx !== slots.length - 1 && (
                                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-gray-300 dark:bg-gray-700" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="w-full text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <FiClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No slots available for this period.</p>
                    </div>
                  )}
                </div>

                {/* Booking Form */}
                <div className="mt-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-primary/20 shadow-md p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">event_available</span>
                      Confirm Booking Details
                    </h4>

                    {selectedSlots.length === 0 && (
                      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-3 text-amber-700 dark:text-amber-400">
                        <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">info</span>
                        <div>
                          <p className="text-sm font-bold">Selection Required</p>
                          <p className="text-xs opacity-80">Please select time slot(s) from the available ranges above to proceed with your booking.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date & Time</label>
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FiCalendar className="text-primary shrink-0" />
                          <span className="truncate">
                            {format(selectedDate, 'MMM d')} • {selectedSlots.length > 0 ? formatSlotRange(selectedSlots[0], selectedSlots.length * 30) : 'None'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Duration</label>
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FiClock className="text-primary shrink-0" />
                          <span>{selectedSlots.length * 30} Minutes</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Meeting Topic (e.g., Initial Consultation)"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                      />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Any specific questions or context..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all resize-none"
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleBook}
                        disabled={loading || selectedSlots.length === 0}
                        className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:-translate-y-0.5
                          ${loading || selectedSlots.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none translate-y-0'
                            : 'bg-primary text-white hover:bg-primary-dark hover:shadow-xl'}
                        `}
                      >
                        {loading ? 'Booking...' : 'Request Appointment'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <span className="material-symbols-outlined text-3xl">event_busy</span>
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">No Case Selected</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Please select a case from the dropdown above to view available appointments for your assigned lawyer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {
        rescheduleModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reschedule Appointment</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Current: {format(new Date(selectedAppointment.date), 'MMM d, yyyy')} at {selectedAppointment.time?.substring(0, 5)}
                  </p>
                </div>
                <button
                  onClick={() => setRescheduleModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{format(modalMonth, "MMMM yyyy")}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setModalMonth(subMonths(modalMonth, 1))} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300" aria-label="Previous month">‹</button>
                        <button onClick={() => setModalMonth(addMonths(modalMonth, 1))} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300" aria-label="Next month">›</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center mb-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: startOfMonth(modalMonth).getDay() }).map((_, i) => <div key={`modal-pad-${i}`} className="aspect-square" />)}
                      {eachDayOfInterval({ start: startOfMonth(modalMonth), end: endOfMonth(modalMonth) }).map((day) => {
                        const isSelected = isSameDay(day, modalDate);
                        const isToday = isSameDay(day, new Date());
                        return (
                          <button
                            key={format(day, 'yyyy-MM-dd')}
                            onClick={() => { setModalDate(day); setSelectedSlot(''); }}
                            className={`aspect-square rounded-lg p-2 flex flex-col items-center justify-center transition-all border
                            ${isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}
                            ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
                          `}
                            aria-label={`Select ${format(day, 'MMMM d, yyyy')}`}
                            aria-pressed={isSelected}
                          >
                            <div className="text-sm font-semibold">{format(day, 'd')}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <FiClock /> {format(modalDate, 'MMMM d, yyyy')}
                      </h3>
                      <div className="flex gap-2 mb-4">
                        {Object.values(TIME_PERIODS).map((period) => (
                          <button
                            key={period}
                            onClick={() => setSelectedTimePeriod(period)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                            ${selectedTimePeriod === period ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                          `}
                            aria-label={`Show ${period} slots`}
                            aria-pressed={selectedTimePeriod === period}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {slotsByPeriod[selectedTimePeriod]?.length > 0 ? (
                          slotsByPeriod[selectedTimePeriod].map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => handleHalfSlotSelect(slot.time)}
                              disabled={!slot.available}
                              className={`w-full p-3 rounded-lg border-2 text-sm font-medium transition-all
                              ${!slot.available ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed' :
                                  selectedSlots.includes(slot.time) ? 'bg-blue-500 text-white border-blue-500' :
                                    'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}
                            `}
                              aria-label={`${format(new Date('2000-01-01T' + slot.time + ':00'), 'h:mm a')} on ${format(modalDate, 'MMMM d, yyyy')} - ${slot.available ? 'Available, click to select' : 'Not available'}`}
                              aria-disabled={!slot.available}
                              aria-pressed={selectedSlots.includes(slot.time)}
                            >
                              {format(new Date('2000-01-01T' + slot.time + ':00'), 'h:mm a')}
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No available slots</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button onClick={() => setRescheduleModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button
                    onClick={() => handleRescheduleConfirm(modalDate, selectedSlots[0])}
                    disabled={selectedSlots.length === 0}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${selectedSlots.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        confirmDialogOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden transform transition-all scale-100">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <FiX className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">Cancel Appointment?</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Are you sure you want to cancel your appointment on <strong>{format(new Date(selectedAppointment.date), 'MMM d, yyyy')}</strong> at <strong>{selectedAppointment.time?.substring(0, 5)}</strong>?
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">This action cannot be undone.</p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex gap-3">
                <button onClick={() => setConfirmDialogOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors">Back</button>
                <button onClick={handleCancelConfirm} className="flex-1 px-4 py-2 rounded-lg font-medium transition-all bg-red-500 hover:bg-red-600 text-white">Cancel Appointment</button>
              </div>
            </div>
          </div>
        )
      }

      {
        expandedDay && expandedDayData && (
          <div
            className="day-popover fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-64 max-h-64 overflow-y-auto animate-fade-in"
            style={{ top: `${expandedDayData.position.top}px`, left: `${expandedDayData.position.left}px`, transform: 'translateX(-50%)' }}
          >
            <div className="sticky top-0 bg-primary text-white border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex justify-between items-center">
              <div className="text-xs font-semibold">{format(new Date(expandedDayData.dateStr), 'EEE, MMM d')} ({expandedDayData.appointments.length})</div>
              <button onClick={(e) => { e.stopPropagation(); setExpandedDay(null); }} className="hover:bg-white/20 rounded p-0.5"><FiX className="w-3 h-3" /></button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {expandedDayData.appointments.map(app => (
                <div key={app.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">{app.time?.substring(0, 5)}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : app.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{app.status}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{app.title || "Consultation"}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">with {app.lawyerName || 'Lawyer'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default ScheduleDashboard;
