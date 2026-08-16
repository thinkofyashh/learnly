import { AdminPageHeader } from "@/components/AdminViews";
import { UploadExperience } from "@/components/UploadExperience";

export default function Upload() {
  return (
    <>
      <AdminPageHeader
        eyebrow="New document"
        title="Add to your library."
        body="Upload an educational PDF for storage, text extraction, and publication review."
      />
      <UploadExperience />
    </>
  );
}
