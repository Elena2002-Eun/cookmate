import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ⬅ added useNavigate
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Recipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState("");
  const [favBusy, setFavBusy] = useState(false); // optional: prevent double click

  // load recipe
  useEffect(() => {
    api.get(`/api/recipes/${id}`).then(r => setRec(r.data)).catch(() => {
      setMsg("Failed to load recipe");
    });
  }, [id]);

  // record history (only if logged in)
  useEffect(() => {
    if (!id || !token) return;
    api.post(`/api/history/${id}`).catch(() => {});
  }, [id, token]);

  // load favorites if logged in
  useEffect(() => {
    if (!token) return;
    api.get("/api/favorites")
      .then(r => setFavIds((r.data || []).map(x => x._id)))
      .catch(() => {});
  }, [token]);

  const isFav = useMemo(() => favIds.includes(id), [favIds, id]);

  const toggleFavorite = async () => {
    if (!token) { setMsg("Please login first"); return; }
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${id}`);
        setFavIds(prev => prev.filter(x => x !== id));
        setMsg("Removed from favorites");
      } else {
        await api.post(`/api/favorites/${id}`);
        setFavIds(prev => [...prev, id]);
        setMsg("Added to favorites");
      }
    } catch {
      setMsg("Failed to update favorites");
    } finally {
      setFavBusy(false);
    }
  };

  if (!rec) return <div style={{ padding: 16 }}>Loading...</div>;

  const steps = Array.isArray(rec.steps) ? rec.steps : [];
  const hasSteps = steps.length > 0;
  const s = hasSteps ? steps[step] : null;

  const ingredientsLine = Array.isArray(rec.ingredients)
    ? rec.ingredients.map(i => `${i.quantity || ""} ${i.name}`).join(", ")
    : "";

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <button onClick={() => navigate("/recipes")} style={{ marginBottom: 12 }}>
        ← Back to Recipes
      </button>

      <h2>
      {rec.title}{" "}
      <button onClick={toggleFavorite} title={isFav ? "Unfavorite" : "Favorite"}>
      {isFav ? "★" : "☆"}
      </button>
      </h2>

      <div style={{ color: "#666", marginBottom: 8 }}>
        <b>Difficulty:</b> {rec.difficulty || "n/a"}{" · "}
        <b>Tags:</b> {Array.isArray(rec.tags) ? rec.tags.join(", ") : "—"}
      </div>

      {msg && <div style={{ marginTop: 8, color: "#555" }}>{msg}</div>}

      <div style={{ marginTop: 8 }}>
        <b>Ingredients:</b> {ingredientsLine || "—"}
      </div>

      <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 12, marginTop: 16 }}>
        {hasSteps ? (
          <>
            <div>Step {step + 1} of {steps.length}</div>
            <div style={{ fontSize: 18, marginTop: 6 }}>{s ? s.text : "Done!"}</div>
          </>
        ) : (
          <div>No steps for this recipe.</div>
        )}
      </div>

      {hasSteps && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button disabled={step === 0} onClick={() => setStep(p => Math.max(0, p - 1))}>Back</button>
          <button disabled={step >= steps.length - 1} onClick={() => setStep(p => Math.min(steps.length - 1, p + 1))}>Next</button>
        </div>
      )}
    </div>
  );
}