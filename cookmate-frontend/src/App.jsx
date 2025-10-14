// src/App.jsx
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
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
import Footer from "./components/Footer";
import useToast from "./hooks/useToast";

// Lazy load ONLY Signup
const Signup = lazy(() => import("./pages/Signup"));

function Nav() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { show, ToastPortal } = useToast(2000);

  const handleLogout = () => {
    // 1) clear auth
    logout();

    // 2) toast now
    show("Logged out");

    // 3) set a flash for Login page (your Login already reads localStorage.flash)
    localStorage.setItem("flash", "You’ve been logged out");

    // 4) redirect (home or login — your call)
    navigate("/login", { replace: true });
  };

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
              onClick={handleLogout}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      <ToastPortal />
    </header>
  );
}

function Search() {
  const [pantry, setPantry] = useState("flour, milk, egg");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(2000); // 👈 add

  const checkApi = async () => {
    const { data } = await api.get("/");
    setMsg(typeof data === "string" ? data : JSON.stringify(data));
    show("API is reachable");
  };

  const search = async () => {
    const list = pantry.split(",").map(s => s.trim()).filter(Boolean);
    const { data } = await api.post("/api/search/by-ingredients", { pantry: list });
    setResults(data);
  };

  const loadSavedPantry = async () => {
  if (!token) {
    setMsg("Login to load your pantry");
    show("Please login to load pantry");
    return;
  }
  const { data } = await api.get("/api/pantry");
  setPantry((data || []).join(", "));
  show("Pantry loaded");
  };

  const saveAsMyPantry = async () => {
  if (!token) { show("Login to save your pantry"); return; }
  const list = pantry.split(",").map(s => s.trim()).filter(Boolean);
  try {
    setSaving(true);
    const { data } = await api.put("/api/pantry", { pantry: list });
    const count = Array.isArray(data) ? data.length : (data?.length ?? list.length);
    setMsg(`Saved ${count} items to pantry`);
    show("Pantry saved");
  } catch {
    show("Failed to save pantry");
  } finally {
    setSaving(false);
  }
  };


  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">CookMate</h1>
      <p className="text-gray-600 mb-4">Search by ingredients you already have.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="e.g. flour, milk, egg"
          value={pantry}
          onChange={(e) => setPantry(e.target.value)}
        />
        <button
          onClick={search}
          className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Search recipes
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={loadSavedPantry}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Load saved pantry
        </button>
        <button
          onClick={saveAsMyPantry}
          disabled={saving}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
          {saving ? "Saving…" : "Save as my pantry"}
        </button>
        <button
          onClick={checkApi}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Check API
        </button>
      </div>

      {msg && <div className="mb-3 text-gray-700">{msg}</div>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {results.map((r, i) => (
          <li key={i} className="rounded-lg border bg-white p-4">
            <div className="font-semibold">
              {r?.recipe?.title ?? "(no title)"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              score {Number(r?.score ?? 0).toFixed(3)}
            </div>
          </li>
        ))}
      </ul>

      {!results.length && (
        <div className="text-gray-500 mt-4">Start by entering your pantry above.</div>
      )}
      {/* Toast outlet for the Search box */}
      <ToastPortal />
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
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}