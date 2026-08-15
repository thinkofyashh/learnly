import { NotesLibrary } from "@/components/NotesLibrary";
import { getPublishedDocuments } from "@/services/api-client";

export default async function Notes() {
  const library = await getPublishedDocuments();

  return <NotesLibrary documents={library.items} />;
}
