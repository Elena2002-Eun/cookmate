import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchRecipes, fetchTagCounts } from "../services/recipes"; // 👈 updated import
import { Link } from "react-router-dom";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"]; // "" = Any

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");

  const [tagCounts, setTagCounts] = useState([]); // [{tag, count}]
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");

  // load tag counts once
  useEffect(() => {
    (async () => {
      try {
        setTagsLoading(true);
        const list = await fetchTagCounts();
        setTagCounts(list); // e.g. [{tag:"breakfast",count:1},...]
      } catch {
        setError("Failed to load tags");
      } finally {
        setTagsLoading(false);
      }
    })();
  }, []);

  // fetch recipes whenever the URL query changes
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
              <option key={opt || "any"} value={opt}>{opt || "Any"}</option>
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
            <option value="">{tagsLoading ? "Loading..." : "Any"}</option>
            {tagCounts.map(tc => (
              <option key={tc.tag} value={tc.tag}>
                {tc.tag} ({tc.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {loading && <div>Loading…</div>}

      <ul style={{ marginTop: 12 }}>
      {items.map((r) => (
      <li key={r._id}>
      <Link to={`/recipe/${r._id}`}><strong>{r.title}</strong></Link>
      {" — "}{r.difficulty || "n/a"} — {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
      </li>
      ))}
      {!loading && items.length === 0 && <li>No recipes found.</li>}
      </ul>
    </div>
  );
}