import { useEffect, useState } from "react";
import api from "../services/api";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api.get("/api/favorites", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => setItems(r.data));
  }, [token]);

  if (!token) return <div>Please log in to see your favorites.</div>;

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>My Favorites</h2>
      <ul>
        {items.map(r => (
          <li key={r._id}>{r.title}</li>
        ))}
      </ul>
    </div>
  );
}