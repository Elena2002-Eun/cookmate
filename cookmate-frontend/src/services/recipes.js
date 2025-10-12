import api from "./api";

export async function fetchTags() {
  const { data } = await api.get("/api/recipes/tags");
  // make sure each tag is a simple string
  return (Array.isArray(data) ? data : []).map(String);
}

export async function fetchRecipes(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") q.set(k, v);
  });
  const url = q.toString()
    ? `/api/recipes/all?${q.toString()}`
    : `/api/recipes/all`;
  const { data } = await api.get(url);
  return Array.isArray(data) ? data : [];
}

export async function fetchTagCounts() {
  const { data } = await api.get("/api/recipes/tag-counts");
  // normalize to { tag, count }[]
  return Array.isArray(data) ? data
    .map(x => ({ tag: String(x.tag), count: Number(x.count || 0) }))
    : [];
}