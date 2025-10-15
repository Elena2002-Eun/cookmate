import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { fetchRecipes, fetchTagCounts } from "../services/recipes";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"]; // "" = Any

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  // read current URL query
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // filter state (mirrors URL)
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");

  // pagination state (mirrors URL)
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const pageSize = 12;

  // data
  const [tagCounts, setTagCounts] = useState([]); // [{tag, count}]
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ui
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");

  // keep local page state in sync if user navigates (back/forward)
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setPage(Number(qp.get("page") || 1));
    setDifficulty(qp.get("difficulty") || "");
    setTag(qp.get("tag") || "");
  }, [location.search]);

  // load tag counts once
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

  // fetch recipes whenever URL query or page changes
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchRecipes({
          difficulty: params.get("difficulty") || "",
          tag: params.get("tag") || "",
          page,
          pageSize,
        });
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch {
        setError("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, page]);

  // push filters into the URL (always reset page to 1 when filters change)
  const applyFilters = (next) => {
    const q = new URLSearchParams();
    if (next.difficulty) q.set("difficulty", next.difficulty);
    if (next.tag) q.set("tag", next.tag);
    q.set("page", "1");
    navigate({ pathname: "/recipes", search: `?${q.toString()}` }, { replace: false });
  };

  // go to a page, preserve existing filters
  const gotoPage = (p) => {
    const q = new URLSearchParams(location.search);
    if (p <= 1) q.delete("page");
    else q.set("page", String(p));
    navigate({ pathname: "/recipes", search: q.toString() ? `?${q}` : "" });
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

        {(difficulty || tag) && (
          <button
            onClick={() => applyFilters({ difficulty: "", tag: "" })}
            className="h-10 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Status */}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading && <div>Loading…</div>}
      {!loading && total > 0 && (
        <div className="text-sm text-gray-600 mb-2">{total} result{total === 1 ? "" : "s"}</div>
      )}

      {/* Results */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
        {items.map((r) => (
          <li key={r._id}>
            <Link
              to={`/recipe/${r._id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-md transition"
            >
              <div className="font-semibold">{r.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {r.difficulty || "n/a"} • {Array.isArray(r.tags) ? r.tags.join(", ") : ""}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && (
        <div className="text-gray-600 mt-3">No recipes found.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => gotoPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          <div className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => gotoPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}