export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-600 flex justify-between">
        <span>© {new Date().getFullYear()} CookMate</span>
        <span>Built with React + Vite</span>
      </div>
    </footer>
  );
}