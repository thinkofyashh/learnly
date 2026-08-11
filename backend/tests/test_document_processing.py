from collections.abc import Generator
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from typing import Any

import pymupdf
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Document, DocumentPage, DocumentStatus
from app.repositories import DocumentRepository
from app.services.document_processing import (
    DocumentProcessingError,
    DocumentProcessingService,
    DocumentRetryNotAllowedError,
    ProcessingDocumentNotFoundError,
)
from app.services.pdf_extraction import PdfExtractor
from app.storage import LocalStorage


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    settings = get_settings()
    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    try:
        yield session
    finally:
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def create_pdf(page_texts: list[str]) -> BytesIO:
    document: Any = pymupdf.open()  # type: ignore[no-untyped-call]

    try:
        for text in page_texts:
            page = document.new_page()

            if text:
                page.insert_text(
                    (72, 72),
                    text,
                )

        return BytesIO(document.tobytes())
    finally:
        document.close()


def create_stored_document(
    *, session: Session, storage: LocalStorage, filename: str, content: bytes
) -> Document:
    storage_key = f"documents/{filename}"
    storage.save(storage_key=storage_key, source=BytesIO(content))

    document = Document(
        original_filename=filename,
        storage_key=storage_key,
        mime_type="application/pdf",
        checksum_sha256=sha256(content).hexdigest(),
        size_bytes=len(content),
    )

    session.add(document)
    session.commit()

    return document


def create_processing_service(
    *, session: Session, storage_root: Path
) -> tuple[DocumentProcessingService, LocalStorage]:
    repository = DocumentRepository(session)
    storage = LocalStorage(storage_root)

    service = DocumentProcessingService(
        repository=repository, storage=storage, extractor=PdfExtractor()
    )

    return service, storage


def test_processing_stores_pages_and_document_metadata(db_session: Session, tmp_path: Path) -> None:
    service, storage = create_processing_service(session=db_session, storage_root=tmp_path)

    pdf_source = create_pdf(["First Extracted Page", "Second Extracted Page"])

    content = pdf_source.getvalue()

    document = create_stored_document(
        session=db_session, storage=storage, filename="successful.pdf", content=content
    )

    processed_document = service.process(document.id)

    stored_pages = list(
        db_session.scalars(
            select(DocumentPage).where(DocumentPage.document_id == document.id)
        ).all()
    )

    assert processed_document.status == DocumentStatus.UPLOADED
    assert processed_document.page_count == 2
    assert processed_document.estimated_reading_minutes == 1
    assert processed_document.processed_at is not None
    assert processed_document.processing_error is None

    assert [page.page_number for page in stored_pages] == [1, 2]
    assert [page.extracted_text for page in stored_pages] == [
        "First Extracted Page",
        "Second Extracted Page",
    ]


def test_processing_records_failure_for_corrupted_pdf(db_session: Session, tmp_path: Path) -> None:
    service, storage = create_processing_service(session=db_session, storage_root=tmp_path)

    content = b"%PDF-1.7\nThis is Corrupted PDF"

    document = create_stored_document(
        session=db_session, storage=storage, filename="corrupted.pdf", content=content
    )

    with pytest.raises(DocumentProcessingError):
        service.process(document.id)

    db_session.expire_all()

    failed_document = db_session.get(Document, document.id)

    assert failed_document is not None
    assert failed_document.status == DocumentStatus.FAILED
    assert failed_document.processing_error is not None
    assert failed_document.page_count is None
    assert failed_document.processed_at is None

    stored_pages = db_session.scalars(
        select(DocumentPage).where(DocumentPage.document_id == document.id)
    ).all()

    assert stored_pages == []


def test_processing_rejects_missing_document(
    db_session: Session,
    tmp_path: Path,
) -> None:
    service, _storage = create_processing_service(
        session=db_session,
        storage_root=tmp_path,
    )

    with pytest.raises(ProcessingDocumentNotFoundError):
        service.process(999999)


def test_processing_publishes_when_requested(db_session: Session, tmp_path: Path) -> None:
    service, storage = create_processing_service(session=db_session, storage_root=tmp_path)

    content = create_pdf(["Automatically published document"]).getvalue()

    document = create_stored_document(
        session=db_session, storage=storage, filename="published.pdf", content=content
    )

    document.publish_after_processing = True
    db_session.commit()

    processed_document = service.process(document.id)

    assert processed_document.status == DocumentStatus.PUBLISHED
    assert processed_document.published_at is not None
    assert processed_document.processed_at is not None
    assert processed_document.slug == "published"


def test_prepare_retry_moves_failed_document_to_processing(
    db_session: Session,
    tmp_path: Path,
) -> None:
    service, storage = create_processing_service(
        session=db_session,
        storage_root=tmp_path,
    )

    document = create_stored_document(
        session=db_session,
        storage=storage,
        filename="retry.pdf",
        content=b"%PDF-1.7\nRetry document",
    )

    document.status = DocumentStatus.FAILED
    document.processing_error = "Previous extraction failed"
    db_session.commit()

    retried_document = service.prepare_retry(document.id)

    assert retried_document.status == DocumentStatus.PROCESSING
    assert retried_document.processing_error is None
    assert retried_document.page_count is None
    assert retried_document.estimated_reading_minutes is None
    assert retried_document.processed_at is None


def test_prepare_retry_rejects_non_failed_document(
    db_session: Session,
    tmp_path: Path,
) -> None:
    service, storage = create_processing_service(
        session=db_session,
        storage_root=tmp_path,
    )

    document = create_stored_document(
        session=db_session,
        storage=storage,
        filename="uploaded.pdf",
        content=b"%PDF-1.7\nUploaded document",
    )

    with pytest.raises(DocumentRetryNotAllowedError):
        service.prepare_retry(document.id)
