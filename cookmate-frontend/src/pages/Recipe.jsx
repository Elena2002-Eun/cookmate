import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";

export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(2000);

  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [favBusy, setFavBusy] = useState(false);

  // Load recipe
  useEffect(() => {
    api
      .get(`/api/recipes/${id}`)
      .then((r) => setRec(r.data))
      .catch(() => show("Failed to load recipe"));
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
      show("Please login first");
      return;
    }
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${id}`);
        setFavIds((prev) => prev.filter((x) => x !== id));
        show("Removed from favorites");
      } else {
        await api.post(`/api/favorites/${id}`);
        setFavIds((prev) => [...prev, id]);
        show("Added to favorites");
      }
    } catch {
      show("Failed to update favorites");
    } finally {
      setFavBusy(false);
    }
  };

  // ----- Skeleton while loading -----
  if (!rec) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button
          onClick={() => navigate("/recipes")}
          className="mb-3 inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          ← Back to Recipes
        </button>

        <div className="h-7 w-2/3 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mt-3" />
        <div className="h-28 w-full bg-gray-200 rounded animate-pulse mt-4" />
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mt-3" />
      </div>
    );
  }

  const steps = Array.isArray(rec.steps) ? rec.steps : [];
  const hasSteps = steps.length > 0;
  const s = hasSteps ? steps[step] : null;

  const ingredientsLine = Array.isArray(rec.ingredients)
    ? rec.ingredients.map((i) => `${i.quantity || ""} ${i.name}`).join(", ")
    : "";

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        onClick={() => navigate("/recipes")}
        className="mb-3 inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← Back to Recipes
      </button>

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold">{rec.title}</h2>
        <button
          onClick={toggleFavorite}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          title={isFav ? "Unfavorite" : "Favorite"}
          className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm ${
            isFav ? "bg-yellow-100 border-yellow-300" : "hover:bg-gray-50"
          }`}
          disabled={favBusy}
        >
          {isFav ? "★" : "☆"}
        </button>
      </div>

      <div className="text-gray-600 mt-1">
        <b>Difficulty:</b> {rec.difficulty || "n/a"}{" · "}
        <b>Tags:</b> {Array.isArray(rec.tags) ? rec.tags.join(", ") : "—"}
      </div>

      <div className="mt-3">
        <b>Ingredients:</b> {ingredientsLine || "—"}
      </div>

      <div className="border rounded-lg p-4 mt-4 bg-white">
        {hasSteps ? (
          <>
            <div className="text-sm text-gray-600">
              Step {step + 1} of {steps.length}
            </div>
            <div className="text-lg mt-2">{s ? s.text : "Done!"}</div>
          </>
        ) : (
          <div>No steps for this recipe.</div>
        )}
      </div>

      {hasSteps && (
        <div className="flex gap-2 mt-3">
          <button
            disabled={step === 0}
            onClick={() => setStep((p) => Math.max(0, p - 1))}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            disabled={step >= steps.length - 1}
            onClick={() => setStep((p) => Math.min(steps.length - 1, p + 1))}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Toast outlet for this page */}
      <ToastPortal />
    </div>
  );
}