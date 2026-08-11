from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Document, DocumentStatus
from app.repositories import DocumentRepository
from app.services.document_publication import (
    DocumentNotPublishedError,
    DocumentNotReadyForPublicationError,
    DocumentPublicationService,
    PublicationDocumentNotFoundError,
)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    settings = get_settings()
    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()

    session = Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    )

    try:
        yield session
    finally:
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def create_document(
    *,
    session: Session,
    filename: str,
    checksum_character: str,
    status: DocumentStatus = DocumentStatus.UPLOADED,
    title: str | None = None,
    slug: str | None = None,
    processed: bool = True,
) -> Document:
    processed_at = datetime.now(UTC) if processed else None

    document = Document(
        original_filename=filename,
        storage_key=f"tests/{filename}",
        mime_type="application/pdf",
        checksum_sha256=checksum_character * 64,
        size_bytes=1024,
        title=title,
        slug=slug,
        status=status,
        page_count=1 if processed else None,
        processed_at=processed_at,
        published_at=(processed_at if status == DocumentStatus.PUBLISHED else None),
    )

    session.add(document)
    session.commit()

    return document


def test_publish_generates_unique_slug(
    db_session: Session,
) -> None:
    create_document(
        session=db_session,
        filename="existing.pdf",
        checksum_character="a",
        status=DocumentStatus.PUBLISHED,
        slug="asyncio-fundamentals",
    )

    document = create_document(
        session=db_session,
        filename="asyncio.pdf",
        checksum_character="b",
        title="Asyncio Fundamentals",
    )

    service = DocumentPublicationService(DocumentRepository(db_session))

    published_document = service.publish(document.id)

    assert published_document.status == DocumentStatus.PUBLISHED
    assert published_document.slug == "asyncio-fundamentals-2"
    assert published_document.published_at is not None


def test_publish_rejects_unprocessed_document(
    db_session: Session,
) -> None:
    document = create_document(
        session=db_session,
        filename="unprocessed.pdf",
        checksum_character="c",
        processed=False,
    )

    service = DocumentPublicationService(DocumentRepository(db_session))

    with pytest.raises(DocumentNotReadyForPublicationError):
        service.publish(document.id)


def test_unpublish_preserves_slug(
    db_session: Session,
) -> None:
    document = create_document(
        session=db_session,
        filename="published.pdf",
        checksum_character="d",
        status=DocumentStatus.PUBLISHED,
        slug="published-document",
    )

    service = DocumentPublicationService(DocumentRepository(db_session))

    unpublished_document = service.unpublish(document.id)

    assert unpublished_document.status == DocumentStatus.UPLOADED
    assert unpublished_document.published_at is None
    assert unpublished_document.slug == "published-document"


def test_unpublish_rejects_unpublished_document(
    db_session: Session,
) -> None:
    document = create_document(
        session=db_session,
        filename="uploaded.pdf",
        checksum_character="e",
    )

    service = DocumentPublicationService(DocumentRepository(db_session))

    with pytest.raises(DocumentNotPublishedError):
        service.unpublish(document.id)


@pytest.mark.parametrize("operation", ["publish", "unpublish"])
def test_publication_rejects_missing_document(
    db_session: Session,
    operation: str,
) -> None:
    service = DocumentPublicationService(DocumentRepository(db_session))

    method = getattr(service, operation)

    with pytest.raises(PublicationDocumentNotFoundError):
        method(999999)
