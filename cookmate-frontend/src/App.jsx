// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, Suspense, lazy } from "react";
import api from "./services/api";

import Recipes from "./pages/Recipes";
import Recipe from "./pages/Recipe";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import History from "./pages/History";
import Pantry from "./pages/Pantry";
import NotFound from "./pages/NotFound";

import AuthProvider, { useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";

// Lazy load ONLY Signup
const Signup = lazy(() => import("./pages/Signup"));

function Nav() {
  const { token, logout } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link className="font-semibold text-gray-900 hover:text-blue-600" to="/">CookMate</Link>
          <Link className="text-gray-600 hover:text-blue-600" to="/recipes">Recipes</Link>
          <Link className="text-gray-600 hover:text-blue-600" to="/favorites">Favorites</Link>
          <Link className="text-gray-600 hover:text-blue-600" to="/history">History</Link>
          <Link className="text-gray-600 hover:text-blue-600" to="/pantry">Pantry</Link>
        </nav>
        <div className="flex items-center gap-3">
          {!token ? (
            <>
              <Link className="text-gray-600 hover:text-blue-600" to="/login">Login</Link>
              <Link
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-blue-700"
                to="/signup"
              >
                Signup
              </Link>
            </>
          ) : (
            <button
              onClick={logout}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Search() {
  const [pantry, setPantry] = useState("flour, milk, egg");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");
  const { token } = useAuth();

  const checkApi = async () => {
    const { data } = await api.get("/");
    setMsg(typeof data === "string" ? data : JSON.stringify(data));
  };

  const search = async () => {
    const list = pantry.split(",").map(s => s.trim()).filter(Boolean);
    const { data } = await api.post("/api/search/by-ingredients", { pantry: list });
    setResults(data);
  };

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
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-3">CookMate</h1>

      <div className="flex gap-3 mb-3 text-sm">
        <Link className="text-gray-600 hover:text-blue-600" to="/">Search</Link>
        <Link className="text-gray-600 hover:text-blue-600" to="/recipes">Recipes</Link>
      </div>

      <button
        onClick={checkApi}
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Check API
      </button>
      <div className="mt-2 text-sm text-gray-700">{msg}</div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">Your ingredients:</label>
        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            value={pantry}
            onChange={(e)=>setPantry(e.target.value)}
          />
          <button
            onClick={search}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm hover:bg-blue-700"
          >
            Search recipes
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={loadSavedPantry}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Load saved pantry
          </button>
          <button
            onClick={saveAsMyPantry}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Save as my pantry
          </button>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm">
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
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Search />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipe/:id" element={<Recipe />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
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
                <Route
                  path="/pantry"
                  element={
                    <RequireAuth>
                      <Pantry />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}