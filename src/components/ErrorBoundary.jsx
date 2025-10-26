import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, err: null };
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err, info) { console.error("💥 UI crashed:", err, info); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 max-w-xl mx-auto">
          <h1 className="text-xl font-semibold">Something went wrong.</h1>
          <p className="mt-2 text-sm text-gray-600">The page failed to render. Check the console for details.</p>
          <button className="mt-4 rounded-md border px-3 py-1.5 text-sm" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}