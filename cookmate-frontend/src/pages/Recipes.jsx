import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { fetchRecipes, fetchTagCounts } from "../services/recipes";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"]; // "" = Any

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");

  const [tagCounts, setTagCounts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load tag counts once
  useEffect(() => {
    (async () => {
      try {
        setTagsLoading(true);
        const list = await fetchTagCounts();
        setTagCounts(list);
      } catch {
        setError("Failed to load tags");
      } finally {
        setTagsLoading(false);
      }
    })();
  }, []);

  // Fetch recipes whenever query changes
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchRecipes({
          difficulty: params.get("difficulty") || "",
          tag: params.get("tag") || "",
        });
        setItems(data);
      } catch {
        setError("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const applyFilters = (next) => {
    const q = new URLSearchParams();
    if (next.difficulty) q.set("difficulty", next.difficulty);
    if (next.tag) q.set("tag", next.tag);
    navigate({ pathname: "/recipes", search: q.toString() ? `?${q}` : "" }, { replace: false });
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Recipes</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={difficulty}
            onChange={(e) => {
              const v = e.target.value;
              setDifficulty(v);
              applyFilters({ difficulty: v, tag });
            }}
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt || "any"} value={opt}>
                {opt || "Any"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={tag}
            onChange={(e) => {
              const v = e.target.value;
              setTag(v);
              applyFilters({ difficulty, tag: v });
            }}
            disabled={tagsLoading}
          >
            <option value="">{tagsLoading ? "Loading..." : "Any"}</option>
            {tagCounts.map((tc) => (
              <option key={tc.tag} value={tc.tag}>
                {tc.tag} ({tc.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div>Loading…</div>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
        {items.map((r) => (
          <li key={r._id}>
            <Link
              to={`/recipe/${r._id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-md transition"
            >
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {r.difficulty || "n/a"} •{" "}
                {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && (
        <div className="text-gray-600 mt-3">No recipes found.</div>
      )}
    </div>
  );
}