import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600 mt-2">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        to="/"
        className="inline-block mt-4 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}