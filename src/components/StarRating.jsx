// src/components/StarRating.jsx
import { useMemo } from "react";

export default function StarRating({ value = 0, onChange, size = 20 }) {
  const stars = useMemo(() => [1,2,3,4,5], []);
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rate recipe">
      {stars.map((s) => {
        const filled = s <= Math.round(value);
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={filled}
            onClick={() => onChange?.(s)}
            className="text-yellow-500 hover:scale-110 transition"
            title={`${s} star${s>1?"s":""}`}
            style={{ fontSize: size }}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}