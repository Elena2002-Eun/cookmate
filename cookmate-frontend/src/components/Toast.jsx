import { useEffect, useState } from "react";

export default function Toast({ message = "", onClose, duration = 2500 }) {
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setOpen(true);
    const timer = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4">
      <div className="rounded-md bg-black/80 text-white px-4 py-2 text-sm shadow-lg">
        {message}
      </div>
    </div>
  );
}