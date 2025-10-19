// src/utils/prefetch.js
import api from "../services/api";

const cache = new Map(); // id -> recipe object
const inflight = new Map(); // id -> Promise

export function getRecipeCached(id) {
  return cache.get(id) || null;
}

export async function prefetchRecipe(id) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  if (inflight.has(id)) return inflight.get(id);

  const p = api
    .get(`/api/recipes/${id}`)
    .then((r) => {
      cache.set(id, r.data);
      inflight.delete(id);
      return r.data;
    })
    .catch((e) => {
      inflight.delete(id);
      throw e;
    });

  inflight.set(id, p);
  return p;
}