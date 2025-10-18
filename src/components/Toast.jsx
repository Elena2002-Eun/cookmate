// src/components/Toast.jsx
import { useEffect } from "react";

export default function Toast({ message = "", onClose, timeout = 2000 }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onClose?.(), timeout);
    return () => clearTimeout(id);
  }, [message, timeout, onClose]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4" aria-live="polite" role="status">
  <div className="rounded-md bg-black/80 text-white px-4 py-2 text-sm shadow-lg">
    {message}
  </div>
</div>
  );
}