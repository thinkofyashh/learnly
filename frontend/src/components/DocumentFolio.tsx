import Link from "next/link";

import type { LearnlyDocument } from "@/types/document";

import styles from "./DocumentFolio.module.css";

function documentTitle(document: LearnlyDocument): string {
  return document.title?.trim() || document.originalFilename;
}

export function DocumentFolio({
  document,
  index = 0,
  featured = false,
}: {
  document: LearnlyDocument;
  index?: number;
  featured?: boolean;
}) {
  const title = documentTitle(document);
  const topic = document.topics[0] || "Unsorted";
  const initials = topic === "Unsorted" ? "PDF" : topic.slice(0, 2).toUpperCase();
  const href = document.slug ? `/notes/${document.slug}` : "/notes";

  return (
    <article
      className={`${styles.folio} ${featured ? styles.featured : ""}`}
      data-index={index % 4}
    >
      <Link href={href} aria-label={`Open ${title}`}>
        <div className={styles.cover}>
          <span className={styles.fileType}>PDF</span>
          <span className={styles.initials}>{initials}</span>
          <div className={styles.pageLines} aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className={styles.pageCount}>
            {document.pageCount ? `${document.pageCount} pages` : "Pages pending"}
          </span>
        </div>

        <div className={styles.details}>
          <div className={styles.topline}>
            <span>{topic}</span>
            {document.difficulty ? <span>{document.difficulty}</span> : null}
          </div>
          <h3>{title}</h3>
          <p>
            {document.description?.trim() ||
              "Open the document to read the original material and its saved details."}
          </p>
          <footer>
            <span>
              {document.estimatedReadingMinutes
                ? `${document.estimatedReadingMinutes} min read`
                : "Reading time pending"}
            </span>
            <span aria-hidden>Open ↗</span>
          </footer>
        </div>
      </Link>
    </article>
  );
}
