// src/utils/settings.js
const KEY = "cookmate:settings:v1";

export const defaultSettings = {
  siteName: "CookMate",
  assistantEnabled: true,
  defaultPageSize: 12,
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...(patch || {}) };
  localStorage.setItem(KEY, JSON.stringify(next));
  // notify other tabs/components
  window.dispatchEvent(
    new StorageEvent("storage", { key: KEY, newValue: JSON.stringify(next) })
  );
  return next;
}

export function onSettingsChange(cb) {
  const handler = (e) => {
    if (e.key === KEY) cb(getSettings());
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}