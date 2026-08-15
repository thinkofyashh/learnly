import Link from "next/link";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";

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

const pageTicks = Array.from({ length: 12 }, (_, index) => index);
const folioTicks = Array.from({ length: 18 }, (_, index) => index);

export default function Home() {
  return (
    <div
      className={`${styles.proofScope} ${displayFont.variable} ${bodyFont.variable} ${utilityFont.variable}`}
    >
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroLayout}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden />
              Your personal study shelf
            </p>
            <h1 id="hero-title">
              A PDF goes in.
              <span>A study path comes out.</span>
            </h1>
            <p className={styles.intro}>
              Learnly reads every page, records the useful details, and keeps the document ready for
              your next study session.
            </p>
            <div className={styles.actions}>
              <Link href="/notes" className={styles.primaryAction}>
                Browse my shelf
                <span aria-hidden>↗</span>
              </Link>
              <Link href="/admin/upload" className={styles.secondaryAction}>
                Add a PDF
              </Link>
            </div>
            <p className={styles.heroNote}>PDF · indexed page by page · ready when you return</p>
          </div>

          <figure className={styles.transformation} aria-labelledby="transformation-caption">
            <figcaption id="transformation-caption" className={styles.srOnly}>
              A raw PDF becomes indexed pages and then an organized study document.
            </figcaption>

            <div className={`${styles.stage} ${styles.rawStage}`}>
              <div className={styles.stageLabel}>
                <span>01</span>
                Raw PDF
              </div>
              <div className={styles.pdfStack} aria-hidden>
                <div className={styles.backPage} />
                <div className={styles.middlePage} />
                <div className={styles.pdfPage}>
                  <span>PDF</span>
                  <strong>asyncio-fundamentals.pdf</strong>
                  <small>Dense pages, one file</small>
                </div>
              </div>
            </div>

            <div className={styles.readingTrack} aria-hidden>
              <span />
              <small>pages become searchable</small>
              <span />
            </div>

            <div className={`${styles.stage} ${styles.readingStage}`}>
              <div className={styles.stageLabel}>
                <span>02</span>
                Reading pages
              </div>
              <div className={styles.heroSpine}>
                {pageTicks.map((tick) => (
                  <i
                    key={tick}
                    className={tick === 8 ? styles.highlightedTick : styles.indexedTick}
                  />
                ))}
              </div>
              <div className={styles.extractedCopy}>
                <span>PAGE 08</span>
                <p>Tasks let coroutines run concurrently while you await their results…</p>
              </div>
            </div>

            <div className={styles.readingTrack} aria-hidden>
              <span />
              <small>details find their place</small>
              <span />
            </div>

            <div className={`${styles.stage} ${styles.readyStage}`}>
              <div className={styles.stageLabel}>
                <span>03</span>
                Study-ready
              </div>
              <div className={styles.readyFolio}>
                <div>
                  <span>Python · Concurrency</span>
                  <strong>Asyncio Fundamentals</strong>
                </div>
                <p>18 pages</p>
                <p>12 min read</p>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className={styles.folioShowcase} aria-labelledby="folio-title">
        <header className={styles.folioIntro}>
          <p>One document, properly placed</p>
          <h2 id="folio-title">Return to the idea, not the file hunt.</h2>
          <span>
            A folio keeps the subject, level, length, and useful context visible before you open a
            single page.
          </span>
        </header>

        <article className={styles.folioCard} aria-labelledby="asyncio-title">
          <div className={styles.folioSpine} aria-hidden>
            {folioTicks.map((tick) => (
              <i key={tick} className={tick === 11 ? styles.folioHighlight : styles.folioIndexed} />
            ))}
          </div>

          <div className={styles.folioContent}>
            <div className={styles.folioTopline}>
              <span className={styles.folioNumber}>STUDY FOLIO 01</span>
              <span className={styles.readyLabel}>
                <i aria-hidden />
                Ready to study
              </span>
            </div>

            <div className={styles.badges} aria-label="Document classification">
              <span className={styles.topicBadge}>Python</span>
              <span className={styles.topicBadge}>Concurrency</span>
              <span className={styles.difficultyBadge}>Intermediate</span>
            </div>

            <h3 id="asyncio-title">Asyncio Fundamentals</h3>
            <p className={styles.folioDescription}>
              A practical guide to event loops, coroutines, tasks, and writing concurrent Python
              without losing track of the work in flight.
            </p>

            <dl className={styles.folioMetadata}>
              <div>
                <dt>Length</dt>
                <dd>18 pages</dd>
              </div>
              <div>
                <dt>Reading time</dt>
                <dd>12 min</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>Searchable PDF</dd>
              </div>
            </dl>
          </div>
        </article>
      </section>
    </div>
  );
}
