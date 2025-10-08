import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || "/";

  const doLogin = async () => {
    setErr("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      login(data.token);
      nav(redirectTo, { replace: true });
    } catch {
      setErr("Login failed");
    }
  };

  return (
    <div style={{maxWidth: 420, margin: "2rem auto", display:"grid", gap:12}}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={doLogin}>Login</button>
      {err && <div style={{color:"crimson"}}>{err}</div>}
    </div>
  );
}