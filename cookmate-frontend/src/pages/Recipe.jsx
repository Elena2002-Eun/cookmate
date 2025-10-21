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
import StarRating from "../components/StarRating";

export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [favBusy, setFavBusy] = useState(false);

  // Guided Mode
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);

  // ⭐ My local rating (also used as optimistic UI when posting)
  const localKey = `rating:${id}`;
  const [myRating, setMyRating] = useState(() => {
    const v = localStorage.getItem(localKey);
    return v ? Number(v) : 0;
  });
  useEffect(() => {
    const v = localStorage.getItem(localKey);
    setMyRating(v ? Number(v) : 0);
  }, [localKey]);

  // Load recipe (cache → fetch)
  useEffect(() => {
    const cached = getRecipeCached(id);
    if (cached) {
      setRec(cached);
      return;
    }
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

  // Share / Print handlers
  const pageUrl =
    (typeof window !== "undefined" && window.location?.href) ||
    `${window?.location?.origin}/recipe/${id}`;

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: rec?.title || "Recipe",
          text: "Check out this recipe on CookMate",
          url: pageUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        show("Link copied to clipboard!");
      } else {
        // final fallback
        // eslint-disable-next-line no-alert
        prompt("Copy this URL", pageUrl);
      }
    } catch {
      show("Couldn’t share. Try copying the URL.", TOAST.DURATION.long);
    }
  };

  const onPrint = () => {
    window.print();
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

      {/* Title + Actions */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {rec.title}
            <Badge variant={difficultyBadgeVariant(rec.difficulty)}>
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="opacity-70" /> {rec.difficulty || "n/a"}
              </span>
            </Badge>
            {/* show avg/count if present */}
            {typeof rec.avgRating === "number" && (
              <span className="ml-2 text-sm text-gray-600">
                ★ {rec.avgRating} ({rec.ratingsCount || 0})
              </span>
            )}
          </span>
        }
        right={
          <div className="flex items-center gap-2">
            {/* Share / Print */}
            <button
              onClick={onShare}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              title="Share"
            >
              Share
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              title="Print"
            >
              Print
            </button>

            {/* Guided */}
            <button
              onClick={() => {
                setGuidedStep(0);
                setGuidedOpen(true);
              }}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Start guided mode
            </button>

            {/* Favorite */}
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
          </div>
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

      {/* ⭐ Rate this recipe (local + server if logged in) */}
      <div className="mt-3 flex items-center gap-2">
        <StarRating
          value={myRating}
          onChange={async (score) => {
            try {
              setMyRating(score);
              localStorage.setItem(localKey, String(score)); // optimistic & persists

              if (!token) {
                show("Saved locally. Log in to publish your rating.", TOAST.DURATION.long);
                return;
              }

              const { data } = await api.post(`/api/recipes/${id}/rate`, { value: score });
              if (data && typeof data.avgRating === "number") {
                setRec((r) =>
                  r ? { ...r, avgRating: data.avgRating, ratingsCount: data.ratingsCount } : r
                );
              }
            } catch {
              show("Failed to rate recipe", TOAST.DURATION.long);
            }
          }}
        />
        {myRating ? (
          <span className="text-sm text-gray-600">You rated {myRating}/5</span>
        ) : (
          <span className="text-sm text-gray-600">Rate this recipe</span>
        )}
      </div>

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
                  <li
                    key={idx}
                    className="flex justify-between gap-3 border-b pb-1 last:border-0"
                  >
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

      {/* Guided Mode Overlay */}
      {guidedOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-black/50"
          onClick={() => setGuidedOpen(false)}
        >
          <div
            className="absolute inset-4 md:inset-10 rounded-2xl bg-white p-5 md:p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Guided Cooking</h2>
              <button
                onClick={() => setGuidedOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Exit
              </button>
            </div>

            {hasSteps ? (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  Step {guidedStep + 1} of {steps.length}
                </div>
                <div className="text-lg leading-relaxed">
                  {steps[guidedStep]?.text}
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <button
                    disabled={guidedStep === 0}
                    onClick={() => setGuidedStep((s) => Math.max(0, s - 1))}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    disabled={guidedStep >= steps.length - 1}
                    onClick={() => setGuidedStep((s) => Math.min(steps.length - 1, s + 1))}
                    className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-gray-600">No steps found for this recipe.</div>
            )}
          </div>
        </div>
      )}

      {/* Toast outlet for this page */}
      <ToastPortal />
    </div>
  );
}