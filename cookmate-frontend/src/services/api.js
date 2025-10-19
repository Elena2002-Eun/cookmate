// api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  withCredentials: false,
});

// Attach token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Global 401 handler: clear token, set flash, hard-redirect to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try { localStorage.removeItem("token"); } catch {}
      try { localStorage.setItem("flash", "Please log in to continue."); } catch {}
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;