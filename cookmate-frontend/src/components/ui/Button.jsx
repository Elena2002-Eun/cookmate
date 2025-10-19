// src/components/ui/Button.jsx
export default function Button({
  as: Comp = "button",
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-1.5 " +
    "transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 " +
    "hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transform-none motion-reduce:transition-none";

  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  }[variant];

  return (
    <Comp className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </Comp>
  );
}