import { useState, useCallback } from "react";
import Toast from "../components/Toast";

export default function useToast(defaultTimeout = 2000) {
  const [message, setMessage] = useState("");

  const show = useCallback((m) => setMessage(String(m || "")), []);
  const clear = useCallback(() => setMessage(""), []);

  const ToastPortal = () =>
    message ? (
      <Toast message={message} onClose={clear} timeout={defaultTimeout} />
    ) : null;

  return { show, clear, ToastPortal, message };
}
