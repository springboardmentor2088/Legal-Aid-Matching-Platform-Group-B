// mockProviderAvailability.js
// Frontend-only mock data to simulate provider (lawyer/NGO) availability.
const providers = [
  {
    id: 1,
    name: "Lawyer A",
    timezone: "Asia/Kolkata",
    rules: [
      // Mon-Fri 09:00-17:00, 60min slots, capacity 1
      { days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00", slotMinutes: 60, capacity: 1 },
    ],
    exceptions: ["2026-01-26"], // example blocked date
  },
  {
    id: 2,
    name: "NGO B",
    timezone: "Asia/Kolkata",
    rules: [
      // Tue, Thu 10:00-14:00, 30min slots, capacity 3 (can handle multiple citizens)
      { days: [2, 4], start: "10:00", end: "14:00", slotMinutes: 30, capacity: 3 },
      // Sat 09:00-12:00
      { days: [6], start: "09:00", end: "12:00", slotMinutes: 30, capacity: 2 },
    ],
    exceptions: [],
  },
];

export function getProviders() {
  return providers;
}

export function getProviderById(id) {
  return providers.find((p) => p.id === id);
}

export default { getProviders, getProviderById };
