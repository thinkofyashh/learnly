import { notFound } from "next/navigation";
import Link from "next/link";

import { Badge, formatBytes, NoteCard } from "@/components/ui";
import { findDocument, publishedDocuments } from "@/mocks/documents";

import styles from "./detail.module.css";

export function generateStaticParams() {
  // Only published fixtures have public detail routes in the frontend preview.
  return publishedDocuments.map((document) => ({ slug: document.slug! }));
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = findDocument(slug);

  if (!document) notFound();

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
          <p>{document.description}</p>
          <div className={styles.actions}>
            <button disabled={!document.downloadUrl}>Download original</button>
            <button className={styles.outline}>Copy share link</button>
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
            <div>
              <span>PDF preview</span>
              <strong>{document.title}</strong>
              <small>Preview service will be available after backend integration.</small>
            </div>
          </div>
          <article className={styles.overview}>
            <span>Document overview</span>
            <h2>A focused path through the material</h2>
            <p>{document.description}</p>
          </article>
          <h2>Key takeaways</h2>
          <ul className={styles.takeaways}>
            {document.keyTakeaways.map((takeaway, index) => (
              <li key={takeaway}>
                <span>{index + 1}</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </section>
        <aside>
          <div className={styles.sideCard}>
            <h3>Inside this note</h3>
            {document.pageOverview.map((item) => (
              <div className={styles.toc} key={item.section}>
                <span>{item.page}</span>
                <div>
                  <strong>{item.section}</strong>
                  <p>{item.summary}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.sideCard}>
            <h3>Before you begin</h3>
            {document.prerequisites.map((prerequisite) => (
              <p key={prerequisite}>✓ {prerequisite}</p>
            ))}
          </div>
        </aside>
      </div>
      <section className={styles.related}>
        <h2>Related notes</h2>
        <div>
          {publishedDocuments
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
