import { useState } from "react";
import api from "../services/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const signup = async () => {
    setMsg(""); setErr("");
    try {
      const { data } = await api.post("/api/auth/signup", { email, password });
      setMsg(data.msg || "Account created, you can login now.");
    } catch {
      setErr("Signup failed");
    }
  };

  return (
    <div style={{maxWidth: 420, margin: "2rem auto", display:"grid", gap:12}}>
      <h2>Sign up</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={signup}>Create account</button>
      {msg && <div style={{color:"seagreen"}}>{msg}</div>}
      {err && <div style={{color:"crimson"}}>{err}</div>}
    </div>
  );
}