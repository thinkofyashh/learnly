import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "12vh 20px" }}>
      <span style={{ color: "var(--primary)" }}>404</span>
      <h1>This note has wandered.</h1>
      <p style={{ color: "var(--text-secondary)" }}>The page may have moved or is not published.</p>
      <Link
        href="/notes"
        style={{
          display: "inline-block",
          marginTop: 20,
          background: "var(--primary)",
          color: "white",
          padding: "12px 18px",
          borderRadius: 8,
        }}
      >
        Return to library
      </Link>
    </div>
  );
}
