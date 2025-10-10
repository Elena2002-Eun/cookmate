import { useEffect, useState } from "react";
import api from "../services/api";

export default function Pantry() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/api/pantry");
      setItems(data || []);
      setMsg("");
    } catch {
      setMsg("Please login first");
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!input.trim()) return;
    const { data } = await api.post("/api/pantry", { item: input });
    setItems(data); setInput("");
  };

  const removeItem = async (it) => {
    const { data } = await api.delete(`/api/pantry/${encodeURIComponent(it)}`);
    setItems(data);
  };

  const saveAll = async () => {
    const { data } = await api.put("/api/pantry", { pantry: items });
    setItems(data);
    setMsg("Saved");
    setTimeout(()=>setMsg(""), 1200);
  };

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>My Pantry</h2>
      {msg && <div style={{ color: "#666", marginBottom: 8 }}>{msg}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="add item (e.g. tomato)"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button onClick={add}>Add</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {items.map(it => (
          <span key={it} style={{ border: "1px solid #ccc", padding: "4px 8px", borderRadius: 16 }}>
            {it} <button onClick={() => removeItem(it)} aria-label={`remove ${it}`}>x</button>
          </span>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={saveAll}>Save</button>
        <button style={{ marginLeft: 8 }} onClick={load}>Reload</button>
      </div>
    </div>
  );
}