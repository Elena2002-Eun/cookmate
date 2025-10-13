import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function Login() {
  const [email, setEmail] = useState("test2@example.com");
  const [password, setPassword] = useState("pass123");
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || "/";

  // pick up one-time flash message from 401 redirect
  useEffect(() => {
    const msg = localStorage.getItem("flash");
    if (msg) {
      setToast(msg);
      localStorage.removeItem("flash");
    }
  }, []);

  // normal login
  const doLogin = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      login(data.token);
      nav(redirectTo, { replace: true });
    } catch {
      setErr("Login failed");
      setToast("Login failed");
    }
  };

  // demo login helper
  const demoLogin = async () => {
    try {
      const { data } = await api.post("/api/auth/login", {
        email: "test2@example.com",
        password: "pass123",
      });
      login(data.token);
      setToast("Logged in as demo");
      nav("/");
    } catch {
      setToast("Demo login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto", display: "grid", gap: 12 }}>
      <h2>Login</h2>
      <form onSubmit={doLogin} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>

      <button onClick={demoLogin}>Login as demo</button>

      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}