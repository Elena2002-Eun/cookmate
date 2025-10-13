import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Favorites() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setMsg("Please log in to view favorites."); setItems([]); return; }
    (async () => {
      try {
        setMsg("");
        const { data } = await api.get("/api/favorites");
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setMsg("Failed to load favorites.");
      }
    })();
  }, [token]);

  if (!token) return <div style={{padding:16}}>Please log in to view favorites.</div>;

  return (
    <div style={{padding:16}}>
      <h2>Favorites</h2>
      {msg && <div>{msg}</div>}
      <ul>
        {items.map(r => <li key={r._id || r.id}>{r.title}</li>)}
        {items.length === 0 && <li>No favorites yet.</li>}
      </ul>
    </div>
  );
}