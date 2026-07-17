import { notFound } from "next/navigation";

import { Pipeline, UploadForm } from "@/components/AdminViews";
import { StatusBadge } from "@/components/ui";
import { documents } from "@/mocks/documents";

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = documents.find((item) => item.id === Number(id));

  if (!document) notFound();

  return (
    <>
      <header style={{ marginBottom: 35 }}>
        <StatusBadge status={document.status} />
        <h1 style={{ margin: "15px 0" }}>{document.title ?? document.originalFilename}</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {document.description ?? "Document metadata is incomplete and ready for review."}
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(290px,.45fr)",
          gap: 22,
        }}
      >
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h2>Metadata review</h2>
          <UploadForm />
        </section>
        <aside
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h2>Pipeline</h2>
          <Pipeline failed={document.status === "failed"} />
          {document.processingError && (
            <p
              role="alert"
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
                padding: 12,
                borderRadius: 8,
              }}
            >
              {document.processingError}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
