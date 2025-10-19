// src/components/Chip.jsx
export default function Chip({ label, onRemove }) {
  return (
    <span
      className="
        inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-sm
        text-blue-800 border border-blue-200
      "
    >
      <span className="clamp-1">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-1 rounded-full px-1 text-xs text-blue-700 hover:bg-blue-100
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ×
        </button>
      )}
    </span>
  );
}