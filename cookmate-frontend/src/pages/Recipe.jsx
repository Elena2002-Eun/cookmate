import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function Recipe() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(()=>{ api.get(`/api/recipes/${id}`).then(r=> setRec(r.data)); },[id]);

  if(!rec) return <div style={{ padding: 16 }}>Loading...</div>;
  const steps = rec.steps || [];
  const s = steps[step];

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 16 }}>
      <h2>{rec.title}</h2>
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