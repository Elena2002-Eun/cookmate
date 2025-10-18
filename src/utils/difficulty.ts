export function difficultyBadgeVariant(diff?: string) {
  const d = (diff || "").toLowerCase();
  if (d === "easy") return "green";
  if (d === "medium") return "amber";
  if (d === "hard") return "rose";
  return "default";
}