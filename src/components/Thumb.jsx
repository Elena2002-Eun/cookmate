// src/components/Thumb.jsx
import { useMemo, useState } from "react";

function stableHash(s = "") {
  // tiny, deterministic hash → positive int
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0) % 1000000;
}

/**
 * Thumb
 * Props:
 *  - src?: string            // recipe.imageUrl
 *  - alt?: string
 *  - className?: string
 *  - recipeId?: string       // preferred seed for deterministic fallback
 *  - title?: string          // used to build food keywords
 *  - tags?: string[]         // used to build food keywords
 *  - lockId?: string         // optional alternative seed (legacy prop)
 */
export default function Thumb({
  src,
  alt = "",
  className = "",
  recipeId,
  title = "",
  tags = [],
  lockId = "",
}) {
  const safeAlt = typeof alt === "string" ? alt : "";

  // Build deterministic food-only fallbacks
  const { primaryFallback, tinyFallback } = useMemo(() => {
    // seed preference: recipeId → lockId → title → default
    const seedSource = String(recipeId || lockId || title || "cookmate");
    const lock = stableHash(seedSource);

    // Food-ish keywords from title and tags
    const words = [title, ...(tags || [])]
      .filter(Boolean)
      .join(", ")
      .toLowerCase()
      .replace(/[^a-z0-9, ]/g, "");

    // "food" first, then words; collapse stray commas
    const query = ["food", words || ""].join(",").replace(/,+/g, ",");

    // Primary (3:2-ish) and a smaller backup
    const primary = `https://loremflickr.com/640/426/${encodeURIComponent(query)}/all?lock=${lock}`;
    const tiny = `https://loremflickr.com/480/320/${encodeURIComponent(query)}/all?lock=${lock}`;
    return { primaryFallback: primary, tinyFallback: tiny };
  }, [recipeId, lockId, title, tags]);

  // Last-resort inline SVG
  const svgFallback =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120'>
        <rect width='100%' height='100%' fill='#f1f5f9'/>
        <g fill='#cbd5e1'>
          <rect x='20' y='20' width='120' height='80' rx='8'/>
          <circle cx='50' cy='55' r='14'/>
          <rect x='75' y='45' width='55' height='12' rx='6'/>
          <rect x='75' y='63' width='40' height='10' rx='5'/>
        </g>
      </svg>`
    );

  // Start with DB image if provided; otherwise our deterministic fallback
  const start = (src || "").trim() || primaryFallback;
  const [imgSrc, setImgSrc] = useState(start);
  const [stage, setStage] = useState(src ? "db" : "fallback"); // db → fallback → tiny → svg

  return (
    <div className={`aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      <img
        src={imgSrc}
        alt={safeAlt || title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
        onError={() => {
          if (stage === "db") {
            setStage("fallback");
            setImgSrc(primaryFallback);
          } else if (stage === "fallback") {
            setStage("tiny");
            setImgSrc(tinyFallback);
          } else {
            setStage("svg");
            setImgSrc(svgFallback);
          }
        }}
      />
    </div>
  );
}