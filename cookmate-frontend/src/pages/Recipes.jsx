import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toQuery } from "../services/query";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"];
const TAG_OPTIONS = ["", "breakfast", "vegetarian", "dinner"]; // extend as you add more

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial filters from URL
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecipes = async (opts = {}) => {
    setLoading(true);
    try {
      const query = toQuery(opts);
      const url = query ? `/api/recipes/all?${query}` : `/api/recipes/all`;
      const { data } = await api.get(url);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  // On mount or when URL search changes (back/forward), refetch
  useEffect(() => {
    fetchRecipes({
      difficulty: params.get("difficulty") || "",
      tag: params.get("tag") || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // When a filter changes, push it to the URL and trigger fetch via effect
  const applyFilters = (next) => {
    const query = toQuery(next);
    navigate({ pathname: "/recipes", search: query ? `?${query}` : "" }, { replace: false });
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
          >
            {TAG_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt || "Any"}</option>
            ))}
          </select>
        </div>
      </div>

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