import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import Chip from "../components/Chip";

export default function Pantry() {
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(1800);

  const [items, setItems] = useState([]); // string[]
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Normalized set for quick checks (dedupe handling)
  const normalized = useMemo(
    () => new Set(items.map((s) => s.trim().toLowerCase())),
    [items]
  );

  // Load pantry on mount (if logged-in)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get("/api/pantry");
        setItems(Array.isArray(data) ? data : []);
      } catch {
        show("Failed to load pantry");
      }
    })();
  }, [token, show]);

  if (!token) {
    return (
      <div className="max-w-5xl mx-auto p-4 text-gray-700">
        Please log in to use Pantry.
      </div>
    );
  }

  // Helpers
  const addItem = (raw) => {
    const cleaned = String(raw || "").trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (normalized.has(key)) {
      show("Already in pantry");
      return;
    }
    setItems((prev) => [...prev, cleaned]);
    show("Added");
  };

  const removeItem = (label) => {
    setItems((prev) => prev.filter((x) => x !== label));
    show("Removed");
  };

  const clearAll = () => {
    setItems([]);
    show("Cleared");
  };

  const onKeyDown = (e) => {
    // Add on Enter or comma
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(input);
      setInput("");
    }
    // Backspace on empty input removes last chip
    if (e.key === "Backspace" && input === "" && items.length) {
      const last = items[items.length - 1];
      removeItem(last);
    }
  };

  const onPaste = (e) => {
    // Support comma-separated paste: "egg, milk, sugar"
    const text = e.clipboardData.getData("text");
    if (text.includes(",")) {
      e.preventDefault();
      text
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach(addItem);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const list = items.map((s) => s.trim()).filter(Boolean);
      await api.put("/api/pantry", { pantry: list });
      show("Pantry saved");
    } catch {
      show("Failed to save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-2">Your Pantry</h2>
      <p className="text-gray-600 mb-4">
        Type an ingredient and press <b>Enter</b> (or <b>,</b>) to add. Click × to remove.
      </p>

      {/* Input */}
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="e.g. flour"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <button
          onClick={() => {
            addItem(input);
            setInput("");
            inputRef.current?.focus();
          }}
          className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 min-h-10 rounded-md border bg-white p-3">
        {items.length === 0 ? (
          <span className="text-sm text-gray-500">No ingredients yet.</span>
        ) : (
          items.map((label) => (
            <Chip key={label} label={label} onRemove={() => removeItem(label)} />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          onClick={clearAll}
          className="inline-flex items-center rounded-md border px-3 py-2 hover:bg-gray-50"
        >
          Clear all
        </button>
      </div>

      <ToastPortal />
    </div>
  );
}