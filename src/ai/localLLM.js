// src/ai/localLLM.js
import { pipeline, env } from "@xenova/transformers";

// Look under /public/models first, but allow remote fallback and cache in IndexedDB
env.localModelPath = "/models";
env.allowRemoteModels = true;
env.useBrowserCache = true;

let _qaPromise = null;
let _qaReady = false;

function stubGenerator() {
  const gen = async (_prompt, _opts) => [
    { generated_text: "(Assistant temporarily offline — model not loaded.)" },
  ];
  gen.__stub = true;
  return gen;
}

async function getQA() {
  if (_qaPromise) return _qaPromise;

  // Attempt local model first (served from /public/models)
  console.log("🧠 Loading QA model (local) Xenova/flan-t5-small…");
  _qaPromise = pipeline(
    "text2text-generation",
    "/models/Xenova/flan-t5-small",
    { progress_callback: (p) => console.log(`[QA] ${Math.round(p * 100)}%`) }
  )
    .then((gen) => {
      _qaReady = true;
      console.log("✅ QA model ready (local)");
      return gen;
    })
    .catch(async (err) => {
      console.warn("⚠️ Local model failed, trying remote CDN:", err?.message || err);
      try {
        const remote = await pipeline(
          "text2text-generation",
          "Xenova/flan-t5-small",
          { progress_callback: (p) => console.log(`[QA(remote)] ${Math.round(p * 100)}%`) }
        );
        _qaReady = true;
        console.log("✅ QA model ready (remote)");
        return remote;
      } catch (err2) {
        console.warn("⚠️ Remote also failed; using stub:", err2?.message || err2);
        _qaReady = false;
        return stubGenerator();
      }
    });

  return _qaPromise;
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

/* ---------------- Helpers ---------------- */

async function qaAnswer(userMessage) {
  const qa = await getQA();
  const prompt = `Answer briefly, clearly, and accurately.\n\nQuestion: ${userMessage}\nAnswer:`;
  const out = await qa(prompt, { max_new_tokens: 120 });
  return String(out?.[0]?.generated_text || "").trim();
}

function formatSuggestionsBullets(suggestions = []) {
  return (suggestions || [])
    .slice(0, 5)
    .map((r, i) => {
      const tags = Array.isArray(r.tags) && r.tags.length ? ` [${r.tags.slice(0, 4).join(", ")}]` : "";
      return `${i + 1}. ${r.title || "Untitled"}${tags}`;
    })
    .join("\n");
}

/* ---------------- Public API ---------------- */

export async function localAnswer(userMessage, suggestions = [], opts = {}) {
  const mode = opts.mode || (Array.isArray(suggestions) && suggestions.length ? "plan" : "qa");

  try {
    if (mode === "qa") {
      return await qaAnswer(userMessage);
    }

    // plan mode — leverage same small model to synthesize short, practical ideas
    const bullets = formatSuggestionsBullets(suggestions);
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
  } catch (err) {
    console.warn("localAnswer error:", err?.message || err);
    return "(Assistant unavailable right now.)";
  }
}