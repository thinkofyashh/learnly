import Link from "next/link";

import type { LearnlyDocument } from "@/types/document";

import styles from "./ui.module.css";

export const formatBytes = (value: number) => `${(value / 1_000_000).toFixed(1)} MB`;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export function NoteCard({ document }: { document: LearnlyDocument }) {
  return (
    <article className={styles.card}>
      <Link
        href={document.slug ? `/notes/${document.slug}` : "/admin/documents"}
        aria-label={`Open ${document.title ?? document.originalFilename}`}
      >
        <div className={styles.thumb}>
          <span>{document.topics[0]?.slice(0, 2).toUpperCase() ?? "PDF"}</span>
          <small>{document.pageCount ? `${document.pageCount} pages` : "Analyzing"}</small>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.chips}>
            {document.difficulty && <Badge tone={document.difficulty}>{document.difficulty}</Badge>}
            {document.topics.slice(0, 1).map((topic) => (
              <Badge key={topic}>{topic}</Badge>
            ))}
          </div>
          <h3>{document.title ?? document.originalFilename}</h3>
          <p>
            {document.description ?? "Metadata will appear when document processing is complete."}
          </p>
          <footer>
            <span>
              {document.estimatedReadingMinutes
                ? `${document.estimatedReadingMinutes} min read`
                : "Reading time pending"}
            </span>
            <span aria-hidden>↗</span>
          </footer>
        </div>
      </Link>
    </article>
  );
}

export function StatusBadge({ status }: { status: LearnlyDocument["status"] }) {
  return <Badge tone={status}>{status}</Badge>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.empty}>
      <span aria-hidden>⌁</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
