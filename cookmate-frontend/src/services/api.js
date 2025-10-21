// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  withCredentials: false,
});

// ✅ Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore if localStorage not available
  }
  return config;
});

// ✅ Handle expired or invalid tokens globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.setItem("flash", "Please log in to continue.");
      } catch {}
      window.location.href = "/login"; // redirect to login page
    }
    return Promise.reject(err);
  }
);

export default api;