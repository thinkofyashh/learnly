from datetime import UTC, datetime

from app.models import Document, DocumentPage, DocumentStatus
from app.repositories import DocumentRepository
from app.services.pdf_extraction import PdfExtractor
from app.storage import StorageBackend


class DocumentProcessingError(RuntimeError):
    """Raised when a stored document cannot be processed."""


class ProcessingDocumentNotFoundError(LookupError):
    """Raised when the requested document does not exist."""


class DocumentRetryNotAllowedError(RuntimeError):
    """Raised when a document is not in the failed state."""


class DocumentProcessingService:
    def __init__(
        self,
        *,
        repository: DocumentRepository,
        storage: StorageBackend,
        extractor: PdfExtractor,
    ) -> None:
        self.repository = repository
        self.storage = storage
        self.extractor = extractor

    def process(self, document_id: int) -> Document:
        document = self.repository.get_by_id(document_id=document_id)

        if document is None:
            raise ProcessingDocumentNotFoundError(f"Document {document_id} was not found")

        document.status = DocumentStatus.PROCESSING
        document.processing_error = None

        self.repository.session.commit()

        try:
            with self.storage.open(document.storage_key) as source:
                extracted_document = self.extractor.extract(source)

            pages = [
                DocumentPage(
                    document_id=document.id,
                    page_number=page.page_number,
                    extracted_text=page.text,
                )
                for page in extracted_document.pages
            ]
            self.repository.replace_pages(document_id=document.id, pages=pages)

            processed_at = datetime.now(UTC)

            document.page_count = extracted_document.page_count
            document.estimated_reading_minutes = extracted_document.estimated_reading_minutes
            document.processed_at = processed_at
            document.processing_error = None

            if document.publish_after_processing:
                document.status = DocumentStatus.PUBLISHED
                document.published_at = processed_at
            else:
                document.status = DocumentStatus.UPLOADED

            self.repository.session.commit()

            return document

        except Exception as error:
            self.repository.session.rollback()

            failed_document = self.repository.get_by_id(document_id=document_id)

            if failed_document is not None:
                self.repository.replace_pages(document_id=document_id, pages=[])

                failed_document.status = DocumentStatus.FAILED
                failed_document.processing_error = str(error) or "Document Processing Failed"
                failed_document.page_count = None
                failed_document.estimated_reading_minutes = None
                failed_document.processed_at = None

                self.repository.session.commit()
            raise DocumentProcessingError(f"Document {document_id} processing failed") from error

    def prepare_retry(self, document_id: int) -> Document:
        document = self.repository.get_by_id(document_id=document_id)

        if document is None:
            raise ProcessingDocumentNotFoundError(f"Document {document_id} was not found")

        if document.status != DocumentStatus.FAILED:
            raise DocumentRetryNotAllowedError(f"Document {document_id} is not failed")

        document.status = DocumentStatus.PROCESSING
        document.processing_error = None
        document.page_count = None
        document.estimated_reading_minutes = None
        document.processed_at = None

        self.repository.session.commit()

        return document
