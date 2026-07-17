"use client";

import { useMemo, useState } from "react";

import { EmptyState, NoteCard } from "@/components/ui";
import { publishedDocuments } from "@/mocks/documents";

import styles from "./notes.module.css";

export default function Notes() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const filtered = useMemo(
    () =>
      publishedDocuments.filter(
        (document) =>
          (document.title ?? "").toLowerCase().includes(query.toLowerCase()) &&
          (difficulty === "all" || document.difficulty === difficulty),
      ),
    [query, difficulty],
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
          />
        </label>
        <label>
          <span>Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
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
