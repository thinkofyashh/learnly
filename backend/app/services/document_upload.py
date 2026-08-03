from typing import BinaryIO
from uuid import uuid4

from app.models import Document, DocumentStatus
from app.repositories import DocumentRepository
from app.services.upload_validation import validate_pdf
from app.storage import StorageBackend


class DocumentUploadService:
    def __init__(
        self, *, repository: DocumentRepository, storage: StorageBackend, max_upload_bytes: int
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.max_upload_bytes = max_upload_bytes

    def upload(
        self,
        *,
        filename: str | None,
        content_type: str | None,
        source: BinaryIO,
        publish_after_processing: bool = False,
    ) -> Document:
        validated_upload = validate_pdf(
            filename=filename,
            content_type=content_type,
            max_upload_bytes=self.max_upload_bytes,
            source=source,
        )

        storage_key = f"documents/{uuid4().hex}.pdf"

        document = Document(
            original_filename=validated_upload.original_filename,
            storage_key=storage_key,
            mime_type="application/pdf",
            checksum_sha256=validated_upload.checksum_sha256,
            size_bytes=validated_upload.size_bytes,
            status=DocumentStatus.UPLOADED,
            publish_after_processing=publish_after_processing,
        )

        file_was_stored = False

        try:
            self.storage.save(storage_key=storage_key, source=source)
            file_was_stored = True

            self.repository.add(document)
            self.repository.session.commit()

            return document
        except Exception:
            self.repository.session.rollback()

            if file_was_stored:
                self.storage.delete(storage_key=storage_key)

            raise
