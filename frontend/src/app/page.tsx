import Link from "next/link";

import { RocketHero } from "@/components/RocketHero";
import { NoteCard } from "@/components/ui";
import { currentUser } from "@/mocks/current-user";
import { documents, publishedDocuments } from "@/mocks/documents";

import styles from "./page.module.css";

const learningFlow = [
  ["01", "Bring the material", "Add a handwritten scan or educational PDF."],
  ["02", "Find the structure", "Turn long pages into topics, summaries, and a clear route."],
  ["03", "Keep the context", "Return later without rebuilding the idea in your head."],
];

export default function Home() {
  const totalPages = documents.reduce((total, document) => total + (document.pageCount ?? 0), 0);
  const topics = new Set(documents.flatMap((document) => document.topics)).size;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.cosmos} aria-hidden />
        <div className={styles.planet} aria-hidden />
        <RocketHero name={currentUser.name} />

        <div className={styles.heroCopy}>
          <span className={styles.welcome}>
            <i /> Welcome back, {currentUser.name}
          </span>
          <h1>Launch every idea into orbit.</h1>
          <p>
            Learnly turns scattered notes and dense PDFs into one clear, searchable path through
            your knowledge.
          </p>
          <div className={styles.actions}>
            <Link href="/notes" className={styles.primary}>
              Open your library <span>↗</span>
            </Link>
            <Link href="/admin/upload" className={styles.secondary}>
              Add a document
            </Link>
          </div>
        </div>

        <div className={styles.heroSignal}>
          <span>Mission control</span>
          <strong>{publishedDocuments.length} notes are in orbit</strong>
        </div>
        <p className={styles.cursorHint}>
          <span /> Move your cursor. Your rocket will chart the course.
        </p>
      </section>

      <section className={styles.pulse} aria-label="Library statistics">
        <p>Your mission log, at a glance.</p>
        <div>
          <strong>{publishedDocuments.length}</strong>
          <span>Published notes</span>
        </div>
        <div>
          <strong>{totalPages}</strong>
          <span>Pages organized</span>
        </div>
        <div>
          <strong>{topics}</strong>
          <span>Topics connected</span>
        </div>
      </section>

      <section className={styles.story}>
        <header>
          <span>How Learnly works</span>
          <h2>
            Less interface.
            <br />
            More understanding.
          </h2>
          <p>Three quiet steps between a document and something you can actually use.</p>
        </header>
        <div className={styles.flow}>
          {learningFlow.map(([step, title, body]) => (
            <article key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.featured}>
        <header>
          <div>
            <span>Recently added</span>
            <h2>Pick up an idea.</h2>
          </div>
          <Link href="/notes">See the full library ↗</Link>
        </header>
        <div className={styles.grid}>
          {publishedDocuments.slice(0, 3).map((document, index) => (
            <NoteCard key={document.id} document={document} index={index} />
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <span>Ready when you are</span>
        <h2>
          Give the next idea
          <br />
          somewhere to land.
        </h2>
        <Link href="/admin/upload">
          Upload a document <span>↗</span>
        </Link>
      </section>
    </>
  );
}
