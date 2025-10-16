import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";

export default function Favorites() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const { show, ToastPortal } = useToast(1800);

  // Load favorites
  useEffect(() => {
    if (!token) {
      setMsg("Please log in to view favorites.");
      setItems([]);
      return;
    }
    (async () => {
      try {
        setMsg("");
        const { data } = await api.get("/api/favorites");
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setMsg("Failed to load favorites.");
        show("Failed to load favorites");
      }
    })();
  }, [token]);

  // Remove favorite
  const removeFav = async (id) => {
    try {
      await api.delete(`/api/favorites/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
      show("Removed from favorites");
    } catch {
      show("Failed to remove");
    }
  };

  if (!token) {
    return (
      <div className="p-4 text-gray-700">Please log in to view favorites.</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Favorites</h2>
      {msg && <div className="mb-2 text-gray-700">{msg}</div>}

      {/* Favorites List */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
        {items.map((r) => (
          <li key={r._id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between">
              <Link
                to={`/recipe/${r._id}`}
                className="font-semibold hover:text-blue-600"
              >
                {r.title}
              </Link>
              <button
                onClick={() => removeFav(r._id)}
                className="text-sm rounded-md border px-2 py-1 hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {r.difficulty || "n/a"} •{" "}
              {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
            </div>
          </li>
        ))}
      </ul>

      {!msg && items.length === 0 && (
        <div className="text-gray-600 mt-3">No favorites yet.</div>
      )}

      {/* Toasts */}
      <ToastPortal />
    </div>
  );
}