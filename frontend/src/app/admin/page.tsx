import { AdminDashboard } from "@/components/AdminViews";
import { getAdminDocuments } from "@/services/api-client";

export default async function Admin() {
  const documents = await getAdminDocuments();

  return <AdminDashboard documents={documents.items} total={documents.total} />;
}
