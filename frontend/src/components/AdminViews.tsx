"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { documentLifecycle, lifecycleSequence, type LifecycleKey } from "@/lib/document-lifecycle";
import {
  ApiError,
  getAdminDocument,
  getAdminDocuments,
  publishDocument,
  resolveApiUrl,
  retryDocument,
  unpublishDocument,
} from "@/services/api-client";
import type { DocumentListResponse, DocumentStatus, LearnlyDocument } from "@/types/document";

import { StatusBadge } from "./ui";
import styles from "./AdminViews.module.css";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "The studio could not reach Learnly. Check that FastAPI is running, then try again.";
}

function documentTitle(document: LearnlyDocument): string {
  return document.title?.trim() || document.originalFilename;
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function AdminPageHeader({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <span className={styles.pageEyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {children}
    </header>
  );
}

export function AdminDashboard({
  documents,
  total,
}: {
  documents: LearnlyDocument[];
  total: number;
}) {
  const published = documents.filter((document) => document.status === "published").length;
  const inProgress = documents.filter(
    (document) =>
      document.status === "processing" ||
      (document.status === "uploaded" && document.pageCount === null),
  ).length;
  const ready = documents.filter(
    (document) => document.status === "uploaded" && document.pageCount !== null,
  ).length;
  const needsAttention = documents.filter((document) => document.status === "failed").length;
  const stats = [
    { value: total, label: "On your desk", note: "Every saved document", color: "sun" },
    { value: inProgress, label: "Being read", note: "Waiting or processing", color: "sky" },
    { value: ready, label: "Ready for you", note: "Review before publishing", color: "peach" },
    {
      value: published,
      label: "In the library",
      note: needsAttention ? `${needsAttention} needs attention` : "No documents need attention",
      color: "leaf",
    },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Studio overview"
        title="Your learning desk, at a glance."
        body="See what is being read, what needs your review, and what is already on the public shelf."
      >
        <Link className={styles.headerLink} href="/admin/upload">
          Add a PDF <span aria-hidden>↗</span>
        </Link>
      </AdminPageHeader>

      <section className={styles.stats} aria-label="Library summary">
        {stats.map((stat) => (
          <article key={stat.label} data-color={stat.color}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <section className={styles.documentSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span>Latest movement</span>
            <h2>Recently touched.</h2>
          </div>
          <Link href="/admin/documents">Open processing ↗</Link>
        </div>
        <DocumentTable documents={documents.slice(0, 8)} />
      </section>
    </>
  );
}

export function DocumentTable({
  documents,
  emptyState = {
    title: "Nothing is waiting here.",
    body: "Give your future self something useful to return to.",
    href: "/admin/upload",
    action: "Add your first PDF",
  },
}: {
  documents: LearnlyDocument[];
  emptyState?: { title: string; body: string; href: string; action: string };
}) {
  if (documents.length === 0) {
    return (
      <div className={styles.empty}>
        <strong>{emptyState.title}</strong>
        <p>{emptyState.body}</p>
        <Link href={emptyState.href}>{emptyState.action}</Link>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Where it is</th>
            <th>Length</th>
            <th>Last touched</th>
            <th>
              <span className="sr-only">Open record</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <span className={styles.fileIcon}>{document.topics[0]?.slice(0, 1) || "P"}</span>
                <div>
                  <strong>{documentTitle(document)}</strong>
                  <small>{document.originalFilename}</small>
                </div>
              </td>
              <td>
                <StatusBadge document={document} />
              </td>
              <td>{document.pageCount ? `${document.pageCount} pages` : "Not read yet"}</td>
              <td>{formatUpdatedAt(document.updatedAt)}</td>
              <td>
                <Link
                  href={`/admin/documents/${document.id}`}
                  aria-label={`Review ${documentTitle(document)}`}
                >
                  Open ↗
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sequenceState(currentKey: LifecycleKey, itemKey: LifecycleKey) {
  if (currentKey === "attention") {
    if (itemKey === "waiting") return "complete";
    if (itemKey === "reading") return "issue";
    return "next";
  }

  const currentIndex = lifecycleSequence.findIndex((item) => item.key === currentKey);
  const itemIndex = lifecycleSequence.findIndex((item) => item.key === itemKey);
  if (itemIndex < currentIndex) return "complete";
  if (itemIndex === currentIndex) return "current";
  return "next";
}

export function LifecyclePath({ document }: { document: LearnlyDocument }) {
  const lifecycle = documentLifecycle(document);

  return (
    <div className={styles.lifecycle}>
      <div className={styles.currentState} data-state={lifecycle.key}>
        <span>Current state</span>
        <strong>{lifecycle.label}</strong>
        <p>{lifecycle.description}</p>
      </div>
      <ol>
        {lifecycleSequence.map((item) => {
          const state = sequenceState(lifecycle.key, item.key);

          return (
            <li
              key={item.key}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span aria-hidden>{state === "complete" ? "✓" : state === "issue" ? "!" : "·"}</span>
              <div>
                <strong>{item.label}</strong>
                <small>
                  {state === "complete"
                    ? "Done"
                    : state === "current"
                      ? "Now"
                      : state === "issue"
                        ? "Needs attention"
                        : "Next"}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AdminDocumentsView({ initialData }: { initialData: DocumentListResponse }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [error, setError] = useState("");
  const shouldPoll = data.items.some(
    (document) =>
      document.status === "processing" ||
      (document.status === "uploaded" && document.pageCount === null),
  );

  const refresh = useCallback(async () => {
    try {
      const nextData = await getAdminDocuments({
        search: query.trim() || undefined,
        status: status === "all" ? undefined : status,
      });
      setData(nextData);
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }, [query, status]);

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = window.setInterval(refresh, 2500);
    return () => window.clearInterval(timer);
  }, [refresh, shouldPoll]);

  const activeDocument = useMemo(
    () =>
      data.items.find((document) => document.status === "failed") ??
      data.items.find((document) => document.status === "processing") ??
      data.items.find((document) => document.status === "uploaded") ??
      data.items[0],
    [data.items],
  );

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void refresh();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Processing"
        title="Follow every PDF from desk to shelf."
        body="Search your records, see what Learnly is reading, and open anything that needs your decision."
      />

      <form className={styles.toolbar} onSubmit={submitFilters}>
        <label>
          <span>Find a document</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or filename"
          />
        </label>
        <label>
          <span>Show</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | DocumentStatus)}
          >
            <option value="all">Every state</option>
            <option value="uploaded">Waiting or ready</option>
            <option value="processing">Being read</option>
            <option value="published">In the library</option>
            <option value="failed">Needs attention</option>
          </select>
        </label>
        <button type="submit">Update view</button>
      </form>

      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.processingLayout}>
        <section className={styles.documentSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>All matching material</span>
              <h2>{data.total} records</h2>
            </div>
          </div>
          <DocumentTable
            documents={data.items}
            emptyState={{
              title: "Nothing matches this view.",
              body: "Try a broader title search or return to every state.",
              href: "/admin/documents",
              action: "Show every document",
            }}
          />
        </section>

        <aside className={styles.lifecyclePanel}>
          <span className={styles.panelLabel}>Status snapshot</span>
          <h2>{activeDocument ? documentTitle(activeDocument) : "Your desk is clear"}</h2>
          {activeDocument ? (
            <LifecyclePath document={activeDocument} />
          ) : (
            <p className={styles.panelEmpty}>Add a PDF when you are ready to begin.</p>
          )}
        </aside>
      </div>
    </>
  );
}

export function AdminPublishedView({ initialData }: { initialData: DocumentListResponse }) {
  return (
    <>
      <AdminPageHeader
        eyebrow="Published"
        title="Already on the shelf."
        body="These documents are visible in the public library and ready to open, preview, or download."
      >
        <Link className={styles.headerLink} href="/notes">
          See public library <span aria-hidden>↗</span>
        </Link>
      </AdminPageHeader>
      <section className={styles.documentSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span>Public material</span>
            <h2>{initialData.total} published</h2>
          </div>
        </div>
        <DocumentTable
          documents={initialData.items}
          emptyState={{
            title: "Nothing is public yet.",
            body: "Documents will appear here after you review and publish them.",
            href: "/admin/documents",
            action: "Review processing",
          }}
        />
      </section>
    </>
  );
}

export function AdminDocumentReview({ initialDocument }: { initialDocument: LearnlyDocument }) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const shouldPoll =
    document.status === "processing" ||
    (document.status === "uploaded" && document.pageCount === null);

  const refresh = useCallback(async () => {
    const nextDocument = await getAdminDocument(document.id);
    if (nextDocument) setDocument(nextDocument);
  }, [document.id]);

  useEffect(() => {
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      void refresh().catch((requestError: unknown) => setError(errorMessage(requestError)));
    }, 2000);

    return () => window.clearInterval(timer);
  }, [refresh, shouldPoll]);

  async function runAction(
    label: string,
    successMessage: string,
    action: (documentId: number) => Promise<LearnlyDocument>,
  ) {
    setBusyAction(label);
    setError("");
    setNotice("");

    try {
      const nextDocument = await action(document.id);
      setDocument(nextDocument);
      setNotice(successMessage);
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyAction("");
    }
  }

  const previewUrl = resolveApiUrl(document.previewUrl);
  const downloadUrl = resolveApiUrl(document.downloadUrl);
  const isReadyToPublish = document.status === "uploaded" && document.pageCount !== null;

  return (
    <>
      <AdminPageHeader
        eyebrow="Document review"
        title={documentTitle(document)}
        body={
          document.description?.trim() ||
          "No description has been added. Review the stored file and its reading state here."
        }
      >
        <div className={styles.headerActions}>
          <StatusBadge document={document} />
          <div className={styles.actionButtons}>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Preview
              </a>
            ) : null}
            {downloadUrl ? <a href={downloadUrl}>Download</a> : null}
            {document.status === "failed" ? (
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void runAction("retry", "Retry started", retryDocument)}
              >
                {busyAction === "retry" ? "Starting retry…" : "Retry"}
              </button>
            ) : null}
            {isReadyToPublish ? (
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => void runAction("publish", "Published", publishDocument)}
              >
                {busyAction === "publish" ? "Publishing…" : "Publish"}
              </button>
            ) : null}
            {document.status === "published" ? (
              <button
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => {
                  const confirmed = window.confirm(
                    "Remove this document from the public library? The stored PDF and extracted pages will remain in Learnly.",
                  );
                  if (confirmed) void runAction("unpublish", "Unpublished", unpublishDocument);
                }}
              >
                {busyAction === "unpublish" ? "Unpublishing…" : "Unpublish"}
              </button>
            ) : null}
          </div>
        </div>
      </AdminPageHeader>

      <div className={styles.liveMessages} aria-live="polite">
        {notice ? <p className={styles.notice}>{notice}</p> : null}
        {error ? (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className={styles.reviewLayout}>
        <section className={styles.record}>
          <span className={styles.panelLabel}>Stored details</span>
          <h2>The file behind this record.</h2>
          <dl>
            <div>
              <dt>Original filename</dt>
              <dd>{document.originalFilename}</dd>
            </div>
            <div>
              <dt>Pages</dt>
              <dd>{document.pageCount ?? "Not read yet"}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>
                {document.estimatedReadingMinutes
                  ? `${document.estimatedReadingMinutes} minutes`
                  : "Not estimated"}
              </dd>
            </div>
            <div>
              <dt>Public address</dt>
              <dd>{document.slug ?? "Not published"}</dd>
            </div>
          </dl>
        </section>

        <aside className={styles.lifecyclePanel}>
          <LifecyclePath document={document} />
          {document.processingError ? (
            <p className={styles.alert} role="alert">
              {document.processingError}
            </p>
          ) : null}
        </aside>
      </div>
    </>
  );
}
