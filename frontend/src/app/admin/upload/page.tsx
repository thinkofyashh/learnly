import { AdminPageHeader, UploadForm } from "@/components/AdminViews";

export default function Upload() {
  return (
    <>
      <AdminPageHeader
        eyebrow="New document"
        title="Add to your library."
        body="Bring in an educational PDF and prepare its metadata for the future processing pipeline."
      />
      <UploadForm />
    </>
  );
}
