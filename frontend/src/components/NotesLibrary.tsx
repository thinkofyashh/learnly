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
    <>
      <header className={styles.heading}>
        <div>
          <span>Published library</span>
          <h1>Notes worth returning to.</h1>
          <p>Browse concise, structured study material across development and computer science.</p>
        </div>
        <strong>
          {filtered.length.toString().padStart(2, "0")}
          <small>notes</small>
        </strong>
      </header>
      <div className={styles.filters}>
        <label>
          <span className="sr-only">Search notes</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes…"
          />
        </label>
        <label>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((document) => (
            <NoteCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching notes"
          body="Try a broader search or clear the selected difficulty."
        />
      )}
    </>
  );
}
