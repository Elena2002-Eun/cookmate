import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import api from "./services/api";

import Recipes from "./pages/Recipes";
import Recipe from "./pages/Recipe";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import History from "./pages/History"; // <-- you were missing this import

import AuthProvider, { useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Pantry from "./pages/Pantry";

// Lazy load ONLY Signup (remove any normal import of Signup)
const Signup = lazy(() => import("./pages/Signup"));

function Nav() {
  const { token, logout } = useAuth();
  return (
    <nav style={{ display:"flex", gap:12, marginBottom:16 }}>
      <Link to="/">Search</Link>
      <Link to="/recipes">Recipes</Link>
      <Link to="/favorites">Favorites</Link>
      <Link to="/history">History</Link>
      <Link to="/pantry">Pantry</Link>
      {!token ? (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </>
      ) : (
        <button onClick={logout}>Logout</button>
      )}
    </nav>
  );
}

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

  const { token } = useAuth();

  const loadSavedPantry = async () => {
  if (!token) { setMsg("Login to load your pantry"); return; }
  const { data } = await api.get("/api/pantry");
  setPantry((data || []).join(", "));
  };

  const saveAsMyPantry = async () => {
  if (!token) { setMsg("Login to save your pantry"); return; }
  const list = pantry.split(",").map(s => s.trim()).filter(Boolean);
  const { data } = await api.put("/api/pantry", { pantry: list });
  setMsg(`Saved ${data.length} items to pantry`);
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
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={loadSavedPantry}>Load saved pantry</button>
          <button onClick={saveAsMyPantry}>Save as my pantry</button>
        </div>
      </div>

      <ul style={{ marginTop: 24 }}>
        {results.map((r,i)=>(
          <li key={i}>
            {r?.recipe?.title ?? "(no title)"} — score {Number(r?.score ?? 0).toFixed(3)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{maxWidth: 900, margin:"0 auto", padding:32}}>
          <Nav />
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Search />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipe/:id" element={<Recipe />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              {/* Protected routes: keep ONE version each */}
              <Route
                path="/favorites"
                element={
                  <RequireAuth>
                    <Favorites />
                  </RequireAuth>
                }
              />
              <Route
                path="/history"
                element={
                  <RequireAuth>
                    <History />
                  </RequireAuth>
                }
              />
              <Route path="/pantry" 
                element={
                  <RequireAuth>
                    <Pantry />
                  </RequireAuth>
                } 
              />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}