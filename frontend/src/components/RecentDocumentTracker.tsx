"use client";

import { useEffect } from "react";

import { rememberDocument } from "@/lib/recent-documents";

export function RecentDocumentTracker({ documentId }: { documentId: number }) {
  useEffect(() => {
    rememberDocument(documentId);
  }, [documentId]);

  return null;
}
