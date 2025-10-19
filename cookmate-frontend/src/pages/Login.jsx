// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { TOAST } from "../utils/toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  // If you prefer pre-filled demo creds for faster testing, put them here:
  // const [email, setEmail] = useState("test2@example.com");
  // const [password, setPassword] = useState("pass123");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  // pick up one-time flash message from 401 redirect or logout
  useEffect(() => {
    const f = localStorage.getItem("flash");
    if (f) {
      setFlash(f);
      localStorage.removeItem("flash");
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      const token = data?.token;
      if (!token) throw new Error("No token returned");
      login(token); // updates context + localStorage
      show(TOAST.msg.login_success);
      // go back to intended page or default
      const redirectTo = location.state?.from?.pathname || "/recipes";
      navigate(redirectTo, { replace: true });
    } catch {
      setError(TOAST.msg.login_failed);
      show(TOAST.msg.login_failed, TOAST.DURATION.long);
    } finally {
      setBusy(false);
    }
  };

  // Optional: quick demo login helper (kept for convenience)
  const demoLogin = async () => {
    try {
      const { data } = await api.post("/api/auth/login", {
        email: "test2@example.com",
        password: "pass123",
      });
      login(data.token);
      show("Logged in as demo");
      navigate("/recipes", { replace: true });
    } catch {
      show("Demo login failed");
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white/90 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-gray-600 mt-1">Log in to continue.</p>

          {flash && (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {flash}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-1 my-1 rounded-md border px-2 text-xs text-gray-700 hover:bg-gray-50"
                  aria-pressed={showPw}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={demoLogin}
              className="w-full rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Login as demo
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <ToastPortal />
    </div>
  );
}