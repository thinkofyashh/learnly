import Link from "next/link";

import { DocumentFolio } from "@/components/DocumentFolio";
import { StudyDeskHero } from "@/components/StudyDeskHero";
import { getPublishedDocuments } from "@/services/api-client";

import styles from "./page.module.css";

const learningFlow = [
  ["01", "Stored safely", "The original PDF stays available for preview and download."],
  ["02", "Read page by page", "Learnly extracts the text and records the real page count."],
  ["03", "Made easier to return to", "Reading time and document details stay beside the file."],
  ["04", "Published when ready", "Only material you publish appears in the public library."],
];

export default async function Home() {
  const library = await getPublishedDocuments(1, 100);
  const documents = library.items;
  const totalPages = documents.reduce((total, document) => total + (document.pageCount ?? 0), 0);
  const topicCounts = new Map<string, number>();

  documents.forEach((document) => {
    document.topics.forEach((topic) => topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1));
  });

  const topics = [...topicCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6);

  return (
    <>
      <StudyDeskHero document={documents[0] ?? null} />

      <section className={styles.receipts} aria-labelledby="receipts-title">
        <header>
          <span>Everything you kept</span>
          <h2 id="receipts-title">
            Your brain
            <br />
            has receipts.
          </h2>
          <p>Every saved page is one less useful idea left buried in a downloads folder.</p>
        </header>
        <div className={styles.receiptGrid}>
          <article>
            <span>Published material</span>
            <strong>{library.total.toString().padStart(2, "0")}</strong>
            <small>PDFs ready to revisit</small>
          </article>
          <article>
            <span>Pages on your desk</span>
            <strong>{totalPages.toLocaleString()}</strong>
            <small>Pages organized by Learnly</small>
          </article>
          <article>
            <span>Subjects collected</span>
            <strong>{topicCounts.size.toString().padStart(2, "0")}</strong>
            <small>Topics connected to documents</small>
          </article>
        </div>
      </section>

      <section className={styles.recent} aria-labelledby="recent-title">
        <header className={styles.sectionHeading}>
          <div>
            <span>Recently placed on the desk</span>
            <h2 id="recent-title">Worth another look.</h2>
          </div>
          <Link href="/notes">Explore the full library ↗</Link>
        </header>

        {documents.length > 0 ? (
          <div className={styles.documentGrid}>
            {documents.slice(0, 4).map((document, index) => (
              <DocumentFolio
                key={document.id}
                document={document}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyDesk}>
            <span aria-hidden>⌁</span>
            <h3>Nothing on the desk yet.</h3>
            <p>Give your future self something useful to return to.</p>
            <Link href="/admin/upload">Add your first PDF</Link>
          </div>
        )}
      </section>

      <section className={styles.transformation} aria-labelledby="transformation-title">
        <header>
          <span>What happens to a PDF</span>
          <h2 id="transformation-title">A file becomes a place to continue.</h2>
          <p>
            Learnly keeps the processing visible and understandable without pretending to know more
            than the backend reports.
          </p>
        </header>
        <ol>
          {learningFlow.map(([step, title, body]) => (
            <li key={step}>
              <span>{step}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {topics.length > 0 ? (
        <section className={styles.topics} aria-labelledby="topics-title">
          <header className={styles.sectionHeading}>
            <div>
              <span>Subject shelves</span>
              <h2 id="topics-title">Follow what keeps showing up.</h2>
            </div>
          </header>
          <div>
            {topics.map(([topic, count], index) => (
              <Link
                key={topic}
                href={`/notes?topic=${encodeURIComponent(topic)}`}
                data-tone={index % 4}
              >
                <span>{topic}</span>
                <strong>{count}</strong>
                <small>{count === 1 ? "document" : "documents"}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.closing}>
        <span>The next useful thing</span>
        <h2>
          Put it somewhere
          <br />
          you will find again.
        </h2>
        <Link href="/admin/upload">+ Add something worth remembering</Link>
      </section>
    </>
  );
}
