import { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const login = async () => {
    setErr("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      onLogin?.(data.token);
    } catch {
      setErr("Login failed");
    }
  };

  return (
    <div style={{maxWidth: 420, margin: "2rem auto", display:"grid", gap:12}}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
      {err && <div style={{color:"crimson"}}>{err}</div>}
    </div>
  );
}