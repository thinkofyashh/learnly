"use client";

import Link from "next/link";
import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { readRecentDocumentIds, rememberDocument } from "@/lib/recent-documents";
import { collectTopics } from "@/lib/topics";
import { getAllPublishedDocuments } from "@/services/api-client";
import type { LearnlyDocument } from "@/types/document";

import styles from "./SearchOverlay.module.css";

const RECENT_SEARCHES_KEY = "learnly-searches-v1";

function readStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const normalized = query.trim();
  if (!normalized) return;

  const recent = readStoredArray<string>(RECENT_SEARCHES_KEY).filter(
    (item) => item.toLowerCase() !== normalized.toLowerCase(),
  );
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([normalized, ...recent].slice(0, 5)));
}

export function SearchOverlay({
  onClose,
  returnFocusRef,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<LearnlyDocument[]>([]);
  const [recentSearches] = useState(() => readStoredArray<string>(RECENT_SEARCHES_KEY));
  const [recentDocumentIds] = useState(readRecentDocumentIds);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocusElement = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      returnFocusElement?.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    let cancelled = false;

    void getAllPublishedDocuments()
      .then((items) => {
        if (cancelled) return;
        setDocuments(items);
        setHasLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Search could not reach the library. Check that FastAPI is running.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    return documents
      .filter((document) =>
        [
          document.title,
          document.originalFilename,
          document.description,
          ...document.topics,
          ...document.tags,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 8);
  }, [documents, normalizedQuery]);
  const topics = useMemo(() => collectTopics(documents).slice(0, 6), [documents]);
  const recentDocuments = useMemo(
    () =>
      recentDocumentIds
        .map((id) => documents.find((document) => document.id === id))
        .filter((document): document is LearnlyDocument => Boolean(document))
        .slice(0, 4),
    [documents, recentDocumentIds],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectDocument(document: LearnlyDocument) {
    rememberDocument(document.id);
    saveRecentSearch(query);
    onClose();
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        onKeyDown={handleKeyDown}
      >
        <header>
          <span>Search your learning desk</span>
          <button type="button" onClick={onClose} aria-label="Close search">
            Close <kbd>Esc</kbd>
          </button>
        </header>

        <label className={styles.searchField}>
          <span className="sr-only" id="search-title">
            Search the Learnly library
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What are you looking for?"
            autoComplete="off"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")}>
              Clear
            </button>
          ) : null}
        </label>

        <div className={styles.content} aria-live="polite">
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : normalizedQuery ? (
            <section className={styles.results} aria-label="Search results">
              <div className={styles.sectionLabel}>
                <span>Matching material</span>
                <strong>{results.length}</strong>
              </div>
              {results.length > 0 ? (
                <div>
                  {results.map((document) => (
                    <Link
                      key={document.id}
                      href={document.slug ? `/notes/${document.slug}` : "/notes"}
                      onClick={() => selectDocument(document)}
                    >
                      <span>{document.topics[0] || "PDF"}</span>
                      <strong>{document.title?.trim() || document.originalFilename}</strong>
                      <small>
                        {document.pageCount ? `${document.pageCount} pages` : "Pages pending"}
                      </small>
                    </Link>
                  ))}
                </div>
              ) : hasLoaded ? (
                <div className={styles.noResults}>
                  <strong>Nothing matches that yet.</strong>
                  <span>Try a title, filename, or broader topic.</span>
                </div>
              ) : (
                <p className={styles.loading}>Opening the library…</p>
              )}
            </section>
          ) : (
            <div className={styles.suggestions}>
              <section>
                <div className={styles.sectionLabel}>
                  <span>Recent searches</span>
                </div>
                {recentSearches.length > 0 ? (
                  <div className={styles.chips}>
                    {recentSearches.map((item) => (
                      <button key={item} type="button" onClick={() => setQuery(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>Searches you make will wait here for your next visit.</p>
                )}
              </section>

              <section>
                <div className={styles.sectionLabel}>
                  <span>Topics on your desk</span>
                </div>
                {topics.length > 0 ? (
                  <div className={styles.topicList}>
                    {topics.map((topic) => (
                      <Link key={topic.slug} href={`/topics/${topic.slug}`} onClick={onClose}>
                        <span>{topic.name}</span>
                        <small>{topic.count}</small>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p>Topics appear after they are attached to published documents.</p>
                )}
              </section>

              {recentDocuments.length > 0 ? (
                <section className={styles.recentDocuments}>
                  <div className={styles.sectionLabel}>
                    <span>Recently opened</span>
                  </div>
                  {recentDocuments.map((document) => (
                    <Link
                      key={document.id}
                      href={document.slug ? `/notes/${document.slug}` : "/notes"}
                      onClick={() => selectDocument(document)}
                    >
                      {document.title?.trim() || document.originalFilename}
                    </Link>
                  ))}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
