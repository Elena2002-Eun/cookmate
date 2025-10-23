// src/pages/Recipe.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

/* ───────────────────── helpers ───────────────────── */
function fmtMMSS(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/* ───────────────────── Guided Cooking player (inline) ───────────────────── */
function GuidedPlayer({ recipe, onExit }) {
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.durationSec || 0);
  const [running, setRunning] = useState(false);
  const [voice, setVoice] = useState(false);

  const key = useMemo(() => `cookmate-guided:${recipe?._id}`, [recipe?._id]);
  const raf = useRef(null);
  const last = useRef(null);

  // resume from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Number.isInteger(saved.idx)) setIdx(saved.idx);
        if (typeof saved.remaining === "number") setRemaining(saved.remaining);
      } else {
        setRemaining(steps[0]?.durationSec || 0);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // persist progress
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ idx, remaining }));
  }, [key, idx, remaining]);

  // when step changes, reset timer & speak if enabled
  useEffect(() => {
    setRemaining(steps[idx]?.durationSec || 0);
    if (voice && steps[idx]?.text && "speechSynthesis" in window) {
      const uttr = new SpeechSynthesisUtterance(steps[idx].text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(uttr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // timer loop
  useEffect(() => {
    if (!running) return;
    const tick = (t) => {
      if (!last.current) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;
      setRemaining((v) => {
        const next = v - dt;
        if (next <= 0) {
          setRunning(false);
          last.current = null;
          setTimeout(() => nextStep(), 0);
          return 0;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = null;
    };
  }, [running]);

  const curr = steps[idx] || { text: "", durationSec: 0, ingredientsUsed: [] };
  const total = Math.max(1, curr.durationSec || 0);
  const pct = Math.round(((total - remaining) / total) * 100);

  function start() { if (remaining <= 0) setRemaining(total); setRunning(true); }
  function pause() { setRunning(false); }
  function reset() { setRunning(false); setRemaining(total); }
  function prevStep() { setRunning(false); setIdx((i) => Math.max(0, i - 1)); }
  function nextStep() { setRunning(false); setIdx((i) => Math.min(steps.length - 1, i + 1)); }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Guided Cooking</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} />
            Voice prompts
          </label>
          <button onClick={onExit} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Exit
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 grow overflow-auto">
        <div className="text-xs text-gray-500">Step {idx + 1} / {steps.length}</div>
        <div className="mt-1 text-lg leading-relaxed">{curr.text || "—"}</div>

        {/* Ingredients used this step */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1">Ingredients used</div>
          <div className="flex flex-wrap gap-2">
            {(curr.ingredientsUsed || []).length ? (
              curr.ingredientsUsed.map((i, k) => (
                <span key={k} className="rounded-full border px-2 py-0.5 text-xs">{i}</span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">—</span>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="mt-5">
          <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="text-xl tabular-nums font-semibold">{fmtMMSS(remaining)}</div>
            <button onClick={start} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Start</button>
            <button onClick={pause} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Pause</button>
            <button onClick={reset} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Reset</button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={prevStep} disabled={idx === 0} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
              <button onClick={nextStep} disabled={idx >= steps.length - 1} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Recipe page ───────────────────── */
export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [favBusy, setFavBusy] = useState(false);

  // Guided overlay state
  const [guidedOpen, setGuidedOpen] = useState(false);

  // ⭐ local rating
  const localKey = `rating:${id}`;
  const [myRating, setMyRating] = useState(() => {
    const v = localStorage.getItem(localKey);
    return v ? Number(v) : 0;
  });
  useEffect(() => {
    const v = localStorage.getItem(localKey);
    setMyRating(v ? Number(v) : 0);
  }, [localKey]);

  // load recipe (cache → fetch)
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

  // record history (only if logged in)
  useEffect(() => {
    if (!id || !token) return;
    api.post(`/api/history/${id}`).catch(() => {});
  }, [id, token]);

  // load favorites (only if logged in)
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

  // loading skeleton
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

      {/* Title + actions */}
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {rec.title}
            <Badge variant={difficultyBadgeVariant(rec.difficulty)}>
              <span className="inline-flex items-center gap-1">
                <FlameIcon className="opacity-70" /> {rec.difficulty || "n/a"}
              </span>
            </Badge>
            {typeof rec.avgRating === "number" && (
              <span className="ml-2 text-sm text-gray-600">
                ★ {rec.avgRating} ({rec.ratingsCount || 0})
              </span>
            )}
          </span>
        }
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuidedOpen(true)}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Start guided mode
            </button>
            <button
              onClick={async () => {
                try {
                  const pageUrl = window.location?.href;
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
                    // eslint-disable-next-line no-alert
                    prompt("Copy this URL", pageUrl);
                  }
                } catch {
                  show("Couldn’t share. Try copying the URL.", TOAST.DURATION.long);
                }
              }}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Share
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Print
            </button>
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

      {/* Tags */}
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

      {/* Rating */}
      <div className="mt-3 flex items-center gap-2">
        <StarRating
          value={myRating}
          onChange={async (score) => {
            try {
              setMyRating(score);
              localStorage.setItem(localKey, String(score));
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
          lockId={rec._id}
          alt={rec.title ? `${rec.title} hero image` : "Recipe image"}
          className="aspect-[16/9]"
        />
      </div>

      {/* Two-column: steps + ingredients */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
        {/* Steps (simple view) */}
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

        {/* Sticky Ingredients */}
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
        {/* Guided Cooking (inline, always visible) */}
{Array.isArray(rec?.steps) && rec.steps.length > 0 ? (
  <div className="mt-4">
    <GuidedPlayer recipe={rec} onExit={() => setGuidedOpen(false)} />
  </div>
) : null}
      </div>

      {/* Guided Mode Overlay (with timers, resume, voice, per-step ingredients) */}
      {guidedOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-black/50"
          onClick={() => setGuidedOpen(false)}
        >
          <div
            className="absolute inset-4 md:inset-10 rounded-2xl bg-white p-5 md:p-8 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <GuidedPlayer recipe={rec} onExit={() => setGuidedOpen(false)} />
          </div>
        </div>
      )}

      <ToastPortal />
    </div>
  );
}