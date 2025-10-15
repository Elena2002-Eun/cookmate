export default function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm shadow-sm">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full border px-1 text-xs leading-none hover:bg-gray-50"
        aria-label={`Remove ${label}`}
        title="Remove"
      >
        ×
      </button>
    </span>
  );
}