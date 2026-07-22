"use client";

import Link from "next/link";
import { useState } from "react";

import { documents } from "@/mocks/documents";

import { StatusBadge } from "./ui";
import styles from "./AdminViews.module.css";

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

export function AdminDashboard() {
  const processing = documents.filter((document) => document.status === "processing").length;
  const failed = documents.filter((document) => document.status === "failed").length;
  const dashboardStats = [
    [documents.length, "Total documents", "+12% this month"],
    [
      documents.filter((document) => document.status === "published").length,
      "Published",
      "Ready to explore",
    ],
    [processing, "Processing", "Pipeline active"],
    [failed, "Needs attention", failed ? "Review required" : "All clear"],
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Workspace overview"
        title="Good afternoon, Yash."
        body="Your learning library is organized, active, and ready for what comes next."
      >
        <div className={styles.headerSignal}>
          <span>System status</span>
          <strong>
            <i /> All services calm
          </strong>
        </div>
      </AdminPageHeader>
      <div className={styles.stats}>
        {dashboardStats.map(([value, label, note], index) => (
          <div key={label}>
            <span className={styles.statIndex}>{(index + 1).toString().padStart(2, "0")}</span>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span>Latest activity</span>
            <h2>Recent documents</h2>
          </div>
          <Link href="/admin/documents">
            View processing <span aria-hidden>↗</span>
          </Link>
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
                <span className={styles.fileIcon}>{document.topics[0]?.slice(0, 1) ?? "D"}</span>
                <div>
                  <strong>{document.title ?? document.originalFilename}</strong>
                  <small>{document.originalFilename}</small>
                </div>
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
                <Link
                  href={`/admin/documents/${document.id}`}
                  aria-label={`Review ${document.title ?? document.originalFilename}`}
                >
                  ↗
                </Link>
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
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("The upload service is not connected yet. Your file has not been sent.");
      }}
    >
      <div className={styles.drop}>
        <div className={styles.uploadOrb}>
          <span aria-hidden>↑</span>
        </div>
        <small>PDF / up to 50 MB</small>
        <h2>{file ? file.name : "Drop a PDF into the studio"}</h2>
        <p>
          {file
            ? `${(file.size / 1_000_000).toFixed(1)} MB selected and ready`
            : "or choose a document from your device"}
        </p>
        <label className={styles.choose}>
          Choose PDF <span aria-hidden>+</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className={styles.fields}>
        <div className={styles.formIntro}>
          <span>Document details</span>
          <h3>Give it some context.</h3>
          <p>Optional metadata helps the future processing pipeline understand your material.</p>
        </div>
        <label>
          Document title
          <input name="title" placeholder="e.g. Operating Systems Notes" />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} placeholder="What does this note cover?" />
        </label>
        <label className={styles.check}>
          <input type="checkbox" />
          <span>Publish after successful processing</span>
        </label>
        <button type="submit" disabled={!file}>
          Prepare upload <span aria-hidden>↗</span>
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
