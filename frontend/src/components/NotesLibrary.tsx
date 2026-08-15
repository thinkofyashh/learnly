"use client";

import { useMemo, useState } from "react";

import styles from "@/app/notes/notes.module.css";
import type { LearnlyDocument } from "@/types/document";

import { EmptyState, NoteCard } from "./ui";

export function NotesLibrary({ documents }: { documents: LearnlyDocument[] }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      documents.filter((document) => {
        const matchesQuery = [
          document.title,
          document.originalFilename,
          document.description,
          ...document.topics,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery));
        const matchesDifficulty = difficulty === "all" || document.difficulty === difficulty;

        return matchesQuery && matchesDifficulty;
      }),
    [difficulty, documents, normalizedQuery],
  );

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div className={styles.headingCopy}>
          <span>Published library</span>
          <h1>
            Notes for the
            <br />
            <em>curious mind.</em>
          </h1>
          <p>
            Structured study material across development and computer science, ready whenever you
            want to go deeper.
          </p>
        </div>
        <div className={styles.count}>
          <strong>{filtered.length.toString().padStart(2, "0")}</strong>
          <span>notes in view</span>
          <div className={styles.countLine}>
            <span />
          </div>
        </div>
      </header>
      <div className={styles.filters}>
        <label className={styles.search}>
          <span className="sr-only">Search notes</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your library…"
          />
        </label>
        <div className={styles.difficulty} role="group" aria-label="Filter by difficulty">
          {["all", "beginner", "intermediate", "advanced"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={difficulty === level ? styles.selected : ""}
            >
              {level === "all" ? "All levels" : level}
              {difficulty === level && <span />}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((document, index) => (
            <NoteCard key={document.id} document={document} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching notes"
          body="Try a broader search or clear the selected difficulty."
        />
      )}
    </div>
  );
}
