export type DocumentStatus = "uploaded" | "processing" | "published" | "failed";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type PipelineState = "pending" | "processing" | "completed" | "failed";

export interface PageOverviewItem {
  page?: number;
  section?: string;
  summary: string;
}

export interface LearnlyDocument {
  id: number;
  slug: string | null;
  originalFilename: string;
  title: string | null;
  description: string | null;
  status: DocumentStatus;
  processingError: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  topics: string[];
  tags: string[];
  keyTakeaways: string[];
  prerequisites: string[];
  pageOverview: PageOverviewItem[];
  difficulty: Difficulty | null;
  estimatedReadingMinutes: number | null;
  pageCount: number | null;
  sizeBytes: number;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
