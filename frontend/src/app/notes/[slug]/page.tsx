import { notFound } from "next/navigation";
import Link from "next/link";

import { DocumentActions } from "@/components/DocumentActions";
import { Reveal } from "@/components/MotionPrimitives";
import { Badge, NoteCard } from "@/components/ui";
import { getPublishedDocument, getPublishedDocuments, resolveApiUrl } from "@/services/api-client";

import styles from "./detail.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [document, library] = await Promise.all([
    getPublishedDocument(slug),
    getPublishedDocuments(1, 3),
  ]);

  if (!document) notFound();

  const previewUrl = resolveApiUrl(document.previewUrl);
  const downloadUrl = resolveApiUrl(document.downloadUrl);
  const metadata = [
    ["Pages", document.pageCount ?? "—"],
    [
      "Reading time",
      document.estimatedReadingMinutes ? `${document.estimatedReadingMinutes} min` : "—",
    ],
    ["File size", formatBytes(document.sizeBytes)],
    ["Views", document.viewCount],
  ];

  return (
    <div className={styles.page}>
      <Link href="/notes" className={styles.back}>
        <span aria-hidden>←</span> Back to library
      </Link>
      <header className={styles.header}>
        <Reveal className={styles.headerCopy}>
          <div className={styles.badges}>
            {document.difficulty && <Badge tone={document.difficulty}>{document.difficulty}</Badge>}
            {document.topics.map((topic) => (
              <Badge key={topic}>{topic}</Badge>
            ))}
          </div>
          <h1>{document.title ?? document.originalFilename}</h1>
          <p>{document.description ?? "A processed PDF from the Learnly library."}</p>
          <div className={styles.actions}>
            <DocumentActions downloadUrl={downloadUrl} />
          </div>
        </Reveal>
        <Reveal className={styles.metaPanel} delay={0.08}>
          <span className={styles.metaLabel}>Document signal</span>
          <dl>
            {metadata.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </header>

      <div className={styles.layout}>
        <section>
          <Reveal className={styles.preview}>
            <div className={styles.previewGlow} />
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={`Preview of ${document.title ?? document.originalFilename}`}
              />
            ) : (
              <div className={styles.previewPage}>
                <span>Learnly document</span>
                <strong>{document.title ?? document.originalFilename}</strong>
                <div className={styles.previewLines} />
                <small>Preview unavailable.</small>
              </div>
            )}
            <span className={styles.previewBadge}>{document.pageCount ?? "—"} pages</span>
          </Reveal>
          <Reveal className={styles.overview}>
            <span>Document overview</span>
            <h2>A focused path through the material.</h2>
            <p>{document.description ?? "Open the PDF preview to explore this document."}</p>
          </Reveal>
          {document.keyTakeaways.length > 0 && (
            <Reveal>
              <div className={styles.sectionTitle}>
                <span>Key takeaways</span>
                <h2>What stays with you.</h2>
              </div>
              <ul className={styles.takeaways}>
                {document.keyTakeaways.map((takeaway, index) => (
                  <li key={takeaway}>
                    <span>{(index + 1).toString().padStart(2, "0")}</span>
                    <p>{takeaway}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </section>
        <aside className={styles.aside}>
          <div className={styles.sideCard}>
            <span className={styles.sideLabel}>Document</span>
            <h3>File details</h3>
            <div className={styles.detailRow}>
              <span>Original file</span>
              <strong>{document.originalFilename}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Published</span>
              <strong>
                {document.publishedAt
                  ? new Date(document.publishedAt).toLocaleDateString("en-GB")
                  : "—"}
              </strong>
            </div>
            <div className={styles.detailRow}>
              <span>Topics</span>
              <strong>{document.topics.join(", ") || "Not assigned"}</strong>
            </div>
          </div>
          {document.prerequisites.length > 0 && (
            <div className={`${styles.sideCard} ${styles.prerequisites}`}>
              <span className={styles.sideLabel}>Prepare</span>
              <h3>Before you begin</h3>
              {document.prerequisites.map((prerequisite) => (
                <p key={prerequisite}>
                  <span>✓</span>
                  {prerequisite}
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className={styles.related}>
        <div className={styles.sectionTitle}>
          <span>Keep exploring</span>
          <h2>Related notes.</h2>
        </div>
        <div>
          {library.items
            .filter((item) => item.id !== document.id)
            .slice(0, 2)
            .map((item, index) => (
              <NoteCard key={item.id} document={item} index={index} />
            ))}
        </div>
      </section>
    </div>
  );
}
