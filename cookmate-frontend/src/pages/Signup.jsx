import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import useToast from "../hooks/useToast";

export default function Signup() {
  const nav = useNavigate();
  const { show, ToastPortal } = useToast(2200);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("Email and password are required");
      show("Email and password are required");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match");
      show("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/auth/signup", { email, password });
      localStorage.setItem("flash", "Signup successful! Please log in.");
      show("Account created");
      nav("/login");
    } catch {
      setErr("Signup failed");
      show("Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <h2 className="text-2xl font-semibold mb-3">Create account</h2>

      <form onSubmit={submit} className="grid gap-3">
        <input
          className="rounded-md border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e)=>setConfirm(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Creating..." : "Sign up"}
        </button>
      </form>

      {err && <div className="mt-2 text-red-600 text-sm">{err}</div>}

      <p className="mt-3 text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>

      <ToastPortal />
    </div>
  );
}