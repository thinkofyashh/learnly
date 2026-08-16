import Link from "next/link";

import { collectTopics } from "@/lib/topics";
import { getAllPublishedDocuments } from "@/services/api-client";

import styles from "./topics.module.css";

export default async function Topics() {
  const documents = await getAllPublishedDocuments();
  const topics = collectTopics(documents);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span>Collections formed by your PDFs</span>
        <h1>
          Subjects worth
          <br />
          following.
        </h1>
        <p>Topics gather related material without moving or duplicating the original documents.</p>
      </header>

      {topics.length > 0 ? (
        <div className={styles.topicGrid}>
          {topics.map((topic, index) => (
            <Link key={topic.slug} href={`/topics/${topic.slug}`} data-tone={index % 4}>
              <span>{topic.name}</span>
              <strong>{topic.count.toString().padStart(2, "0")}</strong>
              <small>{topic.count === 1 ? "document" : "documents"}</small>
              <i aria-hidden>↗</i>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span aria-hidden>⌁</span>
          <h2>No topic shelves yet.</h2>
          <p>Topics appear here when published documents have subject metadata.</p>
          <Link href="/notes">Browse the library</Link>
        </div>
      )}
    </div>
  );
}
