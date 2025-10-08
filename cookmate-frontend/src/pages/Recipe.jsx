import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Recipe() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);
  const [favIds, setFavIds] = useState([]);
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState("");
  const { token } = useAuth();

  // load recipe
  useEffect(() => { api.get(`/api/recipes/${id}`).then(r=> setRec(r.data)); }, [id]);

  // ...
  useEffect(() => {
  if (!id || !token) return;
  api.post(`/api/history/view/${id}`).catch(()=>{});
  }, [id, token]);

  // load favorites if logged in
  useEffect(() => {
    if (!token) return;
    api.get("/api/favorites").then(r => {
      const ids = (r.data || []).map(x => x._id);
      setFavIds(ids);
    });
  }, [token]);

  const isFav = useMemo(() => favIds.includes(id), [favIds, id]);

  const toggleFavorite = async () => {
    if (!token) { setMsg("Please login first"); return; }
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${id}`);
        setFavIds((prev) => prev.filter(x => x !== id));
        setMsg("Removed from favorites");
      } else {
        await api.post(`/api/favorites/${id}`);
        setFavIds((prev) => [...prev, id]);
        setMsg("Added to favorites");
      }
    } catch {
      setMsg("Failed to update favorites");
    }
  };

  if (!rec) return <div style={{ padding: 16 }}>Loading...</div>;
  const steps = rec.steps || [];
  const s = steps[step];

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>
        {rec.title}{" "}
        <button onClick={toggleFavorite} title={isFav ? "Unfavorite" : "Favorite"}>
          {isFav ? "★" : "☆"}
        </button>
      </h2>

      {msg && <div style={{marginTop:8, color:"#555"}}>{msg}</div>}

      <div><b>Ingredients:</b> {(rec.ingredients||[]).map(i=>`${i.quantity||""} ${i.name}`).join(", ")}</div>

      <div style={{border:"1px solid #ccc", borderRadius: 6, padding: 12, marginTop: 16}}>
        <div>Step {step+1} of {steps.length}</div>
        <div style={{ fontSize: 18, marginTop: 6 }}>{s ? s.text : "Done!"}</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button disabled={step===0} onClick={()=>setStep(p=>Math.max(0,p-1))}>Back</button>
        <button disabled={step>=steps.length-1} onClick={()=>setStep(p=>Math.min(steps.length-1,p+1))}>Next</button>
      </div>
    </div>
  );
}