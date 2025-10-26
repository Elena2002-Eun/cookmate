import { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (t) => { localStorage.setItem("token", t); setToken(t); };
  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t && !token) setToken(t);
  }, [token]);

  return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
}