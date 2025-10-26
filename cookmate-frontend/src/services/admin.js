import api from "../services/api";

/* ---------------- RECIPES ---------------- */
export async function listRecipes({ query = "", page = 1, pageSize = 10 }) {
  const { data } = await api.get("/api/admin/recipes", { params: { query, page, pageSize } });
  return { items: data.items ?? [], total: Number(data.total ?? 0) };
}

export async function createRecipe(body) {
  const { data } = await api.post("/api/admin/recipes", body);
  return data;
}

export async function updateRecipe(id, body) {
  const { data } = await api.put(`/api/admin/recipes/${id}`, body);
  return data;
}

export async function deleteRecipe(id) {
  const { data } = await api.delete(`/api/admin/recipes/${id}`);
  return data;
}

/* ---------------- USERS ---------------- */
export async function listUsers({ query = "", page = 1, pageSize = 10 }) {
  const { data } = await api.get("/api/admin/users", { params: { query, page, pageSize } });
  return { items: data.items ?? [], total: Number(data.total ?? 0) };
}

export async function setUserRole(id, role) {
  const { data } = await api.put(`/api/admin/users/${id}/role`, { role });
  return data;
}

/* ---------------- STATS (optional) ---------------- */
export async function getStats() {
  const { data } = await api.get("/api/admin/stats");
  return data;
}