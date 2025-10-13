import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function History() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/api/history")
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <div style={{ padding: 16 }}>Please login to view history.</div>;

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>Recently Viewed Recipes</h2>
      {loading && <div>Loading…</div>}
      <ul>
        {items.map((h) => (
          <li key={h.id}>
            <Link to={`/recipe/${h.id}`}>{h.title}</Link> — {h.difficulty} — viewed {new Date(h.viewedAt).toLocaleString()}
          </li>
        ))}
        {!loading && items.length === 0 && <li>No history yet.</li>}
      </ul>
    </div>
  );
}