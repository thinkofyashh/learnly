import { notFound } from "next/navigation";

import { AdminPageHeader, Pipeline, UploadForm } from "@/components/AdminViews";
import styles from "@/components/AdminViews.module.css";
import { StatusBadge } from "@/components/ui";
import { documents } from "@/mocks/documents";

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = documents.find((item) => item.id === Number(id));
  if (!document) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Metadata review"
        title={document.title ?? document.originalFilename}
        body={document.description ?? "Document metadata is incomplete and ready for review."}
      >
        <StatusBadge status={document.status} />
      </AdminPageHeader>
      <div className={styles.reviewLayout}>
        <section className={styles.reviewPanel}>
          <h2>Document details</h2>
          <UploadForm />
        </section>
        <aside className={styles.reviewPanel}>
          <h2>Pipeline</h2>
          <Pipeline failed={document.status === "failed"} />
          {document.processingError && (
            <p role="alert" className={styles.alert}>
              {document.processingError}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
