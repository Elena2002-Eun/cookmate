// src/services/getCache.js
const cache = new Map(); // key -> { data, t }
const TTL = 60 * 1000;   // 60s

export function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > TTL) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

export function setCached(key, data) {
  cache.set(key, { data, t: Date.now() });
}