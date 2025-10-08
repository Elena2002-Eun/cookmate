import { useEffect, useState } from "react";
import api from "../services/api";

export default function History() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/api/history").then(r => setItems(r.data || []));
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>Recently viewed</h2>
      {items.length === 0 && <div>No history yet.</div>}
      <ul>
        {items.map((h, i) => (
          <li key={i}>
            {new Date(h.at).toLocaleString()} — {h.recipe?.title}
          </li>
        ))}
      </ul>
    </div>
  );
}