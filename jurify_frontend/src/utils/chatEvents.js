const listeners = new Set();

export const chatEvents = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(event) {
    listeners.forEach(listener => listener(event));
  },
};
