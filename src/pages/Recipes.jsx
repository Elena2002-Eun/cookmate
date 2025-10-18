// src/pages/Recipes.jsx
import { useEffect, useMemo, useState, memo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { fetchRecipes, fetchTagCounts } from "../services/recipes";
import PageHeader from "../components/PageHeader";
import Badge from "../components/ui/Badge";
import { TagIcon, FlameIcon } from "../components/icons";
import { difficultyBadgeVariant } from "../utils/difficulty";
import Thumb from "../components/Thumb";
import { prefetchRecipe } from "../utils/prefetch";
import usePrefetchOnVisible from "../hooks/usePrefetchOnVisible";

const DIFFICULTY_OPTIONS = ["", "easy", "medium", "hard"]; // "" = Any

// ✅ Child card (safe for hooks)
const RecipeCard = memo(function RecipeCard({ r }) {
  const prefetchRef = usePrefetchOnVisible(() => prefetchRecipe(r._id));
  const tags = Array.isArray(r.tags) ? r.tags : [];

  return (
    <li>
      <Link
        ref={prefetchRef}
        to={`/recipe/${r._id}`}
        aria-label={`Open recipe: ${r.title}`}
        onMouseEnter={() => prefetchRecipe(r._id)}
        onFocus={() => prefetchRecipe(r._id)}
        className="
          group block rounded-xl border bg-white p-3 shadow-sm transition
          hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-blue-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          motion-reduce:transform-none motion-reduce:transition-none
        "
      >
        <Thumb src={r.imageUrl} alt={r.title} />

        <div className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold clamp-2 group-hover:underline">{r.title}</h3>
            <Badge variant={difficultyBadgeVariant(r.difficulty)} className="shrink-0">
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="opacity-70" />
                {r.difficulty || "n/a"}
              </span>
            </Badge>
          </div>

          <div className="mt-1 text-xs text-gray-600 clamp-1">
            {tags.join(", ")}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((t, i) => (
              <Badge key={`${r._id}-tag-${t || "untagged"}-${i}`} variant="blue">
                <span className="inline-flex items-center gap-1">
                  <TagIcon />
                  {t || "untagged"}
                </span>
              </Badge>
            ))}
            {tags.length > 2 && <Badge>+{tags.length - 2} more</Badge>}
          </div>
        </div>
      </Link>
    </li>
  );
});

export default function Recipes() {
  const location = useLocation();
  const navigate = useNavigate();

  // URL params
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Filters
  const [difficulty, setDifficulty] = useState(params.get("difficulty") || "");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const pageSize = 12;

  // Data
  const [tagCounts, setTagCounts] = useState([]);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // UI
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync state with URL
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setPage(Number(qp.get("page") || 1));
    setDifficulty(qp.get("difficulty") || "");
    setTag(qp.get("tag") || "");
  }, [location.search]);

  // Load tag counts
  useEffect(() => {
    (async () => {
      try {
        setTagsLoading(true);
        const list = await fetchTagCounts();
        setTagCounts(
          Array.isArray(list)
            ? list
                .map((x) => ({
                  tag: String(x.tag || "").trim(),
                  count: Number(x.count || 0),
                }))
                .filter((x) => x.tag)
            : []
        );
      } catch {
        setError("Failed to load tags");
      } finally {
        setTagsLoading(false);
      }
    })();
  }, []);

  // Fetch recipes
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

  // Update URL filters
  const applyFilters = (next) => {
    const q = new URLSearchParams();
    if (next.difficulty) q.set("difficulty", next.difficulty);
    if (next.tag) q.set("tag", next.tag);
    q.set("page", "1");
    navigate({ pathname: "/recipes", search: `?${q.toString()}` }, { replace: false });
  };

  // Pagination
  const gotoPage = (p) => {
    const q = new URLSearchParams(location.search);
    if (p <= 1) q.delete("page");
    else q.set("page", String(p));
    navigate({ pathname: "/recipes", search: q.toString() ? `?${q}` : "" });
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <PageHeader
        title="Recipes"
        subtitle="Filter by difficulty or tag. Click a recipe to view details."
      />

      {/* Filters */}
      <fieldset className="flex flex-wrap items-end gap-4 mb-4">
        <legend className="sr-only">Filter recipes</legend>

        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Difficulty
          </label>
          <select
            id="difficulty"
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
          <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
            Tag
          </label>
          <select
            id="tag"
            className="rounded-md border px-3 py-2 text-sm"
            value={tag}
            disabled={tagsLoading}
            onChange={(e) => {
              const v = e.target.value;
              setTag(v);
              applyFilters({ difficulty, tag: v });
            }}
          >
            <option value="">{tagsLoading ? "Loading..." : "Any"}</option>
            {tagCounts
            .filter(tc => typeof tc?.tag === "string" && tc.tag.trim() !== "")
            .map((tc) => (
              <option key={`tagopt-${tc.tag}`} value={tc.tag}>
                {tc.tag} ({Number(tc.count || 0)})
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
      </fieldset>

      {/* Status */}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {!loading && total > 0 && (
        <div className="text-sm text-gray-600 mb-2">
          {total} result{total === 1 ? "" : "s"}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="rounded-xl border bg-white p-3">
              <div className="aspect-[4/3] w-full rounded-lg bg-gray-200 animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Results */}
      {!loading && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            {items.map((r) => (
              <RecipeCard key={r._id} r={r} />
            ))}
          </ul>

          {!items.length && (
            <div className="mt-6 rounded-2xl border bg-white p-8 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-blue-50 grid place-items-center">
                <span className="text-blue-600 text-lg">🍳</span>
              </div>
              <h3 className="text-lg font-semibold">No recipes match those filters</h3>
              <p className="mt-1 text-sm text-gray-600">
                Try removing a filter or browsing all recipes.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => navigate("/recipes")}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Clear filters
                </button>
                <Link
                  to="/"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Home search
                </Link>
              </div>
            </div>
          )}
        </>
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