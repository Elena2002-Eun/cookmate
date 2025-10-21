// cookmate-frontend/src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import useToast from "../hooks/useToast";
import { TOAST } from "../utils/toast";

const ALL_DIETS = ["vegan", "vegetarian", "gluten-free", "keto", "dairy-free", "nut-free"];

export default function Profile() {
  const { token } = useAuth();
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dietaryTags, setDietaryTags] = useState([]);

  // keep a clean copy for Reset
  const [serverSnapshot, setServerSnapshot] = useState({ displayName: "", dietaryTags: [] });

  const loadProfile = async () => {
    try {
      setLoading(true);
      // 👉 If your backend exposes /api/auth/me instead, change this path accordingly
      const { data } = await api.get("/api/me");
      setEmail(data.email || "");
      setDisplayName(data.displayName || "");
      const tags = Array.isArray(data.dietaryTags) ? data.dietaryTags : [];
      setDietaryTags(tags);
      setServerSnapshot({ displayName: data.displayName || "", dietaryTags: tags });
    } catch {
      show("Failed to load profile", TOAST.DURATION.long);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleTag = (tag) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const onSave = async () => {
    try {
      if (!displayName.trim()) {
        show("Display name is required", TOAST.DURATION.long);
        return;
      }
      setSaving(true);
      // 👉 If your backend exposes /api/auth/me instead, change this path accordingly
      await api.put("/api/me", { displayName, dietaryTags });
      show("Profile saved");
      setServerSnapshot({ displayName, dietaryTags });
    } catch {
      show("Failed to save profile", TOAST.DURATION.long);
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setDisplayName(serverSnapshot.displayName);
    setDietaryTags(serverSnapshot.dietaryTags);
    show("Reverted changes");
  };

  if (!token) return <div className="p-4">Please login to edit your profile.</div>;
  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <PageHeader
        title="My Profile"
        subtitle="Update your info and dietary preferences."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {/* Email (read-only) */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            value={email}
            disabled
            className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50 text-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500">You can’t change email yet.</p>
        </div>

        {/* Display name */}
        <div className="mb-6">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. Elena"
          />
          <p className="mt-1 text-xs text-gray-500">Shown in ratings and comments (coming soon).</p>
        </div>

        {/* Dietary tags */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Dietary tags</div>
          <div className="flex flex-wrap gap-2">
            {ALL_DIETS.map((t) => {
              const checked = dietaryTags.includes(t);
              return (
                <label
                  key={t}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer
                    ${checked ? "bg-blue-50 border-blue-300 text-blue-700" : "hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={checked}
                    onChange={() => toggleTag(t)}
                  />
                  {t}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            We’ll use these to prioritize matching recipes and suggestions.
          </p>
        </div>
      </div>

      <ToastPortal />
    </div>
  );
}