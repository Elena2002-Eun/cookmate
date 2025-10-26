import api from "./api";

export async function listHistory() {
  const { data } = await api.get("/api/history");
  // Expect [{ id, title, tags, difficulty, viewedAt }]
  return Array.isArray(data) ? data : [];
}

export async function addHistory(recipeId) {
  const { data } = await api.post(`/api/history/${recipeId}`);
  return data; // { ok: true }
}