// src/components/AssistantChat.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { localAnswer, preloadLocalModel, isModelReady } from "../ai/localLLM";
import { getSettings, onSettingsChange } from "../utils/settings";

/** Optional kill switch via .env:
 *  VITE_ASSISTANT_DISABLED=true  -> hide the widget entirely
 */
const DISABLED =
  String(import.meta.env.VITE_ASSISTANT_DISABLED || "").toLowerCase() === "true";

/** Read initial toggle from Settings (localStorage), default ON if unreadable */
const initialEnabled = (() => {
  try {
    return !!getSettings().assistantEnabled;
  } catch {
    return true;
  }
})();

function isGeneralQuestion(text = "") {
  const t = String(text).toLowerCase();
  return /\b(what is|what's|why|how to|explain|define|difference|is it|is this|should i|can i)\b/.test(
    t
  );
}

export default function AssistantChat() {
  // Respect global kill switch AND settings toggle
  const [enabled, setEnabled] = useState(initialEnabled);
  useEffect(() => {
    const off = onSettingsChange((s) => setEnabled(!!s.assistantEnabled));
    return off;
  }, []);

  if (DISABLED || !enabled) return null;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi! Tell me your allergies/diet (e.g., gluten, dairy, vegan) and what you’d like to eat. " +
        "I’ll suggest safe recipes and explain why.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(isModelReady());

  // Preload local model when chat opens (defensive: never hard-fail UI)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setModelLoading(true);
        const ok = await preloadLocalModel();
        if (!cancelled) {
          setModelReady(ok || isModelReady());
        }
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    const general = isGeneralQuestion(text);

    try {
      // Prefer local LLM if ready; else try backend; else safe placeholder
      if (general) {
        if (modelReady) {
          const answer = await localAnswer(text, [], { mode: "qa" });
          setMessages((m) => [
            ...m,
            { role: "assistant", text: answer || "(No answer)" },
          ]);
        } else {
          const { data } = await api
            .post("/api/assistant", { message: text })
            .catch(() => ({ data: null }));
          const reply = data?.reply || "(Assistant temporarily offline.)";
          setMessages((m) => [...m, { role: "assistant", text: reply }]);
        }
      } else {
        // Recipe-style queries: ask backend for suggestions; enrich with local LLM if available
        const { data } = await api
          .post("/api/assistant", { message: text })
          .catch(() => ({ data: {} }));
        const baseReply = data?.reply || "Here are some ideas:";
        const suggestions = Array.isArray(data?.suggestions)
          ? data.suggestions
          : [];

        let finalText = baseReply;
        if (modelReady) {
          try {
            finalText = await localAnswer(text, suggestions, { mode: "plan" });
          } catch {
            // keep baseReply if local model throws
          }
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", text: finalText, suggestions },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry — I had trouble answering that." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-blue-600 text-white px-4 py-3 shadow-lg hover:bg-blue-700"
      >
        {open ? "Close Assistant" : "Ask Assistant"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[min(90vw,380px)] rounded-2xl border bg-white shadow-xl">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-semibold">Diet & Recipe Assistant</div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  modelReady
                    ? "bg-green-500"
                    : modelLoading
                    ? "bg-yellow-400"
                    : "bg-gray-300"
                }`}
                title={
                  modelReady
                    ? "Model ready"
                    : modelLoading
                    ? "Loading model…"
                    : "Model not loaded"
                }
              />
              <span className="text-gray-500">
                {modelReady ? "AI ready" : modelLoading ? "Loading…" : "Fallback mode"}
              </span>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block rounded-xl px-3 py-2 whitespace-pre-wrap ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100"
                  }`}
                >
                  {m.text}
                </div>

                {m.role === "assistant" &&
                  Array.isArray(m.suggestions) &&
                  m.suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {m.suggestions.map((s) => (
                        <li key={s._id || s.title}>
                          <a
                            href={`/recipe/${s._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            ))}

            {modelLoading && (
              <div className="text-sm text-gray-500">Loading local AI model…</div>
            )}
            {loading && !modelLoading && (
              <div className="text-sm text-gray-500">Thinking…</div>
            )}
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              placeholder="Ask anything, or say your allergies…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              disabled={loading || modelLoading}
              className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}