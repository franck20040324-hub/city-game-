import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setVisibleMessage(message);
      const timer = setTimeout(() => {
        setVisibleMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visibleMessage) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="bg-slate-900/95 border border-amber-400/60 shadow-2xl rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold text-amber-200 backdrop-blur-md flex items-center gap-2">
        <span>✨</span>
        <span>{visibleMessage}</span>
      </div>
    </div>
  );
};
