// src/components/AssistantChat.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import { localAnswer, preloadLocalModel, isModelReady } from "../ai/localLLM";

// Simple detector for definition/explain questions
function isGeneralQuestion(text = "") {
  const t = String(text).toLowerCase();
  return /\b(what is|what's|why|how to|explain|define|difference|is it|is this|should i|can i)\b/.test(t);
}

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi! Tell me allergies or diets (e.g., gluten, dairy, vegan) and what you’d like to eat. " +
        "I’ll suggest safe recipes and explain why.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false); // track readiness

  // ✅ Global preload when app/assistant mounts
  useEffect(() => {
    preloadLocalModel().then(() => {
      console.log("✅ AI model ready!");
      setModelReady(true);
    });
  }, []);

  // Optional — recheck if reopened
  useEffect(() => {
    if (!open || modelReady) return;
    let cancelled = false;
    (async () => {
      setModelLoading(true);
      const ok = await preloadLocalModel();
      if (!cancelled) {
        setModelReady(!!ok);
        setModelLoading(false);
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

    try {
      const general = isGeneralQuestion(text);

      // If the model isn't ready yet, show a friendly message and bail out
      if (!modelReady) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "I'm loading the AI engine — please wait a bit and try again.",
          },
        ]);
        return;
      }

      if (general) {
        // Q&A mode (definitions, explanations)
        setModelLoading(true);
        let llmText = await localAnswer(text, [], { mode: "qa" });
        setModelLoading(false);
        setMessages((m) => [...m, { role: "assistant", text: llmText }]);
      } else {
        // Planning / suggestions: get recipes first
        const { data } = await api.post("/api/assistant", { message: text });
        const { reply: baseReply, suggestions = [] } = data || {};

        setModelLoading(true);
        let llmText = baseReply || "Here are some ideas:";
        try {
          llmText = await localAnswer(text, suggestions, { mode: "plan" });
        } catch {
          // fallback to base reply
        }
        setModelLoading(false);

        setMessages((m) => [
          ...m,
          { role: "assistant", text: llmText, suggestions },
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
          <div className="p-3 border-b font-semibold">Diet & Recipe Assistant</div>

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

                {/* clickable recipe suggestions */}
                {m.role === "assistant" &&
                  Array.isArray(m.suggestions) &&
                  m.suggestions.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {m.suggestions.map((s) => (
                        <li key={s._id}>
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

            {(loading || modelLoading) && (
              <div className="text-sm text-gray-500">
                {modelLoading
                  ? "Loading local AI model (first time setup, please wait)…"
                  : "Thinking…"}
              </div>
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
              className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}