import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchTags, fetchRecipes } from "../services/recipes";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"]; // "" = Any

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  // read current filters from URL
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");

  const [tags, setTags] = useState([""]); // first option will be "Any"
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");

  // load tag list once
  useEffect(() => {
    (async () => {
      try {
        setTagsLoading(true);
        const t = await fetchTags();
        // prepend "" as the "Any" option
        setTags(["", ...t]);
      } catch (e) {
        setError("Failed to load tags");
      } finally {
        setTagsLoading(false);
      }
    })();
  }, []);

  // fetch recipe list when URL search changes
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
      } catch (e) {
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Recipes</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div>
          <label>Difficulty</label><br />
          <select
            value={difficulty}
            onChange={(e) => {
              const v = e.target.value;
              setDifficulty(v);
              applyFilters({ difficulty: v, tag });
            }}
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt || "Any"}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Tag</label><br />
          <select
            value={tag}
            onChange={(e) => {
              const v = e.target.value;
              setTag(v);
              applyFilters({ difficulty, tag: v });
            }}
            disabled={tagsLoading}
          >
            {tags.map((opt) => (
              <option key={opt || "any"} value={opt}>{opt || "Any"}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {loading && <div>Loading…</div>}

      <ul style={{ marginTop: 12 }}>
        {items.map((r) => (
          <li key={r._id}>
            <strong>{r.title}</strong> — {r.difficulty || "n/a"} — {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
          </li>
        ))}
        {!loading && items.length === 0 && <li>No recipes found.</li>}
      </ul>
    </div>
  );
}