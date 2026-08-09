import logging

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.repositories import DocumentRepository
from app.services.document_processing import (
    DocumentProcessingError,
    DocumentProcessingService,
    ProcessingDocumentNotFoundError,
)
from app.services.pdf_extraction import PdfExtractor
from app.storage import LocalStorage

logger = logging.getLogger(__name__)


def process_document_task(document_id: int) -> None:
    settings = get_settings()

    with SessionLocal() as session:
        service = DocumentProcessingService(
            repository=DocumentRepository(session),
            storage=LocalStorage(root=settings.storage_root),
            extractor=PdfExtractor(),
        )

        try:
            service.process(document_id=document_id)
        except (
            DocumentProcessingError,
            ProcessingDocumentNotFoundError,
        ):
            logger.exception("Background processing failed for document %s", document_id)
