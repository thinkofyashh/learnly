import { UploadForm } from "@/components/AdminViews";

export default function Upload() {
  return (
    <>
      <header style={{ marginBottom: 32 }}>
        <span
          style={{
            color: "var(--primary)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          New document
        </span>
        <h1 style={{ margin: "12px 0" }}>Add to your library.</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Upload an educational PDF for storage, text extraction, and publication review.
        </p>
      </header>
      <UploadForm />
    </>
  );
}
