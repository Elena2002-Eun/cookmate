import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import { TOAST } from "../utils/toast";

export default function History() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  useEffect(() => {
    if (!token) {
      setMsg("Please login to view history.");
      setItems([]);
      return;
    }
    setLoading(true);
    api
      .get("/api/history")
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMsg(TOAST.msg.history_load_failed))
      .finally(() => setLoading(false));
  }, [token]);

  const ClearButton = useMemo(() => {
    if (items.length === 0) return null;
    return (
      <button
        onClick={async () => {
          try {
            const res = await api.delete("/api/history");
            if (res.status === 200 || res.status === 204) {
              setItems([]);
              show(TOAST.msg.history_cleared);
            } else {
              show(TOAST.msg.history_clear_failed, TOAST.DURATION.long);
            }
          } catch {
            show(TOAST.msg.history_clear_failed, TOAST.DURATION.long);
          }
        }}
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Clear history
      </button>
    );
  }, [items.length, show]);

  if (!token) {
    return <div className="p-4 text-gray-700">Please login to view history.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <PageHeader
        title="Recently Viewed"
        subtitle="Quick access to recipes you opened."
        right={ClearButton}
      />

      {loading && <div>Loading…</div>}
      {msg && <div className="mb-2 text-gray-700">{msg}</div>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
  {items.map((h) => (
    <li key={`${h.id}-${h.viewedAt}`}>
      <Link
        to={`/recipe/${h.id}`}
        aria-label={`Open viewed recipe: ${h.title}`}
        className="
          group block font-semibold hover:text-blue-600
          rounded-xl border bg-white p-4 -mx-4  /* keeps visual card without changing layout */
          shadow-sm transition duration-200 ease-out
          hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-lg
          hover:ring-1 hover:ring-blue-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          motion-reduce:transform-none motion-reduce:transition-none
        "
      >
        <div className="font-semibold clamp-2">{h.title}</div>

        <div className="mt-1 text-sm text-gray-600 clamp-1">
          {h.difficulty || "n/a"} • {Array.isArray(h.tags) ? h.tags.join(", ") : ""}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          Viewed {new Date(h.viewedAt).toLocaleString()}
        </div>
      </Link>
    </li>
  ))}
</ul>

      {!loading && items.length === 0 && (
        <div className="text-gray-600 mt-3">No history yet.</div>
      )}

      <ToastPortal />
    </div>
  );
}