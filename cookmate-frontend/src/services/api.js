import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// NEW: catch 401s and bounce to /login with a message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      // stash a one-time message for login page
      localStorage.setItem("flash", "Please log in to continue");
      // hard redirect keeps it simple across routes
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;