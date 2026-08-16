import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentFolio } from "@/components/DocumentFolio";
import { collectTopics, toTopicSlug } from "@/lib/topics";
import { getAllPublishedDocuments } from "@/services/api-client";

import styles from "../topics.module.css";

export default async function TopicCollection({ params }: { params: Promise<{ topic: string }> }) {
  const [{ topic: requestedTopic }, documents] = await Promise.all([
    params,
    getAllPublishedDocuments(),
  ]);
  const topics = collectTopics(documents);
  const activeTopic = topics.find((topic) => topic.slug === requestedTopic);

  if (!activeTopic) notFound();

  const matchingDocuments = documents.filter((document) =>
    document.topics.some((topic) => toTopicSlug(topic) === activeTopic.slug),
  );
  const relatedTopics = topics.filter((topic) => topic.slug !== activeTopic.slug).slice(0, 5);

  return (
    <div className={styles.page}>
      <Link href="/topics" className={styles.back}>
        ← All topics
      </Link>
      <header className={`${styles.hero} ${styles.collectionHero}`}>
        <span>Topic collection / {matchingDocuments.length} PDFs</span>
        <h1>{activeTopic.name}</h1>
        <p>Every published document currently filed under this subject.</p>
      </header>

      <div className={styles.documentGrid}>
        {matchingDocuments.map((document, index) => (
          <DocumentFolio
            key={document.id}
            document={document}
            index={index}
            featured={index === 0 && matchingDocuments.length > 2}
          />
        ))}
      </div>

      {relatedTopics.length > 0 ? (
        <section className={styles.related}>
          <span>Keep following the thread</span>
          <div>
            {relatedTopics.map((topic) => (
              <Link key={topic.slug} href={`/topics/${topic.slug}`}>
                {topic.name} <small>{topic.count}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
