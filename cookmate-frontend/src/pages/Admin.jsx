// src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import useToast from "../hooks/useToast";
import { TOAST } from "../utils/toast";
import * as admin from "../services/admin"; // listRecipes, createRecipe, updateRecipe, deleteRecipe, listUsers, setUserRole
import Thumb from "../components/Thumb";
import api from "../services/api";

/* ───────────────────────── Helpers / Small Components ───────────────────────── */

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  busy,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="absolute inset-4 md:inset-1/4 rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        <div className="mt-6 flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChipInput({ value = [], onChange }) {
  const [chipText, setChipText] = useState("");
  const add = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    const set = new Set(value.map((x) => x.toLowerCase()));
    if (set.has(v.toLowerCase())) return;
    onChange([...(value || []), v]);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(chipText);
      setChipText("");
    }
    if (e.key === "Backspace" && chipText === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="rounded-md border bg-white p-2">
      <div className="flex flex-wrap gap-1.5">
        {(value || []).map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          >
            {t}
            <button
              className="opacity-60 hover:opacity-100"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`remove ${t}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          placeholder="Type and press Enter"
          className="min-w-[10ch] flex-1 px-1 outline-none text-sm"
          value={chipText}
          onChange={(e) => setChipText(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── Recipe Editor Modal ───────────────────────── */

function RecipeEditorModal({ open, initial, onClose, onSave }) {
  const [model, setModel] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => setModel(initial), [initial]);

  const validate = () => {
    const e = {};
    if (!String(model.title || "").trim()) e.title = "Title is required";
    const hasAnyIngredient = (model.ingredients || []).some((i) => (i.name || "").trim());
    const hasAnyStep = (model.steps || []).some((s) => (s.text || "").trim());
    if (!hasAnyIngredient && !hasAnyStep) {
      e.recipe = "Add at least one ingredient or one step.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const commit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSave(model);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] bg-black/40" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="absolute inset-4 lg:inset-10 rounded-2xl bg-white p-5 lg:p-8 shadow-xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{model?._id ? "Edit Recipe" : "New Recipe"}</h2>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Close
          </button>
        </div>

        {!!(errors.title || errors.recipe) && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {errors.title && <div>• {errors.title}</div>}
            {errors.recipe && <div>• {errors.recipe}</div>}
          </div>
        )}

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">
              Title<span className="text-red-600">*</span>
            </label>
            <input
              className={classNames(
                "w-full rounded-md border px-3 py-2 text-sm",
                errors.title && "border-red-300"
              )}
              value={model.title}
              onChange={(e) => setModel({ ...model, title: e.target.value })}
              placeholder="e.g. Creamy Mushroom Pasta"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Difficulty</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={model.difficulty || "easy"}
              onChange={(e) => setModel({ ...model, difficulty: e.target.value })}
            >
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Tags</label>
            <ChipInput value={model.tags || []} onChange={(tags) => setModel({ ...model, tags })} />
          </div>

          <div>
            <label className="block text-sm mb-1">Prep time (mins)</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={Number(model.prepTimeMin || 0)}
              onChange={(e) => setModel({ ...model, prepTimeMin: Number(e.target.value || 0) })}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm mb-1">Image URL</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={model.imageUrl || ""}
              onChange={(e) => setModel({ ...model, imageUrl: e.target.value })}
              placeholder="https://…"
            />
            <div className="mt-2 w-48">
              <Thumb src={model.imageUrl} alt={model.title} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ingredients</h3>
              <button
                className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                onClick={() =>
                  setModel({
                    ...model,
                    ingredients: [...(model.ingredients || []), { name: "", quantity: "" }],
                  })
                }
              >
                + Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {(model.ingredients || []).map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border px-2 py-1 text-sm"
                    placeholder="name"
                    value={ing.name}
                    onChange={(e) => {
                      const list = [...(model.ingredients || [])];
                      list[idx] = { ...list[idx], name: e.target.value };
                      setModel({ ...model, ingredients: list });
                    }}
                  />
                  <input
                    className="w-28 rounded-md border px-2 py-1 text-sm"
                    placeholder="qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const list = [...(model.ingredients || [])];
                      list[idx] = { ...list[idx], quantity: e.target.value };
                      setModel({ ...model, ingredients: list });
                    }}
                  />
                  <button
                    className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                    onClick={() => {
                      const list = [...(model.ingredients || [])];
                      list.splice(idx, 1);
                      setModel({ ...model, ingredients: list });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Steps</h3>
              <button
                className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                onClick={() =>
                  setModel({
                    ...model,
                    steps: [...(model.steps || []), { text: "", durationSec: 0 }],
                  })
                }
              >
                + Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {(model.steps || []).map((st, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <textarea
                    className="flex-1 rounded-md border px-2 py-1 text-sm"
                    rows={2}
                    placeholder="Step text"
                    value={st.text}
                    onChange={(e) => {
                      const list = [...(model.steps || [])];
                      list[idx] = { ...list[idx], text: e.target.value };
                      setModel({ ...model, steps: list });
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    className="w-24 rounded-md border px-2 py-1 text-sm"
                    placeholder="sec"
                    value={Number(st.durationSec || 0)}
                    onChange={(e) => {
                      const list = [...(model.steps || [])];
                      list[idx] = { ...list[idx], durationSec: Number(e.target.value || 0) };
                      setModel({ ...model, steps: list });
                    }}
                  />
                  <button
                    className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                    onClick={() => {
                      const list = [...(model.steps || [])];
                      list.splice(idx, 1);
                      setModel({ ...model, steps: list });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={commit}
            disabled={saving}
            className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────── Main Admin Page ───────────────────────────────── */

const SECTIONS = [
  { key: "recipes", label: "Recipes" },
  { key: "users", label: "Users" },
  { key: "tags", label: "Tags", disabled: true }, // placeholder
  { key: "settings", label: "Settings", disabled: true }, // placeholder
];

export default function Admin() {
  const { show, ToastPortal } = useToast(TOAST.DURATION.short);

  // layout
  const [section, setSection] = useState("recipes");

  // shared search/pagination
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // stats (from your API directly)
  const [stats, setStats] = useState(null);

  // recipes
  const [recipes, setRecipes] = useState([]);
  const [rTotal, setRTotal] = useState(0);
  const [rLoading, setRLoading] = useState(false);

  // editor
  const emptyRecipe = useMemo(
    () => ({
      title: "",
      difficulty: "easy",
      tags: [],
      imageUrl: "",
      prepTimeMin: 0,
      ingredients: [{ name: "", quantity: "" }],
      steps: [{ text: "", durationSec: 0 }],
    }),
    []
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // users
  const [users, setUsers] = useState([]);
  const [uTotal, setUTotal] = useState(0);
  const [uLoading, setULoading] = useState(false);

  // confirms
  const [confirm, setConfirm] = useState({ open: false });
  const openConfirm = (opts) => setConfirm({ open: true, busy: false, ...opts });
  const closeConfirm = () => setConfirm({ open: false });

  // load stats (via your `api` import)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/admin/stats");
        setStats(data);
      } catch {
        // non-blocking
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [section]);

  useEffect(() => {
    if (section === "recipes") loadRecipes();
    if (section === "users") loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, query, page]);

  async function loadRecipes() {
    try {
      setRLoading(true);
      const { items, total } = await admin.listRecipes({ query, page, pageSize });
      setRecipes(items || []);
      setRTotal(total || 0);
    } catch {
      show("Failed to load recipes", TOAST.DURATION.long);
    } finally {
      setRLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setULoading(true);
      const { items, total } = await admin.listUsers({ query, page, pageSize });
      setUsers(items || []);
      setUTotal(total || 0);
    } catch {
      show("Failed to load users", TOAST.DURATION.long);
    } finally {
      setULoading(false);
    }
  }

  // recipe CRUD
  const openCreate = () => {
    setEditing(emptyRecipe);
    setEditorOpen(true);
  };
  const openEdit = (r) => {
    const copy = typeof structuredClone === "function" ? structuredClone(r) : JSON.parse(JSON.stringify(r));
    setEditing(copy);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
  };
  const saveRecipe = async (data) => {
    try {
      if (data._id) {
        await admin.updateRecipe(data._id, data);
        show("Recipe updated");
      } else {
        await admin.createRecipe(data);
        show("Recipe created");
      }
      closeEditor();
      loadRecipes();
    } catch {
      show("Failed to save recipe", TOAST.DURATION.long);
    }
  };
  const askDeleteRecipe = (id, title) =>
    openConfirm({
      title: "Delete recipe?",
      message: `This will permanently delete “${title || "Untitled"}”.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, busy: true }));
        try {
          await admin.deleteRecipe(id);
          show("Recipe deleted");
          closeConfirm();
          // refresh (and handle page bounce if needed)
          if (recipes.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
          else loadRecipes();
        } catch {
          setConfirm((c) => ({ ...c, busy: false }));
          show("Failed to delete recipe", TOAST.DURATION.long);
        }
      },
      onClose: closeConfirm,
    });

  // user role
  const askToggleRole = (u) =>
    openConfirm({
      title: u.role === "admin" ? "Demote to user?" : "Promote to admin?",
      message:
        u.role === "admin"
          ? `This will remove admin permissions from ${u.email}.`
          : `This will grant admin permissions to ${u.email}.`,
      confirmText: u.role === "admin" ? "Demote" : "Promote",
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, busy: true }));
        try {
          const next = u.role === "admin" ? "user" : "admin";
          await admin.setUserRole(u._id, next);
          show("Role updated");
          closeConfirm();
          loadUsers();
        } catch {
          setConfirm((c) => ({ ...c, busy: false }));
          show("Failed to update role", TOAST.DURATION.long);
        }
      },
      onClose: closeConfirm,
    });

  const total = section === "recipes" ? rTotal : uTotal;
  const loading = section === "recipes" ? rLoading : uLoading;

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <PageHeader title="Admin Panel" subtitle="Manage recipes and users." />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar */}
        <aside className="rounded-2xl border bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                disabled={s.disabled}
                onClick={() => setSection(s.key)}
                className={classNames(
                  "w-full text-left rounded-md px-3 py-2 text-sm",
                  s.key === section ? "bg-blue-600 text-white" : "hover:bg-gray-50",
                  s.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Optional tiny stats */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-md border p-2">
              <div className="text-[11px] text-gray-500">Users</div>
              <div className="text-lg font-semibold">{stats?.users ?? "—"}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-[11px] text-gray-500">Recipes</div>
              <div className="text-lg font-semibold">{stats?.recipes ?? "—"}</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section>
          {/* Toolbar */}
          <div className="rounded-2xl border bg-white p-3 shadow-sm flex flex-wrap items-center gap-2">
            <input
              className="rounded-md border px-3 py-2 text-sm flex-1 min-w-[220px]"
              placeholder={`Search ${section}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            {section === "recipes" && (
              <button
                onClick={openCreate}
                className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
              >
                New Recipe
              </button>
            )}
            {total > 0 && <div className="ml-auto text-sm text-gray-600">{total} {section}</div>}
          </div>

          {/* Tables */}
          {section === "recipes" ? (
            <div className="mt-3 rounded-2xl border bg-white overflow-hidden shadow-sm">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-2 w-28">Image</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Tags</th>
                      <th className="text-left p-2">Difficulty</th>
                      <th className="text-left p-2">Prep</th>
                      <th className="text-right p-2 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={6} className="p-4">Loading…</td></tr>}
                    {!loading && recipes.length === 0 && (
                      <tr><td colSpan={6} className="p-4 text-gray-500">No recipes</td></tr>
                    )}
                    {recipes.map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="w-24">
                            <Thumb src={r.imageUrl} alt={r.title} />
                          </div>
                        </td>
                        <td className="p-2 font-medium">{r.title}</td>
                        <td className="p-2 text-gray-600">{(r.tags || []).join(", ") || "—"}</td>
                        <td className="p-2">{r.difficulty || "—"}</td>
                        <td className="p-2">{r.prepTimeMin || 0}m</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => askDeleteRecipe(r._id, r.title)}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-2 p-2 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Prev
                </button>
                <div className="text-sm text-gray-700">Page {page}</div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={recipes.length < pageSize}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : section === "users" ? (
            <div className="mt-3 rounded-2xl border bg-white overflow-hidden shadow-sm">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Display name</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-right p-2 w-56">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={5} className="p-4">Loading…</td></tr>}
                    {!loading && users.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-gray-500">No users</td></tr>
                    )}
                    {users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.displayName || "—"}</td>
                        <td className="p-2">{u.role || "user"}</td>
                        <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => askToggleRole(u)}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            {u.role === "admin" ? "Demote to user" : "Promote to admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-2 p-2 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Prev
                </button>
                <div className="text-sm text-gray-700">Page {page}</div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={users.length < pageSize}
                  className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border bg-white p-6 text-gray-500">Coming soon.</div>
          )}
        </section>
      </div>

      {/* Modals */}
      <RecipeEditorModal open={editorOpen} initial={editing} onClose={closeEditor} onSave={saveRecipe} />
      <ConfirmModal {...confirm} />
      <ToastPortal />
    </div>
  );
}