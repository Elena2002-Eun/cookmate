// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";

export default function AdminRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/api/me"); // expects { role: 'admin', ... }
        if (!alive) return;
        setState({ loading: false, ok: data?.role === "admin" });
      } catch {
        if (!alive) return;
        setState({ loading: false, ok: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) return <div className="p-4 text-gray-600">Checking admin…</div>;
  if (!state.ok) return <Navigate to="/" replace />;

  return children;
}