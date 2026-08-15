import { AdminPageHeader, UploadForm } from "@/components/AdminViews";

export default function Upload() {
  return (
    <>
      <AdminPageHeader
        eyebrow="New document"
        title="Add to your library."
        body="Upload an educational PDF for storage, text extraction, and publication review."
      />
      <UploadForm />
    </>
  );
}
