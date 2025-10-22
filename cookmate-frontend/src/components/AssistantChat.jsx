import { useState } from "react";
import api from "../services/api";

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Tell me allergies or diets (e.g., gluten, dairy, vegan) and what you’d like to eat." }
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/assistant", { message: text });
      const { reply, suggestions = [] } = data || {};
      const suggestionLines = suggestions.map(
        s => `• ${s.title} (${s.difficulty || "n/a"}${s.prepTimeMin ? `, ~${s.prepTimeMin}m` : ""})`
      ).join("\n");

      const body = [reply || "Here are some ideas:", suggestionLines].filter(Boolean).join("\n");
      setMessages(m => [...m, { role: "assistant", text: body, suggestions }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Sorry — I had trouble finding recipes." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
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
                <div className={`inline-block rounded-xl px-3 py-2 whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  {m.text}
                </div>
                {m.role === "assistant" && Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {m.suggestions.map(s => (
                      <li key={s._id}>
                        <a href={`/recipe/${s._id}`} className="text-blue-600 hover:underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500">Thinking…</div>}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2"
              placeholder="e.g., Gluten allergy, quick dinner ideas"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send} className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}