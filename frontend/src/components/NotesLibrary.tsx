"use client";

import { useDeferredValue, useMemo, useState } from "react";

import styles from "@/app/notes/notes.module.css";
import type { Difficulty, LearnlyDocument } from "@/types/document";

import { DocumentFolio } from "./DocumentFolio";

type DifficultyFilter = "all" | Difficulty;

export function NotesLibrary({
  documents,
  initialTopic = "all",
}: {
  documents: LearnlyDocument[];
  initialTopic?: string;
}) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [topic, setTopic] = useState(initialTopic);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const topics = useMemo(
    () =>
      [...new Set(documents.flatMap((document) => document.topics))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [documents],
  );
  const filtered = useMemo(
    () =>
      documents.filter((document) => {
        const matchesQuery = [
          document.title,
          document.originalFilename,
          document.description,
          ...document.topics,
          ...document.tags,
        ].some((value) => value?.toLowerCase().includes(deferredQuery));
        const matchesDifficulty = difficulty === "all" || document.difficulty === difficulty;
        const matchesTopic =
          topic === "all" ||
          document.topics.some(
            (documentTopic) => documentTopic.toLowerCase() === topic.toLowerCase(),
          );

        return matchesQuery && matchesDifficulty && matchesTopic;
      }),
    [deferredQuery, difficulty, documents, topic],
  );

  function clearFilters() {
    setQuery("");
    setDifficulty("all");
    setTopic("all");
  }

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span>Your published material</span>
          <h1>
            A library that
            <br />
            feels like yours.
          </h1>
          <p>
            Browse the educational PDFs you chose to publish. Search by what you remember, not by
            where the file was saved.
          </p>
        </div>
        <aside aria-label="Published document count">
          <strong>{documents.length.toString().padStart(2, "0")}</strong>
          <span>PDFs on the shelf</span>
        </aside>
      </header>

      <section className={styles.controls} aria-label="Library filters">
        <label className={styles.search}>
          <span>Search this shelf</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title, filename, or topic"
          />
        </label>

        <label className={styles.topicSelect}>
          <span>Topic</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="all">All topics</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.difficulty} role="group" aria-label="Filter by difficulty">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              aria-pressed={difficulty === level}
            >
              {level === "all" ? "Every level" : level}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.resultLine} aria-live="polite">
        <span>
          {filtered.length} {filtered.length === 1 ? "document" : "documents"} in view
        </span>
        {query || difficulty !== "all" || topic !== "all" ? (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((document, index) => (
            <DocumentFolio
              key={document.id}
              document={document}
              index={index}
              featured={index === 0 && filtered.length > 2}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span aria-hidden>⌁</span>
          <h2>Nothing matches that shelf.</h2>
          <p>Try a broader phrase, another level, or clear the selected topic.</p>
          <button type="button" onClick={clearFilters}>
            Show the whole library
          </button>
        </div>
      )}
    </div>
  );
}
