import { useState, useMemo } from "react";

/**
 * Thumb
 * - Uses DB image if present
 * - Fallback: deterministic food-only image (loremflickr, exclude people)
 * - Last-resort: inline SVG placeholder
 *
 * Props:
 *   src: string        // recipe.imageUrl (may be empty or broken)
 *   alt: string
 *   className: string
 *   lockId: string     // recipe._id (used to "lock" a consistent fallback image)
 */
export default function Thumb({ src, alt = "", className = "", lockId = "" }) {
  const safeAlt = typeof alt === "string" ? alt : "";

  // Build a deterministic food-only fallback from loremflickr
  // Correct syntax: /width/height/topic1,topic2,-exclude1,-exclude2?lock=seed
  const fallbackFoodUrl = useMemo(() => {
    const seed = encodeURIComponent(String(lockId || "cookmate"));
    // add several food-related topics; exclude people
    return `https://loremflickr.com/960/720/food,meal,plate,recipe,vegetable,fruit,-person,-people,-portrait?lock=${seed}`;
  }, [lockId]);

  // Tiny fallback (second try) if the main fallback somehow fails
  const tinyFoodUrl = useMemo(() => {
    const seed = encodeURIComponent(String(lockId || "cookmate"));
    return `https://loremflickr.com/640/480/food,meal,plate,recipe,vegetable,fruit,-person,-people,-portrait?lock=${seed}`;
  }, [lockId]);

  // Your original SVG placeholder (last resort)
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

  // Start with DB image if provided; otherwise use food fallback
  const [imgSrc, setImgSrc] = useState(src || fallbackFoodUrl);
  const [stage, setStage] = useState(src ? "db" : "fallback"); // "db" -> "fallback" -> "tiny" -> "svg"

  return (
    <div className={`aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      <img
        src={imgSrc}
        alt={safeAlt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
        onError={() => {
          // Progressively degrade through fallbacks
          if (stage === "db") {
            setStage("fallback");
            setImgSrc(fallbackFoodUrl);
          } else if (stage === "fallback") {
            setStage("tiny");
            setImgSrc(tinyFoodUrl);
          } else {
            setStage("svg");
            setImgSrc(svgFallback);
          }
        }}
      />
    </div>
  );
}