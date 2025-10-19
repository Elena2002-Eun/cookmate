// src/pages/Recipe.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import PageHeader from "../components/PageHeader";
import { TOAST } from "../utils/toast";
import Badge from "../components/ui/Badge";
import { TagIcon, FlameIcon } from "../components/icons";
import { difficultyBadgeVariant } from "../utils/difficulty";
import Thumb from "../components/Thumb";
import { getRecipeCached, prefetchRecipe } from "../utils/prefetch";

export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [favBusy, setFavBusy] = useState(false);

  // Load recipe
  useEffect(() => {
    // 1) Try cache
  const cached = getRecipeCached(id);
  if (cached) {
    setRec(cached);
    return; // already have it
  }
  // 2) Otherwise fetch (and fill cache)
  prefetchRecipe(id)
    .then((data) => setRec(data))
    .catch(() => show(TOAST.msg.recipe_load_failed, TOAST.DURATION.long));
  }, [id, show]);

  // Record history (only if logged in)
  useEffect(() => {
    if (!id || !token) return;
    api.post(`/api/history/${id}`).catch(() => {});
  }, [id, token]);

  // Load favorites (only if logged in)
  useEffect(() => {
    if (!token) return;
    api
      .get("/api/favorites")
      .then((r) => setFavIds((r.data || []).map((x) => x._id)))
      .catch(() => {});
  }, [token]);

  const isFav = useMemo(() => favIds.includes(id), [favIds, id]);

  const toggleFavorite = async () => {
    if (!token) {
      show(TOAST.msg.auth_required, TOAST.DURATION.long);
      return;
    }
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${id}`);
        setFavIds((prev) => prev.filter((x) => x !== id));
        show(TOAST.msg.fav_removed);
      } else {
        await api.post(`/api/favorites/${id}`);
        setFavIds((prev) => [...prev, id]);
        show(TOAST.msg.fav_added);
      }
    } catch {
      show(TOAST.msg.fav_failed, TOAST.DURATION.long);
    } finally {
      setFavBusy(false);
    }
  };

  // ----- Skeleton while loading -----
  if (!rec) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <button
          onClick={() => navigate("/recipes")}
          className="mb-3 inline-flex items-center text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ← Back to Recipes
        </button>

        <PageHeader title="Loading…" />
        <div className="mt-3 rounded-xl border bg-white p-3">
          <div className="aspect-[16/9] w-full rounded-lg bg-gray-200 animate-pulse" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const steps = Array.isArray(rec.steps) ? rec.steps : [];
  const hasSteps = steps.length > 0;
  const s = hasSteps ? steps[step] : null;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <button
        onClick={() => navigate("/recipes")}
        className="mb-3 inline-flex items-center text-sm text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ← Back to Recipes
      </button>

      {/* Title + Favorite */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {rec.title}
            <Badge variant={difficultyBadgeVariant(rec.difficulty)}>
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="opacity-70" /> {rec.difficulty || "n/a"}
              </span>
            </Badge>
          </span>
        }
        right={
          <button
            onClick={toggleFavorite}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            title={isFav ? "Unfavorite" : "Favorite"}
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition
              hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${isFav ? "bg-yellow-100 border-yellow-300" : ""}`}
            disabled={favBusy}
          >
            {isFav ? "★" : "☆"}
          </button>
        }
      />

      {/* Tag chips row */}
      {Array.isArray(rec.tags) && rec.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rec.tags.map((t) => (
            <Badge key={t} variant="blue">
              <span className="inline-flex items-center gap-1">
                <TagIcon /> {t}
              </span>
            </Badge>
          ))}
        </div>
      )}

      {/* Hero image */}
      <div className="mt-4 rounded-2xl border bg-white p-3">
        <Thumb
          src={rec.imageUrl}
          alt={rec.title ? `${rec.title} hero image` : "Recipe image"}
          className="aspect-[16/9]"
        />
      </div>

      {/* Two-column layout: steps (left) + sticky ingredients (right) */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
        {/* Left: Steps */}
        <section className="md:col-span-2">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            {hasSteps ? (
              <>
                <div className="text-sm text-gray-600">
                  Step {step + 1} of {steps.length}
                </div>
                <div className="text-lg mt-2">{s ? s.text : "Done!"}</div>

                <div className="flex gap-2 mt-4">
                  <button
                    disabled={step === 0}
                    onClick={() => setStep((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Back
                  </button>
                  <button
                    disabled={step >= steps.length - 1}
                    onClick={() => setStep((p) => Math.min(steps.length - 1, p + 1))}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div>No steps for this recipe.</div>
            )}
          </div>
        </section>

        {/* Right: Sticky Ingredients */}
        <aside className="md:sticky md:top-20">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold">Ingredients</h3>
            {Array.isArray(rec.ingredients) && rec.ingredients.length > 0 ? (
              <ul className="mt-2 space-y-2 text-gray-800">
                {rec.ingredients.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 border-b pb-1 last:border-0">
                    <span>{i.name}</span>
                    <span className="text-gray-500">{i.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-gray-500">—</div>
            )}
          </div>
        </aside>
      </div>

      {/* Toast outlet for this page */}
      <ToastPortal />
    </div>
  );
}