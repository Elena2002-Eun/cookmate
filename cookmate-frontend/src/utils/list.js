export const parseList = (str = "") =>
  String(str)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const joinList = (arr = []) => (Array.isArray(arr) ? arr.join(", ") : "");