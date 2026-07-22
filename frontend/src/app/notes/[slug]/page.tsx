import { notFound } from "next/navigation";
import Link from "next/link";

import { Reveal } from "@/components/MotionPrimitives";
import { Badge, NoteCard } from "@/components/ui";
import { findDocument, publishedDocuments } from "@/mocks/documents";

import styles from "./detail.module.css";

export function generateStaticParams() {
  return publishedDocuments.map((document) => ({ slug: document.slug! }));
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = findDocument(slug);
  if (!document) notFound();

  const metadata = [
    ["Pages", document.pageCount ?? "—"],
    [
      "Reading time",
      document.estimatedReadingMinutes ? `${document.estimatedReadingMinutes} min` : "—",
    ],
    ["File size", `${(document.sizeBytes / 1_000_000).toFixed(1)} MB`],
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
          <h1>{document.title}</h1>
          <p>{document.description}</p>
          <div className={styles.actions}>
            <button disabled={!document.downloadUrl}>
              Download original <span aria-hidden>↓</span>
            </button>
            <button className={styles.outline}>
              Copy share link <span aria-hidden>↗</span>
            </button>
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
            <div className={styles.previewPage}>
              <span>Learnly document</span>
              <strong>{document.title}</strong>
              <div className={styles.previewLines} />
              <small>Preview service will be available after backend integration.</small>
            </div>
            <span className={styles.previewBadge}>{document.pageCount} pages</span>
          </Reveal>
          <Reveal className={styles.overview}>
            <span>Document overview</span>
            <h2>A focused path through the material.</h2>
            <p>{document.description}</p>
          </Reveal>
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
        </section>
        <aside className={styles.aside}>
          <div className={styles.sideCard}>
            <span className={styles.sideLabel}>Navigation</span>
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
        </aside>
      </div>

      <section className={styles.related}>
        <div className={styles.sectionTitle}>
          <span>Keep exploring</span>
          <h2>Related notes.</h2>
        </div>
        <div>
          {publishedDocuments
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
