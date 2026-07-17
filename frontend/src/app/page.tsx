import Link from "next/link";

import { NoteCard } from "@/components/ui";
import { publishedDocuments, documents } from "@/mocks/documents";

import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>A quieter way to learn</span>
          <h1>
            Your notes,
            <br />
            <em>made useful.</em>
          </h1>
          <p>
            Turn a growing collection of handwritten notes and educational PDFs into a calm,
            searchable learning library.
          </p>
          <div className={styles.actions}>
            <Link href="/notes" className={styles.primary}>
              Explore the library <span>→</span>
            </Link>
            <Link href="/admin/upload" className={styles.secondary}>
              Add a document
            </Link>
          </div>
        </div>
        <div className={styles.heroCard}>
          <div className={styles.paper}>
            <small>COLLECTION / PYTHON</small>
            <h2>
              Asyncio
              <br />
              Fundamentals
            </h2>
            <p>Event loops · Tasks · Coroutines</p>
            <div className={styles.sketch}>
              await <span>knowledge</span>
            </div>
          </div>
          <div className={styles.float}>
            34 pages
            <br />
            <strong>28 min</strong>
          </div>
        </div>
      </section>
      <section className={styles.stats}>
        <div>
          <strong>{publishedDocuments.length}</strong>
          <span>Published notes</span>
        </div>
        <div>
          <strong>
            {documents.reduce((total, document) => total + (document.pageCount ?? 0), 0)}
          </strong>
          <span>Pages archived</span>
        </div>
        <div>
          <strong>{new Set(documents.flatMap((document) => document.topics)).size}</strong>
          <span>Topics connected</span>
        </div>
      </section>
      <section className={styles.sectionHead}>
        <div>
          <span className={styles.eyebrow}>Recently added</span>
          <h2>Continue exploring</h2>
        </div>
        <Link href="/notes">View all notes →</Link>
      </section>
      <div className={styles.grid}>
        {publishedDocuments.slice(0, 3).map((document) => (
          <NoteCard key={document.id} document={document} />
        ))}
      </div>
    </>
  );
}
