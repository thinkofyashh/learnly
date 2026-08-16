import type {
  Difficulty,
  DocumentListResponse,
  DocumentStatus,
  LearnlyDocument,
} from "@/types/document";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getErrorMessage(body: unknown, status: number): string {
  if (!body || typeof body !== "object") return `Request failed with status ${status}`;

  const detail = "detail" in body ? body.detail : undefined;
  const message = "message" in body ? body.message : undefined;

  if (typeof message === "string") return message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "The submitted data is invalid.";

  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`);
  const headers = new Headers(options.headers);

  // Let the browser supply multipart boundaries when the request body is FormData.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new ApiError(getErrorMessage(body, response.status), response.status);
  }

  return response.json() as Promise<T>;
}

function toQueryString(values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function resolveApiUrl(path: string | null): string | null {
  if (!path) return null;
  return new URL(path, baseUrl).toString();
}

export async function getPublishedDocuments(page = 1, limit = 100): Promise<DocumentListResponse> {
  return apiRequest<DocumentListResponse>(`/documents${toQueryString({ page, limit })}`, {
    cache: "no-store",
  });
}

export async function getAllPublishedDocuments(): Promise<LearnlyDocument[]> {
  const firstPage = await getPublishedDocuments(1, 100);

  if (firstPage.pages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      getPublishedDocuments(index + 2, 100),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function getPublishedDocument(slug: string): Promise<LearnlyDocument | null> {
  try {
    return await apiRequest<LearnlyDocument>(`/documents/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface AdminDocumentQuery {
  search?: string;
  status?: DocumentStatus;
  difficulty?: Difficulty;
  topic?: string;
  sort?: "newest" | "oldest" | "title_asc" | "title_desc";
  page?: number;
  limit?: number;
}

export async function getAdminDocuments(
  query: AdminDocumentQuery = {},
): Promise<DocumentListResponse> {
  return apiRequest<DocumentListResponse>(
    `/admin/documents${toQueryString({
      search: query.search,
      status: query.status,
      difficulty: query.difficulty,
      topic: query.topic,
      sort: query.sort,
      page: query.page ?? 1,
      limit: query.limit ?? 100,
    })}`,
    { cache: "no-store" },
  );
}

export async function getAdminDocument(documentId: number): Promise<LearnlyDocument | null> {
  try {
    return await apiRequest<LearnlyDocument>(`/admin/documents/${documentId}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function uploadDocument(
  file: File,
  publishAfterProcessing: boolean,
): Promise<LearnlyDocument> {
  const body = new FormData();
  body.set("file", file);
  body.set("publishAfterProcessing", String(publishAfterProcessing));

  return apiRequest<LearnlyDocument>("/documents", { method: "POST", body });
}

export function retryDocument(documentId: number): Promise<LearnlyDocument> {
  return apiRequest<LearnlyDocument>(`/documents/${documentId}/retry`, { method: "POST" });
}

export function publishDocument(documentId: number): Promise<LearnlyDocument> {
  return apiRequest<LearnlyDocument>(`/documents/${documentId}/publish`, { method: "POST" });
}

export function unpublishDocument(documentId: number): Promise<LearnlyDocument> {
  return apiRequest<LearnlyDocument>(`/documents/${documentId}/unpublish`, { method: "POST" });
}
