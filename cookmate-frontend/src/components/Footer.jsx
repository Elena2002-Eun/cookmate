// src/components/Footer.jsx
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t bg-white/50">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
        <div>&copy; {year} CookMate</div>
        <nav className="flex items-center gap-4">
          <a
            href="https://github.com/Elena2002-Eun/cookmate"
            target="_blank"
            rel="noreferrer"
            className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
          >
            GitHub
          </a>
          <a
            href="/"
            className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
          >
            Privacy
          </a>
          <a
            href="/"
            className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
          >
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}