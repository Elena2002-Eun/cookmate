import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import api from "./services/api";
import Recipes from "./pages/Recipes";
import Recipe from "./pages/Recipe";

function Search() {
  const [pantry, setPantry] = useState("flour, milk, egg");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");

  const checkApi = async () => {
    const { data } = await api.get("/");
    setMsg(typeof data === "string" ? data : JSON.stringify(data));
  };

  const search = async () => {
    const list = pantry.split(",").map(s => s.trim()).filter(Boolean);
    const { data } = await api.post("/api/search/by-ingredients", { pantry: list });
    setResults(data);
  };

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h1>CookMate</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/">Search</Link>
        <Link to="/recipes">Recipes</Link>
      </div>

      <button onClick={checkApi}>Check API</button>
      <div>{msg}</div>

      <div style={{ marginTop: 24 }}>
        <label>Your ingredients:</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={pantry} onChange={(e)=>setPantry(e.target.value)} />
          <button onClick={search}>Search recipes</button>
        </div>
      </div>

      <ul style={{ marginTop: 24 }}>
        {results.map((r,i)=>(
          <li key={i}>{r?.recipe?.title ?? "(no title)"} — score {Number(r?.score ?? 0).toFixed(3)}</li>
        ))}
      </ul>
    </div>
  );
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipe/:id" element={<Recipe />} />
      </Routes>
    </BrowserRouter>
  );
}