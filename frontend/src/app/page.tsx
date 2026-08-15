import Link from "next/link";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";

import { RocketHero } from "@/components/RocketHero";
import { NoteCard } from "@/components/ui";
import { getPublishedDocuments } from "@/services/api-client";
import { siteOwner } from "@/site";

import styles from "./page.module.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-learnly-display",
  weight: "variable",
});

const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-learnly-body",
  weight: ["400", "700"],
});

const utilityFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-learnly-utility",
  weight: "500",
});

const learningFlow = [
  ["01", "Bring the material", "Add a handwritten scan or educational PDF."],
  ["02", "Find the structure", "Extract the text and organize every page for review."],
  ["03", "Keep the context", "Publish the material so it is ready when you return."],
];

export default async function Home() {
  const library = await getPublishedDocuments();
  const documents = library.items;
  const totalPages = documents.reduce((total, document) => total + (document.pageCount ?? 0), 0);
  const topics = new Set(documents.flatMap((document) => document.topics)).size;

  return (
    <div
      className={`${styles.proofScope} ${displayFont.variable} ${bodyFont.variable} ${utilityFont.variable}`}
    >
      <section className={styles.hero}>
        <div className={styles.cosmos} aria-hidden />
        <div className={styles.planet} aria-hidden />
        <RocketHero name={siteOwner.name} />

        <div className={styles.heroCopy}>
          <span className={styles.welcome}>
            <i /> Welcome back, {siteOwner.name}
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
          <strong>
            {library.total} {library.total === 1 ? "note is" : "notes are"} in orbit
          </strong>
        </div>
        <p className={styles.cursorHint}>
          <span /> Move your cursor. Your rocket will chart the course.
        </p>
      </section>

      <section className={styles.pulse} aria-label="Library statistics">
        <p>Your mission log, at a glance.</p>
        <div>
          <strong>{library.total}</strong>
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
          {documents.slice(0, 3).map((document, index) => (
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
    </div>
  );
}
