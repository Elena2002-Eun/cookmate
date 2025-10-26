// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { TOAST } from "../utils/toast";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // basic validation
    if (!email || !password) {
      setError("Email and password are required");
      show("Email and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      show("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      show("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      // create the account
      await api.post("/api/auth/signup", { email, password });

      // OPTION A: auto-login after signup (smooth UX)
      try {
        const { data } = await api.post("/api/auth/login", { email, password });
        const token = data?.token;
        if (!token) throw new Error("No token after signup");
        login(token);
        show(TOAST.msg.signup_success);
        navigate("/recipes", { replace: true });
        return;
      } catch {
        // OPTION B fallback: redirect to login with flash (if auto-login fails)
        localStorage.setItem("flash", "Signup successful! Please log in.");
        navigate("/login");
        return;
      }
    } catch {
      setError(TOAST.msg.signup_failed);
      show(TOAST.msg.signup_failed, TOAST.DURATION.long);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white/90 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-gray-600 mt-1">It takes less than a minute.</p>

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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 6 characters"
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

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter your password"
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
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <ToastPortal />
    </div>
  );
}