// src/services/recipes.js
import api from "../services/api";
import { getCached, setCached } from "./getCache";

/**
 * Fetch all available tags for filtering.
 * Returns simple array of tag strings.
 */
export async function fetchTags() {
  const { data } = await api.get("/api/recipes/tags");
  return (Array.isArray(data) ? data : []).map(String);
}

/**
 * Fetch paginated recipe list with optional filters.
 * Returns { items, total, page, pageSize, totalPages }.
 */
export async function fetchRecipes({
  difficulty = "",
  tag = "",
  page = 1,
  pageSize = 12,
}) {
  const params = new URLSearchParams();
  if (difficulty) params.set("difficulty", difficulty);
  if (tag) params.set("tag", tag);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  const qs = params.toString();
  const key = `/api/recipes/all?${qs}`;

  const cached = getCached(key);
  if (cached) return cached;
  const { data } = await api.get(key);
  setCached(key, data);
  return data; // { items, tota, page, pageSize, toatalPages }
}

/**
 * Fetch tag counts for “Quick Add” suggestions.
 * Expects API to return [{ tag: "breakfast", count: 23 }, ...].
 * Normalized to always be { tag, count }[].
 */
export async function fetchTagCounts() {
  const { data } = await api.get("/api/recipes/tag-counts");
  return Array.isArray(data)
    ? data
        .map(x => ({ tag: String(x.tag || ""), count: Number(x.count || 0) }))
        .filter(x => x.tag.trim() !== "")
    : [];
}