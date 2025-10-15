import api from "./api";

export async function fetchTags() {
  const { data } = await api.get("/api/recipes/tags");
  // make sure each tag is a simple string
  return (Array.isArray(data) ? data : []).map(String);
}

export async function fetchRecipes({ difficulty = "", tag = "", page = 1, pageSize = 12 }) {
  const params = new URLSearchParams();
  if (difficulty) params.set("difficulty", difficulty);
  if (tag) params.set("tag", tag);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const { data } = await api.get(`/api/recipes/all?${params.toString()}`);
  return data; // { items, total, page, pageSize, totalPages }
}

export async function fetchTagCounts() {
  const { data } = await api.get("/api/recipes/tag-counts");
  // normalize to { tag, count }[]
  return Array.isArray(data) ? data
    .map(x => ({ tag: String(x.tag), count: Number(x.count || 0) }))
    : [];
}