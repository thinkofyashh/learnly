"use client";

import { useRouter } from "next/navigation";
import type { DragEvent, FormEvent } from "react";
import { useState } from "react";

import { PaperBloom } from "@/components/PaperBloom";
import { ApiError, uploadDocument } from "@/services/api-client";

import styles from "./UploadExperience.module.css";

function uploadError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "The PDF could not be added. Check that FastAPI is running, then try again.";
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function UploadExperience() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [publishAfterProcessing, setPublishAfterProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "status" | "error"; message: string } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function chooseFile(nextFile: File | null) {
    if (nextFile && !isPdf(nextFile)) {
      setFile(null);
      setFeedback({ kind: "error", message: "Choose a PDF file to add to Learnly." });
      return;
    }

    setFile(nextFile);
    setFeedback(null);
  }

  function dropFile(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0] ?? null);
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setFeedback({ kind: "status", message: "Adding your PDF…" });

    try {
      const document = await uploadDocument(file, publishAfterProcessing);
      setFeedback({ kind: "status", message: "Added. Opening its reading record…" });
      router.push(`/admin/documents/${document.id}`);
    } catch (error) {
      setFeedback({ kind: "error", message: uploadError(error) });
      setIsUploading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submitUpload}>
      <label
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={dropFile}
      >
        <PaperBloom />
        <span className={styles.limit}>PDF · up to 25 MB</span>
        <strong>{file ? file.name : "Drop in something worth remembering."}</strong>
        <p>
          {file
            ? `${(file.size / 1_000_000).toFixed(1)} MB selected and ready`
            : "Drag a PDF here, or choose one from your device."}
        </p>
        <span className={styles.choose}>{file ? "Choose a different PDF" : "Choose PDF"}</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className={styles.options}>
        <div>
          <span className={styles.optionLabel}>What happens next</span>
          <h2>Learnly reads the pages. You decide when they belong on the shelf.</h2>
          <p>
            The original PDF is stored, its text is extracted page by page, and its length and
            reading time are recorded for review.
          </p>
        </div>

        <label className={styles.publishOption}>
          <input
            type="checkbox"
            checked={publishAfterProcessing}
            onChange={(event) => setPublishAfterProcessing(event.target.checked)}
          />
          <span>
            <strong>Publish when ready</strong>
            <small>Only publish after the pages are read successfully.</small>
          </span>
        </label>

        <button type="submit" disabled={!file || isUploading}>
          {isUploading ? "Adding your PDF…" : "Add and start reading"}
          <span aria-hidden>↗</span>
        </button>

        {feedback ? (
          <p
            className={feedback.kind === "error" ? styles.error : styles.feedback}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
