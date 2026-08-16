const RECENT_DOCUMENTS_KEY = "learnly-recent-documents-v1";

export function readRecentDocumentIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_DOCUMENTS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export function rememberDocument(documentId: number) {
  try {
    const recent = readRecentDocumentIds().filter((id) => id !== documentId);
    localStorage.setItem(RECENT_DOCUMENTS_KEY, JSON.stringify([documentId, ...recent].slice(0, 5)));
  } catch {
    // Browsing the library must still work when storage is unavailable.
  }
}
