import { AdminPublishedView } from "@/components/AdminViews";
import { getAdminDocuments } from "@/services/api-client";

export default async function Published() {
  const documents = await getAdminDocuments({ status: "published" });

  return <AdminPublishedView initialData={documents} />;
}
