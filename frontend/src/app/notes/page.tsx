import { NotesLibrary } from "@/components/NotesLibrary";
import { getAllPublishedDocuments } from "@/services/api-client";

export default async function Notes({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [{ topic }, documents] = await Promise.all([searchParams, getAllPublishedDocuments()]);

  return <NotesLibrary documents={documents} initialTopic={topic?.trim() || "all"} />;
}
