"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiError,
  getAdminDocument,
  getAdminDocuments,
  publishDocument,
  resolveApiUrl,
  retryDocument,
  unpublishDocument,
  uploadDocument,
} from "@/services/api-client";
import type {
  DocumentListResponse,
  DocumentStatus,
  LearnlyDocument,
  PipelineState,
} from "@/types/document";

import { StatusBadge } from "./ui";
import styles from "./AdminViews.module.css";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function AdminDashboard({
  documents,
  total,
}: {
  documents: LearnlyDocument[];
  total: number;
}) {
  const processing = documents.filter((document) => document.status === "processing").length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const dashboardStats = [
    [total, "Total documents"],
    [documents.filter((document) => document.status === "published").length, "Published"],
    [processing, "Processing"],
    [failed, "Needs attention"],
  ];

  return (
    <>
      <header className={styles.heading}>
        <span>Workspace overview</span>
        <h1>Good afternoon, Yash.</h1>
        <p>Review your learning library and keep document processing moving.</p>
      </header>
      <div className={styles.stats}>
        {dashboardStats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span>Latest activity</span>
            <h2>Recent documents</h2>
          </div>
          <Link href="/admin/documents">View processing →</Link>
        </div>
        <DocumentTable documents={documents.slice(0, 8)} />
      </section>
    </>
  );
}

export function DocumentTable({ documents }: { documents: LearnlyDocument[] }) {
  if (documents.length === 0) {
    return <p className={styles.empty}>No documents have been uploaded yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Status</th>
            <th>Pages</th>
            <th>Updated</th>
            <th>
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <strong>{document.title ?? document.originalFilename}</strong>
                <small>{document.originalFilename}</small>
              </td>
              <td>
                <StatusBadge status={document.status} />
              </td>
              <td>{document.pageCount ?? "—"}</td>
              <td>
                {new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                }).format(new Date(document.updatedAt))}
              </td>
              <td>
                <Link href={`/admin/documents/${document.id}`}>Review →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const pipelineStages = [
  "PDF stored",
  "Text extracted",
  "Page records saved",
  "Ready for review",
  "Published to library",
];

function pipelineStates(document: LearnlyDocument): PipelineState[] {
  if (document.status === "failed") {
    return ["completed", "failed", "pending", "pending", "pending"];
  }

  if (document.status === "processing") {
    return ["completed", "processing", "pending", "pending", "pending"];
  }

  if (document.status === "published") {
    return ["completed", "completed", "completed", "completed", "completed"];
  }

  if (document.pageCount !== null) {
    return ["completed", "completed", "completed", "completed", "pending"];
  }

  return ["completed", "pending", "pending", "pending", "pending"];
}

export function Pipeline({ document }: { document: LearnlyDocument }) {
  const states = pipelineStates(document);

  return (
    <ol className={styles.pipeline}>
      {pipelineStages.map((stage, index) => {
        const state = states[index];

        return (
          <li key={stage} className={styles[state]}>
            <span aria-hidden>
              {state === "completed" ? "✓" : state === "failed" ? "!" : index + 1}
            </span>
            <div>
              <strong>{stage}</strong>
              <small>{state}</small>
            </div>
          </li>
        );
      })}
    </ol>
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
      data.items.find((document) => document.status === "processing") ??
      data.items.find((document) => document.status === "failed") ??
      data.items[0],
    [data.items],
  );

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void refresh();
  }

  return (
    <>
      <header className={styles.heading}>
        <span>Document operations</span>
        <h1>Processing center.</h1>
        <p>Track uploads, extraction, failures, and publication from the live API.</p>
      </header>
      <form className={styles.toolbar} onSubmit={submitFilters}>
        <label>
          <span className="sr-only">Search documents</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search filename or title…"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | DocumentStatus)}
          >
            <option value="all">All statuses</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
      </form>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.processingGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>All documents</span>
              <h2>{data.total} records</h2>
            </div>
          </div>
          <DocumentTable documents={data.items} />
        </section>
        <aside className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <span>Pipeline snapshot</span>
              <h2>
                {activeDocument?.title ?? activeDocument?.originalFilename ?? "No active document"}
              </h2>
            </div>
          </div>
          {activeDocument ? (
            <Pipeline document={activeDocument} />
          ) : (
            <p className={styles.empty}>Upload a PDF to begin processing.</p>
          )}
        </aside>
      </div>
    </>
  );
}

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [publishAfterProcessing, setPublishAfterProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setMessage("Uploading your PDF…");

    try {
      const document = await uploadDocument(file, publishAfterProcessing);
      setMessage("Upload complete. Opening the processing record…");
      router.push(`/admin/documents/${document.id}`);
    } catch (error) {
      setMessage(errorMessage(error));
      setIsUploading(false);
    }
  }

  return (
    <form className={styles.uploadForm} onSubmit={submitUpload}>
      <div className={styles.drop}>
        <span aria-hidden>↑</span>
        <h2>{file ? file.name : "Drop a PDF here"}</h2>
        <p>
          {file
            ? `${(file.size / 1_000_000).toFixed(1)} MB selected`
            : "or choose a file from your device"}
        </p>
        <label className={styles.choose}>
          Choose PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setMessage("");
            }}
          />
        </label>
      </div>
      <div className={styles.fields}>
        <h2>Processing options</h2>
        <p className={styles.helper}>
          Learnly will store the PDF, extract page text, calculate its page count and reading time,
          then keep it ready for review.
        </p>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={publishAfterProcessing}
            onChange={(event) => setPublishAfterProcessing(event.target.checked)}
          />
          Publish after successful processing
        </label>
        <button type="submit" disabled={!file || isUploading}>
          {isUploading ? "Uploading…" : "Upload and process"}
        </button>
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

export function AdminDocumentReview({ initialDocument }: { initialDocument: LearnlyDocument }) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [error, setError] = useState("");
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
    action: (documentId: number) => Promise<LearnlyDocument>,
  ) {
    setBusyAction(label);
    setError("");

    try {
      const nextDocument = await action(document.id);
      setDocument(nextDocument);
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
      <header className={styles.reviewHeader}>
        <StatusBadge status={document.status} />
        <h1>{document.title ?? document.originalFilename}</h1>
        <p>
          {document.description ?? "Review the extracted document and control its publication."}
        </p>
        <div className={styles.actionButtons}>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer">
              Preview PDF
            </a>
          )}
          {downloadUrl && <a href={downloadUrl}>Download</a>}
          {document.status === "failed" && (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => void runAction("retry", retryDocument)}
            >
              {busyAction === "retry" ? "Retrying…" : "Retry processing"}
            </button>
          )}
          {isReadyToPublish && (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => void runAction("publish", publishDocument)}
            >
              {busyAction === "publish" ? "Publishing…" : "Publish"}
            </button>
          )}
          {document.status === "published" && (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => void runAction("unpublish", unpublishDocument)}
            >
              {busyAction === "unpublish" ? "Unpublishing…" : "Unpublish"}
            </button>
          )}
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </header>
      <div className={styles.reviewGrid}>
        <section className={styles.panel}>
          <h2>Document record</h2>
          <dl className={styles.documentFacts}>
            <div>
              <dt>Original file</dt>
              <dd>{document.originalFilename}</dd>
            </div>
            <div>
              <dt>Pages</dt>
              <dd>{document.pageCount ?? "Pending"}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>
                {document.estimatedReadingMinutes
                  ? `${document.estimatedReadingMinutes} minutes`
                  : "Pending"}
              </dd>
            </div>
            <div>
              <dt>Public slug</dt>
              <dd>{document.slug ?? "Not published"}</dd>
            </div>
          </dl>
        </section>
        <aside className={styles.panel}>
          <h2>Pipeline</h2>
          <Pipeline document={document} />
          {document.processingError && (
            <p className={styles.error} role="alert">
              {document.processingError}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
