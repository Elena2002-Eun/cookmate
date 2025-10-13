import { useEffect, useState } from "react";

export default function Toast({ message = "", onClose, duration = 2500 }) {
  const [open, setOpen] = useState(Boolean(message));
  useEffect(() => {
    if (!message) return;
    setOpen(true);
    const t = setTimeout(() => { setOpen(false); onClose?.(); }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!open) return null;
  return (
    <div style={{
      position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)",
      background:"#111", color:"#fff", padding:"8px 12px",
      borderRadius:8, boxShadow:"0 4px 14px rgba(0,0,0,.2)", zIndex:9999
    }}>
      {message}
    </div>
  );
}