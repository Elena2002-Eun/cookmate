// src/components/PageHeader.jsx
export default function PageHeader({
  title,
  subtitle,
  right = null,
  as: As = "h1",
  className = "",
}) {
  return (
    <div
      className={[
        "mb-5 sm:mb-8",
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2",
        className,
      ].join(" ")}
      aria-label="page header"
    >
      <div className="min-w-0 flex-1">
        <As className="text-2xl sm:text-3xl font-semibold leading-tight clamp-1">
          {title}
        </As>
        {subtitle ? (
          <p className="text-sm sm:text-base text-gray-600 leading-snug mt-0.5 clamp-2">
            {subtitle}
          </p>
        ) : null}
      </div>

      {right ? (
        <div className="pt-1 sm:pt-0 flex-shrink-0">{right}</div>
      ) : null}
    </div>
  );
}