"use client";

import { useState } from "react";
import Link from "next/link";

import { documents } from "@/mocks/documents";

import { StatusBadge } from "./ui";
import styles from "./AdminViews.module.css";

export function AdminDashboard() {
  const processing = documents.filter((document) => document.status === "processing").length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const dashboardStats = [
    [documents.length, "Total documents"],
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
        <DocumentTable />
      </section>
    </>
  );
}

export function DocumentTable() {
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
                {new Date(document.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
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
  "PDF uploaded",
  "Text extracted",
  "Pages analyzed",
  "Summary generated",
  "Topics and tags detected",
  "Published to library",
];

export function Pipeline({ failed = false }: { failed?: boolean }) {
  // Mock the two pipeline paths shown by the frontend until live job progress is available.
  const activeStageIndex = failed ? 1 : 3;

  return (
    <ol className={styles.pipeline}>
      {pipelineStages.map((stage, index) => {
        const state =
          failed && index === activeStageIndex
            ? "failed"
            : index < activeStageIndex
              ? "completed"
              : index === activeStageIndex
                ? "processing"
                : "pending";

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

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  return (
    <form
      className={styles.uploadForm}
      onSubmit={(e) => {
        e.preventDefault();
        // Keep the preview honest: selecting a file never sends data without a backend.
        setMessage("The upload service is not connected yet. Your file has not been sent.");
      }}
    >
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
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className={styles.fields}>
        <label>
          Document title
          <input name="title" placeholder="Optional title" />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} placeholder="What does this note cover?" />
        </label>
        <label className={styles.check}>
          <input type="checkbox" /> Publish after successful processing
        </label>
        <button type="submit" disabled={!file}>
          Prepare upload
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
