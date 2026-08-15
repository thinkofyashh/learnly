import { notFound } from "next/navigation";

import { AdminDocumentReview } from "@/components/AdminViews";
import { getAdminDocument } from "@/services/api-client";

export default async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const documentId = Number(id);

  if (!Number.isInteger(documentId) || documentId < 1) notFound();

  const document = await getAdminDocument(documentId);

  if (!document) notFound();

  return <AdminDocumentReview initialDocument={document} />;
}
