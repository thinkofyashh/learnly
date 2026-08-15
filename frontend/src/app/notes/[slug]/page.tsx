import { notFound } from "next/navigation";
import Link from "next/link";

import { DocumentActions } from "@/components/DocumentActions";
import { Badge, formatBytes, NoteCard } from "@/components/ui";
import { getPublishedDocument, getPublishedDocuments, resolveApiUrl } from "@/services/api-client";

import styles from "./detail.module.css";

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [document, library] = await Promise.all([
    getPublishedDocument(slug),
    getPublishedDocuments(1, 3),
  ]);

  if (!document) notFound();

  const previewUrl = resolveApiUrl(document.previewUrl);
  const downloadUrl = resolveApiUrl(document.downloadUrl);

  return (
    <>
      <Link href="/notes" className={styles.back}>
        ← Back to library
      </Link>
      <header className={styles.header}>
        <div>
          <div className={styles.badges}>
            {document.difficulty && <Badge tone={document.difficulty}>{document.difficulty}</Badge>}
            {document.topics.map((topic) => (
              <Badge key={topic}>{topic}</Badge>
            ))}
          </div>
          <h1>{document.title}</h1>
          <p>{document.description ?? "A processed PDF from the Learnly library."}</p>
          <div className={styles.actions}>
            <DocumentActions downloadUrl={downloadUrl} />
          </div>
        </div>
        <dl>
          <div>
            <dt>Pages</dt>
            <dd>{document.pageCount ?? "—"}</dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>
              {document.estimatedReadingMinutes ? `${document.estimatedReadingMinutes} min` : "—"}
            </dd>
          </div>
          <div>
            <dt>File size</dt>
            <dd>{formatBytes(document.sizeBytes)}</dd>
          </div>
          <div>
            <dt>Views</dt>
            <dd>{document.viewCount}</dd>
          </div>
        </dl>
      </header>
      <div className={styles.layout}>
        <section>
          <div className={styles.preview}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={`Preview of ${document.title ?? document.originalFilename}`}
              />
            ) : (
              <p>Preview unavailable.</p>
            )}
          </div>
          <article className={styles.overview}>
            <span>Document overview</span>
            <h2>A focused path through the material</h2>
            <p>{document.description ?? "Open the PDF preview to explore this document."}</p>
          </article>
          {document.keyTakeaways.length > 0 && (
            <>
              <h2>Key takeaways</h2>
              <ul className={styles.takeaways}>
                {document.keyTakeaways.map((takeaway, index) => (
                  <li key={takeaway}>
                    <span>{index + 1}</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <aside>
          <div className={styles.sideCard}>
            <h3>Document details</h3>
            <p>Original file: {document.originalFilename}</p>
            <p>
              Published:{" "}
              {document.publishedAt
                ? new Date(document.publishedAt).toLocaleDateString("en-GB")
                : "—"}
            </p>
            <p>Topics: {document.topics.join(", ") || "Not assigned"}</p>
          </div>
          {document.prerequisites.length > 0 && (
            <div className={styles.sideCard}>
              <h3>Before you begin</h3>
              {document.prerequisites.map((prerequisite) => (
                <p key={prerequisite}>✓ {prerequisite}</p>
              ))}
            </div>
          )}
        </aside>
      </div>
      <section className={styles.related}>
        <h2>Related notes</h2>
        <div>
          {library.items
            .filter((item) => item.id !== document.id)
            .slice(0, 2)
            .map((item) => (
              <NoteCard key={item.id} document={item} />
            ))}
        </div>
      </section>
    </>
  );
}
