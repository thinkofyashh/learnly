"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section style={{ maxWidth: 620, margin: "80px auto", textAlign: "center" }}>
      <span style={{ color: "var(--primary)", fontWeight: 800 }}>CONNECTION ERROR</span>
      <h1 style={{ margin: "18px 0" }}>Learnly could not load this page.</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Check that the FastAPI server and PostgreSQL are running, then try again.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          marginTop: 20,
          border: 0,
          borderRadius: "var(--radius-sm)",
          padding: "12px 18px",
          background: "var(--primary-surface)",
          color: "var(--on-primary)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </section>
  );
}
