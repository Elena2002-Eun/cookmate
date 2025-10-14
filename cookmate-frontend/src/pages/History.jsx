import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";

export default function History() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const { show, ToastPortal } = useToast(1800);

  useEffect(() => {
    if (!token) {
      setMsg("Please login to view history.");
      setItems([]);
      return;
    }
    setLoading(true);
    api
      .get("/api/history")
      .then((r) => {
        setItems(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => setMsg("Failed to load history."))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="p-4 text-gray-700">
        Please login to view history.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Recently Viewed Recipes</h2>

      {loading && <div>Loading…</div>}
      {msg && <div className="mb-2 text-gray-700">{msg}</div>}

      {items.length > 0 && (
        <div className="mt-2">
          <button
      onClick={async () => {
      try {
      const res = await api.delete("/api/history");
      // some servers may return 204 No Content; treat that as success too
      if (res.status === 200 || res.status === 204) {
        setItems([]);
        show("History cleared");
      } else {
        show("Failed to clear history");
      }
      } catch (e) {
      show("Failed to clear history");
      }
      }}
      className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Clear history
          </button>
        </div>
      )}

      <ul className="space-y-3 mt-3">
        {items.map((h) => (
          <li
            key={`${h.id}-${h.viewedAt}`}
            className="rounded-lg border bg-white p-4"
          >
            <Link
              to={`/recipe/${h.id}`}
              className="font-semibold hover:text-blue-600"
            >
              {h.title}
            </Link>
            <div className="text-sm text-gray-600 mt-1">
              {h.difficulty || "n/a"} •{" "}
              {Array.isArray(h.tags) ? h.tags.join(", ") : ""}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Viewed at {new Date(h.viewedAt).toLocaleString()}
            </div>
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