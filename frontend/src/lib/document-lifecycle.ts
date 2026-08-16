import type { LearnlyDocument } from "@/types/document";

export type LifecycleKey = "waiting" | "reading" | "ready" | "published" | "attention";

export interface LifecyclePresentation {
  key: LifecycleKey;
  label: string;
  description: string;
}

export const lifecycleSequence: Array<Pick<LifecyclePresentation, "key" | "label">> = [
  { key: "waiting", label: "Waiting to be read" },
  { key: "reading", label: "Reading and organizing pages" },
  { key: "ready", label: "Ready to publish" },
  { key: "published", label: "In your library" },
];

export function documentLifecycle(document: LearnlyDocument): LifecyclePresentation {
  if (document.status === "failed") {
    return {
      key: "attention",
      label: "Needs attention",
      description: "Learnly could not finish reading this PDF. Review the message and retry.",
    };
  }

  if (document.status === "processing") {
    return {
      key: "reading",
      label: "Reading and organizing pages",
      description: "Learnly is extracting the document pages and preparing their reading details.",
    };
  }

  if (document.status === "published") {
    return {
      key: "published",
      label: "In your library",
      description: "This document is published and visible in the public library.",
    };
  }

  if (document.pageCount !== null) {
    return {
      key: "ready",
      label: "Ready to publish",
      description: "The pages have been read and the document is waiting for your review.",
    };
  }

  return {
    key: "waiting",
    label: "Waiting to be read",
    description: "The PDF is safely stored and waiting for processing to begin.",
  };
}
