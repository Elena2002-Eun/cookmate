export default function Badge({ children, variant = "default", className = "" }) {
  const styles = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    green:   "bg-green-50 text-green-700 border-green-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles} ${className}`}>
      {children}
    </span>
  );
}