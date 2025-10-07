import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Recipes() {
  const [items, setItems] = useState([]);
  useEffect(()=>{ api.get("/api/recipes/all").then(r=> setItems(r.data||[])); },[]);
  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>Recipes</h2>
      <ul>
        {items.map(r=>(
          <li key={r._id}>
            <b>{r.title}</b> — {(r.tags||[]).join(", ")}
            {" "}<Link to={`/recipe/${r._id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}