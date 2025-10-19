// src/components/Thumb.jsx
export default function Thumb({ src, alt = "", className = "" }) {
  const safeAlt = typeof alt === "string" ? alt : "";

  // SVG fallback if no image or broken link
  const fallback =
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

  // Optimize Unsplash image URLs
  const sizeParams = "?auto=format&fit=crop&w=640&q=70";
  const adjustedSrc =
    src?.includes("images.unsplash.com")
      ? `${src}${src.includes("?") ? "" : sizeParams}`
      : src;

  return (
    <div
      className={`aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100 ${className}`}
    >
      {adjustedSrc ? (
        <img
          src={adjustedSrc}
          alt={safeAlt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = fallback;
          }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-gray-400 text-sm"
          aria-hidden="true"
        >
          No image
        </div>
      )}
    </div>
  );
}