import React, { useEffect, useState } from 'react';

const NotificationPanel = ({ children, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 250);
  };

  // ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closing]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="
          w-full h-full
          sm:w-[420px]
          md:w-[480px]
          bg-white dark:bg-gray-800
          shadow-2xl
          sm:rounded-l-2xl
          overflow-hidden
          flex flex-col
          transition-transform duration-300 ease-in-out
        "
        style={{
          transform: closing ? 'translateX(100%)' : 'translateX(0)',
        }}
      >
        {React.cloneElement(children, { onClose: handleClose })}
      </div>
    </div>
  );
};

export default NotificationPanel;
