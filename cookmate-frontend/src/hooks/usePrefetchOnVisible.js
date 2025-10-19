// src/hooks/usePrefetchOnVisible.js
import { useEffect, useRef } from "react";

export default function usePrefetchOnVisible(cb, options = { rootMargin: "200px" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        cb?.();
        io.disconnect();
      }
    }, options);
    io.observe(ref.current);
    return () => io.disconnect();
  }, [cb, options]);
  return ref;
}