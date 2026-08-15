import { AdminDocumentsView } from "@/components/AdminViews";
import { getAdminDocuments } from "@/services/api-client";

export default async function Processing() {
  const documents = await getAdminDocuments();

  return <AdminDocumentsView initialData={documents} />;
}
