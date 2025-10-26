// src/services/admin.js
import api from "../services/api";

/* Utility: always return a consistent shape */
function normalizeList(resp, fallbackTotal = 0) {
  const data = resp?.data ?? {};
  const items = Array.isArray(data.items) ? data.items : [];
  const total = Number.isFinite(Number(data.total)) ? Number(data.total) : fallbackTotal;
  return { items, total };
}

function logWarn(where, err) {
  const msg = err?.response?.data?.message || err?.message || String(err);
  console.warn(`${where} failed:`, msg);
}

/* ---------------- RECIPES ---------------- */
export async function listRecipes({ query = "", page = 1, pageSize = 12 } = {}) {
  try {
    // support both ?query= and ?q= for compatibility
    const resp = await api.get("/api/admin/recipes", {
      params: { query, q: query, page, pageSize },
    });
    return normalizeList(resp, 0);
  } catch (err) {
    logWarn("listRecipes", err);
    return { items: [], total: 0 };
  }
}

export async function createRecipe(body) {
  try {
    const resp = await api.post("/api/admin/recipes", body);
    return resp.data;
  } catch (err) {
    logWarn("createRecipe", err);
    throw err;
  }
}

export async function updateRecipe(id, body) {
  try {
    const resp = await api.put(`/api/admin/recipes/${id}`, body);
    return resp.data;
  } catch (err) {
    logWarn("updateRecipe", err);
    throw err;
  }
}

export async function deleteRecipe(id) {
  try {
    const resp = await api.delete(`/api/admin/recipes/${id}`);
    return resp.data;
  } catch (err) {
    logWarn("deleteRecipe", err);
    throw err;
  }
}

/* ---------------- USERS ---------------- */
export async function listUsers({ query = "", page = 1, pageSize = 12 } = {}) {
  try {
    const resp = await api.get("/api/admin/users", {
      params: { query, q: query, page, pageSize },
    });
    return normalizeList(resp, 0);
  } catch (err) {
    logWarn("listUsers", err);
    return { items: [], total: 0 };
  }
}

export async function setUserRole(id, role) {
  try {
    const resp = await api.put(`/api/admin/users/${id}/role`, { role });
    return resp.data;
  } catch (err) {
    logWarn("setUserRole", err);
    throw err;
  }
}

/* ---------------- STATS (optional) ---------------- */
export async function getStats() {
  try {
    const resp = await api.get("/api/admin/stats");
    return resp.data ?? null;
  } catch (err) {
    // Non-blocking for UI
    logWarn("getStats", err);
    return null;
  }
}

/* ---------------- TAGS (admin) ---------------- */
export async function adminGetTagCounts() {
  // Try admin endpoint first; if missing, fall back to public counts
  try {
    const resp = await api.get("/api/admin/tags/counts");
    const data = resp?.data;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err?.response?.status === 404) {
      // fallback to public endpoint
      try {
        const resp2 = await api.get("/api/recipes/tag-counts");
        const data2 = resp2?.data;
        return Array.isArray(data2) ? data2 : [];
      } catch (err2) {
        logWarn("adminGetTagCounts (fallback)", err2);
        return [];
      }
    }
    logWarn("adminGetTagCounts", err);
    return [];
  }
}

export async function adminRecountTags() {
  try {
    const resp = await api.post("/api/admin/tags/recount");
    return resp?.data?.ok === true;
  } catch (err) {
    logWarn("adminRecountTags", err);
    return false;
  }
}