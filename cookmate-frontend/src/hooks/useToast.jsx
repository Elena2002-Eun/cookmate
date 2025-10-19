import { useState, useCallback } from "react";
import Toast from "../components/Toast";

export default function useToast(defaultTimeout = 2000) {
  const [message, setMessage] = useState("");

  const show = useCallback((m) => setMessage(String(m || "")), []);
  const clear = useCallback(() => setMessage(""), []);

  const ToastPortal = () =>
    message ? (
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="fixed inset-x-0 top-2 z-[60] grid place-items-center px-4"
      >
      <Toast message={message} onClose={clear} timeout={defaultTimeout} />
      </div>
    ) : null;

  return { show, clear, ToastPortal, message };
}
