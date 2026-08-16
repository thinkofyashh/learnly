import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentActions } from "@/components/DocumentActions";
import { DocumentFolio } from "@/components/DocumentFolio";
import { RecentDocumentTracker } from "@/components/RecentDocumentTracker";
import { toTopicSlug } from "@/lib/topics";
import {
  getAllPublishedDocuments,
  getPublishedDocument,
  resolveApiUrl,
} from "@/services/api-client";
import type { LearnlyDocument } from "@/types/document";

import styles from "./detail.module.css";

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function documentTitle(document: LearnlyDocument): string {
  return document.title?.trim() || document.originalFilename;
}

function relatedDocuments(document: LearnlyDocument, library: LearnlyDocument[]) {
  const topics = new Set(document.topics.map((topic) => topic.toLowerCase()));

  return library
    .filter((item) => item.id !== document.id)
    .sort((left, right) => {
      const leftMatches = left.topics.filter((topic) => topics.has(topic.toLowerCase())).length;
      const rightMatches = right.topics.filter((topic) => topics.has(topic.toLowerCase())).length;
      return rightMatches - leftMatches;
    })
    .slice(0, 3);
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [document, library] = await Promise.all([
    getPublishedDocument(slug),
    getAllPublishedDocuments(),
  ]);

  if (!document) notFound();

  const title = documentTitle(document);
  const previewUrl = resolveApiUrl(document.previewUrl);
  const downloadUrl = resolveApiUrl(document.downloadUrl);
  const related = relatedDocuments(document, library);
  const metadata = [
    ["Length", document.pageCount ? `${document.pageCount} pages` : "Page count pending"],
    [
      "Reading time",
      document.estimatedReadingMinutes
        ? `${document.estimatedReadingMinutes} minutes`
        : "Not estimated",
    ],
    ["File", formatBytes(document.sizeBytes)],
    ["Opened", `${document.viewCount} ${document.viewCount === 1 ? "time" : "times"}`],
  ];

  return (
    <main className={styles.page}>
      <RecentDocumentTracker documentId={document.id} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/notes">Library</Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <header className={styles.bookHeader}>
        <div className={styles.cover} aria-hidden>
          <span className={styles.fileType}>PDF · Learnly</span>
          <strong>{document.topics[0]?.slice(0, 2).toUpperCase() || "PDF"}</strong>
          <div className={styles.coverLines}>
            <i />
            <i />
            <i />
          </div>
          <small>{document.pageCount ? `${document.pageCount} pages` : "Pages pending"}</small>
        </div>

        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Open from your library</p>
          <h1>{title}</h1>
          <p className={styles.description}>
            {document.description?.trim() ||
              "This document has no description yet. Open the original pages to start reading."}
          </p>

          {document.topics.length > 0 ? (
            <div className={styles.topics} aria-label="Document topics">
              {document.topics.map((topic) => (
                <Link key={topic} href={`/topics/${toTopicSlug(topic)}`}>
                  {topic}
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.unassigned}>No topics assigned</p>
          )}

          <div className={styles.actions}>
            <DocumentActions downloadUrl={downloadUrl} />
          </div>
        </div>
      </header>

      <dl className={styles.metadata}>
        {metadata.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className={styles.reader} aria-labelledby="reader-title">
        <div className={styles.readerHeading}>
          <div>
            <p className={styles.eyebrow}>Original pages</p>
            <h2 id="reader-title">Read it as it was made.</h2>
          </div>
          <p>
            The preview stays connected to the stored PDF. Download the original whenever you want
            to keep a local copy.
          </p>
        </div>

        <div className={styles.previewDesk}>
          {previewUrl ? (
            <iframe src={previewUrl} title={`Preview of ${title}`} />
          ) : (
            <div className={styles.previewUnavailable}>
              <span>Preview unavailable</span>
              <strong>The original pages could not be opened here.</strong>
              <p>Use the download action above if the stored file is available.</p>
            </div>
          )}
        </div>
      </section>

      {(document.keyTakeaways.length > 0 || document.prerequisites.length > 0) && (
        <section className={styles.notes} aria-label="Study notes">
          {document.keyTakeaways.length > 0 && (
            <div className={styles.takeaways}>
              <p className={styles.eyebrow}>Key takeaways</p>
              <h2>What stays with you.</h2>
              <ol>
                {document.keyTakeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ol>
            </div>
          )}

          {document.prerequisites.length > 0 && (
            <aside className={styles.prerequisites}>
              <p className={styles.eyebrow}>Before you begin</p>
              <ul>
                {document.prerequisites.map((prerequisite) => (
                  <li key={prerequisite}>{prerequisite}</li>
                ))}
              </ul>
            </aside>
          )}
        </section>
      )}

      <section className={styles.fileDetails} aria-labelledby="file-details-title">
        <div>
          <p className={styles.eyebrow}>On the shelf</p>
          <h2 id="file-details-title">The file behind this folio.</h2>
        </div>
        <dl>
          <div>
            <dt>Original filename</dt>
            <dd>{document.originalFilename}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{document.difficulty || "Not assigned"}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>
              {document.publishedAt
                ? new Date(document.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Publication date unavailable"}
            </dd>
          </div>
        </dl>
      </section>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-title">
          <div className={styles.relatedHeading}>
            <p className={styles.eyebrow}>Nearby on the desk</p>
            <h2 id="related-title">Keep following the thread.</h2>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item, index) => (
              <DocumentFolio key={item.id} document={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
