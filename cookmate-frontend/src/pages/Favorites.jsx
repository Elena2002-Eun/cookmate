// src/pages/Favorites.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import { TOAST } from "../utils/toast";
import Badge from "../components/ui/Badge";
import { TagIcon, FlameIcon } from "../components/icons";
import { difficultyBadgeVariant } from "../utils/difficulty";

export default function Favorites() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

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
        setMsg(TOAST.msg.fav_load_failed);
        show(TOAST.msg.fav_load_failed, TOAST.DURATION.long);
      }
    })();
  }, [token]);

  // Remove favorite
  const removeFav = async (id) => {
    try {
      await api.delete(`/api/favorites/${id}`);
      setItems((prev) => prev.filter((x) => x._id !== id));
      show(TOAST.msg.fav_removed);
    } catch {
      show(TOAST.msg.fav_failed, TOAST.DURATION.long);
    }
  };

  if (!token) {
    return (
      <div className="p-4 text-gray-700">Please log in to view favorites.</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <PageHeader title="Favorites" subtitle="Your saved recipes live here." />
      {msg && <div className="mb-2 text-gray-700">{msg}</div>}

      {/* Favorites List */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
        {items.map((r) => (
          <li key={r._id} className="relative group">
            <Link
  to={`/recipe/${r._id}`}
  aria-label={`Open favorite: ${r.title}`}
  className="
    group block rounded-xl border bg-white p-4
    shadow-sm transition duration-200 ease-out
    hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-lg
    hover:ring-1 hover:ring-blue-200
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    motion-reduce:transform-none motion-reduce:transition-none
  "
>
  <div className="flex items-start justify-between gap-3">
    <div className="font-semibold clamp-2">{r.title}</div>
    <Badge variant={difficultyBadgeVariant(r.difficulty)}>
      <span className="inline-flex items-center gap-1"><FlameIcon />{r.difficulty || "n/a"}</span>
    </Badge>
  </div>
  <div className="mt-1 text-sm text-gray-600 clamp-1">
    {r.difficulty || "n/a"} • {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
  </div>
  <div className="mt-3 flex flex-wrap gap-1.5">
    {(Array.isArray(r.tags) ? r.tags.slice(0, 2) : []).map((t) => (
      <Badge key={t} variant="blue">
        <span className="inline-flex items-center gap-1"><TagIcon />{t}</span>
      </Badge>
    ))}
    {Array.isArray(r.tags) && r.tags.length > 2 && <Badge>+{r.tags.length - 2} more</Badge>}
  </div>
</Link>

            <button
              onClick={() => removeFav(r._id)}
              className="
                absolute top-3 right-3
                text-xs rounded-md border px-2 py-1 bg-white/70 backdrop-blur
                hover:bg-gray-50 transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              "
            >
              Remove
            </button>
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