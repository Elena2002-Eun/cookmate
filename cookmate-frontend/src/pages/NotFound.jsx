import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: "3rem auto", textAlign: "center" }}>
      <h2>Page not found</h2>
      <p>Try going back to <Link to="/">Home</Link>.</p>
    </div>
  );
}