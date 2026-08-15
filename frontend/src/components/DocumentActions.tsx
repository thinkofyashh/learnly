"use client";

import { useState } from "react";

export function DocumentActions({ downloadUrl }: { downloadUrl: string | null }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }

    window.setTimeout(() => setCopyStatus("idle"), 2000);
  }

  return (
    <>
      {downloadUrl ? (
        <a href={downloadUrl}>Download original</a>
      ) : (
        <button disabled>Download original</button>
      )}
      <button type="button" onClick={copyShareLink}>
        {copyStatus === "copied"
          ? "Link copied"
          : copyStatus === "failed"
            ? "Copy failed"
            : "Copy share link"}
      </button>
    </>
  );
}
