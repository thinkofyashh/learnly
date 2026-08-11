from datetime import UTC, datetime
from pathlib import Path

from app.models import Document, DocumentStatus
from app.repositories import DocumentRepository
from app.services.slug import generate_unique_slug


class PublicationDocumentNotFoundError(LookupError):
    """Raised when the requested document does not exist."""


class DocumentNotReadyForPublicationError(RuntimeError):
    """Raised when processing has not completed successfully."""


class DocumentNotPublishedError(RuntimeError):
    """Raised when an unpublished document is unpublish requested."""


class DocumentPublicationService:
    def __init__(self, repository: DocumentRepository) -> None:
        self.repository = repository

    def publish(self, document_id: int) -> Document:
        document = self.repository.get_by_id(document_id=document_id)

        if document is None:
            raise PublicationDocumentNotFoundError(f"Document {document_id} was not found")

        if (
            document.status != DocumentStatus.UPLOADED
            or document.processed_at is None
            or document.page_count is None
        ):
            raise DocumentNotReadyForPublicationError(
                f"Document {document_id} is not ready for publication"
            )

        if document.slug is None:
            slug_source = document.title or Path(document.original_filename).stem

            document.slug = generate_unique_slug(
                slug_source, slug_exists=self.repository.slug_exists
            )

        document.status = DocumentStatus.PUBLISHED
        document.published_at = datetime.now(UTC)

        self.repository.session.commit()

        return document

    def unpublish(self, document_id: int) -> Document:
        document = self.repository.get_by_id(document_id)

        if document is None:
            raise PublicationDocumentNotFoundError(f"Document {document_id} was not found")

        if document.status != DocumentStatus.PUBLISHED:
            raise DocumentNotPublishedError(f"Document {document_id} is not published")

        document.status = DocumentStatus.UPLOADED
        document.published_at = None

        self.repository.session.commit()

        return document
