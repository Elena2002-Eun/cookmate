// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import api from "./services/api";

import AuthProvider, { useAuth } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Footer from "./components/Footer";
import useToast from "./hooks/useToast";
import Button from "./components/ui/Button";
import Chip from "./components/Chip";
import { TOAST } from "./utils/toast";
import { fetchTagCounts } from "./services/recipes";
import Badge from "./components/ui/Badge";
import { TagIcon, FlameIcon } from "./components/icons";
import { difficultyBadgeVariant } from "./utils/difficulty";
import AdminRoute from "./components/AdminRoute";
import AssistantChat from "./components/AssistantChat";
import Thumb from "./components/Thumb";
import { preloadLocalModel } from "./ai/localLLM"; // ⬅️ add this


// ✅ Lazy-load pages
const Recipes   = lazy(() => import("./pages/Recipes"));
const Recipe    = lazy(() => import("./pages/Recipe"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Login     = lazy(() => import("./pages/Login"));
const History   = lazy(() => import("./pages/History"));
const Pantry    = lazy(() => import("./pages/Pantry"));
const NotFound  = lazy(() => import("./pages/NotFound"));
const Signup    = lazy(() => import("./pages/Signup"));
const Profile   = lazy(() => import("./pages/Profile"));
const Admin     = lazy(() => import("./pages/Admin"));

function Nav() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    setIsAdmin(false); // reset when token changes/logs out
    if (!token) return;

    (async () => {
      try {
        const { data } = await api.get("/api/me"); // must include `role` in response
        if (alive) setIsAdmin(data?.role === "admin");
      } catch {
        // ignore -> treated as non-admin
      }
    })();

    return () => { alive = false; };
  }, [token]);

  const handleLogout = () => {
    logout();
    show(TOAST.msg.logout_success);
    localStorage.setItem("flash", "You’ve been logged out");
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/recipes",  label: "Recipes"  },
    { to: "/favorites",label: "Favorites"},
    { to: "/history",  label: "History"  },
    { to: "/pantry",   label: "Pantry"   },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []), // ✅ only for admins
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
        <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `font-semibold ${isActive ? "text-blue-600" : "text-gray-900 hover:text-blue-600"}`
            }
          >
            CookMate
          </NavLink>

          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => {
                if (item.label === "Recipes")  import("./pages/Recipes");
                if (item.label === "Favorites") import("./pages/Favorites");
                if (item.label === "History")   import("./pages/History");
                if (item.label === "Pantry")    import("./pages/Pantry");
                if (item.label === "Admin")     import("./pages/Admin");
              }}
              onFocus={() => {
                if (item.label === "Recipes")  import("./pages/Recipes");
                if (item.label === "Favorites") import("./pages/Favorites");
                if (item.label === "History")   import("./pages/History");
                if (item.label === "Pantry")    import("./pages/Pantry");
                if (item.label === "Admin")     import("./pages/Admin");
              }}
              className={({ isActive }) =>
                `${isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* ✅ Profile link only when logged in */}
          {token && (
            <NavLink
              to="/profile"
              onMouseEnter={() => import("./pages/Profile")}
              onFocus={() => import("./pages/Profile")}
              className={({ isActive }) =>
                `${isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`
              }
            >
              Profile
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!token ? (
            <>
              <Link className="text-gray-600 hover:text-blue-600" to="/login">
                Login
              </Link>
              <Button as={Link} to="/signup">
                Signup
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>
      <ToastPortal />
    </header>
  );
}

function Search() {
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  // chips state (replaces single text input)
  const [chips, setChips] = useState(["flour", "milk", "egg"]);
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [tagCounts, setTagCounts] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // load popular tags once
  useEffect(() => {
    (async () => {
      try {
        setTagsLoading(true);
        const list = await fetchTagCounts();
        setTagCounts(list.slice(0, 10)); // top 10 suggestions
      } finally {
        setTagsLoading(false);
      }
    })();
  }, []);

  const addChip = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    const has = new Set(chips.map((s) => s.toLowerCase()));
    if (has.has(v.toLowerCase())) {
      show("Already added");
      return;
    }
    setChips((prev) => [...prev, v]);
  };

  const removeChip = (label) => {
    setChips((prev) => prev.filter((x) => x !== label));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(input);
      setInput("");
    }
    if (e.key === "Backspace" && input === "" && chips.length) {
      removeChip(chips[chips.length - 1]);
    }
  };

  const checkApi = async () => {
    const { data } = await api.get("/");
    setMsg(typeof data === "string" ? data : JSON.stringify(data));
    show(TOAST.msg.api_ok);
  };

  const search = async () => {
    const list = chips.map((s) => s.trim()).filter(Boolean);
    const { data } = await api.post("/api/search/by-ingredients", { pantry: list });
    setResults(Array.isArray(data) ? data : []);
  };

  const loadSavedPantry = async () => {
    if (!token) {
      setMsg(TOAST.msg.auth_required);
      show(TOAST.msg.auth_required, TOAST.DURATION.long);
      return;
    }
    const { data } = await api.get("/api/pantry");
    setChips(Array.isArray(data) ? data : []);
    show(TOAST.msg.pantry_loaded);
  };

  const saveAsMyPantry = async () => {
    if (!token) {
      show(TOAST.msg.auth_required, TOAST.DURATION.long);
      return;
    }
    try {
      setSaving(true);
      const list = chips.map((s) => s.trim()).filter(Boolean);
      const res = await api.put("/api/pantry", { pantry: list });
      const count = Array.isArray(res.data) ? res.data.length : list.length;
      setMsg(`Saved ${count} items to pantry`);
      show(TOAST.msg.pantry_saved);
    } catch {
      show(TOAST.msg.pantry_save_failed, TOAST.DURATION.long);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">CookMate</h1>
      <p className="text-gray-600 mb-4">Search by ingredients you already have.</p>

      {/* Chip input */}
      <div className="rounded-md border bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((label) => (
            <Chip key={label} label={label} onRemove={() => removeChip(label)} />
          ))}
          <label htmlFor="chip-input" className="sr-only">Add ingredients</label>
          <input
            id="chip-input"
            className="min-w-[10ch] flex-1 px-2 py-1 outline-none"
            placeholder={chips.length ? "Add more (Enter)" : "e.g. flour"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      {/* Quick Add suggestions */}
      <div className="mt-2 text-sm">
        <div className="mb-1 text-gray-600">
          {tagsLoading ? "Loading suggestions…" : "Quick add:"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tagCounts.map((t) => (
            <button
              key={t.tag}
              onClick={() => addChip(t.tag)}
              className="
                inline-flex items-center gap-1 rounded-full border px-2 py-0.5
                text-xs text-gray-700 hover:bg-gray-50
                hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transform-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              "
              title={`Add ${t.tag}`}
            >
              <TagIcon className="w-3 h-3" />
              {t.tag}
              <span className="ml-1 text-[11px] text-gray-500">({t.count})</span>
            </button>
          ))}
          {!tagsLoading && tagCounts.length === 0 && (
            <span className="text-gray-500">No suggestions</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={search} className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">
          Search recipes
        </button>
        <button onClick={loadSavedPantry} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
          Load saved pantry
        </button>
        <button
          onClick={saveAsMyPantry}
          disabled={saving}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save as my pantry"}
        </button>
        <button onClick={checkApi} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
          Check API
        </button>
      </div>

      {msg && <div className="mb-3 mt-2 text-gray-700">{msg}</div>}

      {/* Results (now clickable) */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {results.map((r) => {
          // Support normalized shape and legacy nested shape
          const id         = r?._id || r?.recipe?._id;
          const title      = r?.title ?? r?.recipe?.title ?? "(no title)";
          const imageUrl   = r?.imageUrl ?? r?.recipe?.imageUrl ?? "";
          const score      = Number(r?.score ?? 0);
          const difficulty = r?.difficulty ?? r?.recipe?.difficulty ?? "n/a";
          const tags       = Array.isArray(r?.tags) ? r.tags : (Array.isArray(r?.recipe?.tags) ? r.recipe.tags : []);

          return (
            <li key={id || title}>
              <Link
                to={id ? `/recipe/${id}` : "#"}
                className="group block rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={id ? `Open ${title}` : undefined}
              >
                <Thumb
  src={imageUrl}
  alt={title}
  lockId={id}
  className="w-full h-40 mb-2"
/>

                <div className="font-semibold clamp-2">{title}</div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {/* Difficulty (optional) */}
                  {difficulty && difficulty !== "n/a" && (
                    <Badge variant={difficultyBadgeVariant(difficulty)}>
                      <span className="inline-flex items-center gap-1">
                        <FlameIcon className="w-3 h-3" />
                        {difficulty}
                      </span>
                    </Badge>
                  )}

                  {/* Top 2 tags */}
                  {tags.slice(0, 2).map((t, i2) => (
                    <Badge key={`home-tag-${t || "untagged"}-${i2}`} variant="blue">
                      <span className="inline-flex items-center gap-1">
                        {TagIcon ? <TagIcon className="w-3 h-3" /> : null}
                        {t || "untagged"}
                      </span>
                    </Badge>
                  ))}

                  {/* Score */}
                  <span className="ml-auto inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                    score {score.toFixed(3)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!results.length && (
        <div className="text-gray-500 mt-4">Start by adding ingredients above.</div>
      )}

      <ToastPortal />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // Start fetching the browser model in the background.
    // First load may take a bit; it is cached afterwards.
    preloadLocalModel()
      .then(() => console.log("✅ Local AI model ready"))
      .catch(() => console.log("⚠️ Local AI model preload failed (will try on first use)"));
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Skip link for a11y */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-blue-600 focus:px-3 focus:py-1.5 focus:text-white"
        >
          Skip to content
        </a>

        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Nav />
          <main id="main" className="mx-auto max-w-5xl px-4 py-5">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Search />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipe/:id" element={<Recipe />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
                <Route path="/history"   element={<RequireAuth><History /></RequireAuth>} />
                <Route path="/pantry"    element={<RequireAuth><Pantry /></RequireAuth>} />
                <Route path="/profile"   element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <AssistantChat />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}