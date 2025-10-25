// src/ai/localLLM.js
import { pipeline, env } from "@xenova/transformers";

// Tell Transformers.js to look under /public/models first
env.localModelPath = "/models";
env.allowRemoteModels = true;   // ok to keep true
env.useBrowserCache = true;     // caches in IndexedDB

let _qaPromise = null;
let _qaReady = false;

async function getQA() {
  if (!_qaPromise) {
    console.log("🧠 Loading QA model (local Flan-T5-small)...");
    _qaPromise = pipeline("text2text-generation", "Xenova/flan-t5-small", {
      progress_callback: (p) => console.log(`[QA] ${Math.round(p * 100)}%`),
    })
      .then((gen) => {
        _qaReady = true;
        console.log("✅ QA model ready (local)");
        return gen;
      })
      .catch((err) => {
        console.error("⚠️ QA load failed:", err);
        throw err;
      });
  }
  return _qaPromise;
}

// Definition/explain answers
async function qaAnswer(userMessage) {
  const qa = await getQA();
  const prompt =
    `Answer briefly, clearly, and accurately.\n\nQuestion: ${userMessage}\nAnswer:`;
  const out = await qa(prompt, { max_new_tokens: 120 });
  return String(out?.[0]?.generated_text || "").trim();
}

// Main entry used by AssistantChat
export async function localAnswer(userMessage, suggestions = [], opts = {}) {
  const mode = opts.mode || (suggestions?.length ? "plan" : "qa");
  if (mode === "qa") return qaAnswer(userMessage);

  // plan mode — reuse the same local model
  const bullets = (suggestions || [])
    .slice(0, 5)
    .map(
      (r, i) => `${i + 1}. ${r.title}${r.tags?.length ? ` [${r.tags.slice(0,4).join(", ")}]` : ""}`
    )
    .join("\n");

  const qa = await getQA();
  const prompt = [
    "Give practical, safe cooking ideas based on these recipes (if any).",
    bullets ? `Recipes:\n${bullets}` : "No recipes available — give general, safe ideas.",
    "",
    `User request: ${userMessage}`,
    "Respond in 3 short bullets or a tight paragraph.",
  ].join("\n");

  const out = await qa(prompt, { max_new_tokens: 140 });
  return String(out?.[0]?.generated_text || "").trim();
}

export async function preloadLocalModel() {
  try {
    await getQA();
    return true;
  } catch (e) {
    console.error("⚠️ Failed to preload model:", e);
    return false;
  }
}

export function isModelReady() {
  return _qaReady;
}