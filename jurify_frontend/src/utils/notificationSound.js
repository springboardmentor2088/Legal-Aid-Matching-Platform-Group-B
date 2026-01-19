let audio;

export const playNotificationSound = () => {
  try {
    if (!audio) {
      audio = new Audio('/sounds/notification.mp3');
      audio.volume = 1.0;
    }

    audio.currentTime = 0;
    audio.play().catch((e) => console.warn("Audio play blocked", e));
  } catch {
    // fail silently
  }
};
