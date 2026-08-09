from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Document, DocumentPage, DocumentStatus
from app.repositories import DocumentRepository


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    settings = get_settings()
    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    try:
        yield session
    finally:
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def test_document_and_page_are_persisted_with_defaults(db_session: Session) -> None:
    document = Document(
        original_filename="python-notes.pdf",
        storage_key="tests/python-notes.pdf",
        mime_type="application/pdf",
        checksum_sha256="a" * 64,
        size_bytes=1024,
    )
    page = DocumentPage(page_number=1, extracted_text="Python fundamentals")

    document.pages.append(page)

    db_session.add(document)
    db_session.flush()

    assert document.id is not None
    assert document.status == DocumentStatus.UPLOADED
    assert document.topics == []
    assert document.tags == []
    assert document.key_takeaways == []
    assert document.prerequisites == []
    assert document.view_count == 0
    assert document.download_count == 0
    assert document.publish_after_processing is False
    assert document.created_at is not None
    assert document.updated_at is not None
    assert page.document_id == document.id
    assert page.document is document


def test_zero_byte_document_is_rejected(db_session: Session) -> None:
    document = Document(
        original_filename="empty.pdf",
        storage_key="tests/empty.pdf",
        mime_type="application/pdf",
        checksum_sha256="b" * 64,
        size_bytes=0,
    )

    db_session.add(document)

    with pytest.raises(IntegrityError):
        db_session.flush()


def test_duplicate_page_numbers_are_rejected(db_session: Session) -> None:
    document = Document(
        original_filename="duplicate-pages.pdf",
        storage_key="tests/duplicate-pages.pdf",
        mime_type="application/pdf",
        checksum_sha256="c" * 64,
        size_bytes=2048,
    )

    document.pages.extend(
        [
            DocumentPage(page_number=1, extracted_text="First"),
            DocumentPage(page_number=1, extracted_text="Duplicate"),
        ]
    )

    db_session.add(document)

    with pytest.raises(IntegrityError):
        db_session.flush()


def test_pages_are_deleted_with_their_document(db_session: Session) -> None:
    document = Document(
        original_filename="duplicate-pages.pdf",
        storage_key="tests/duplicate-pages.pdf",
        mime_type="application/pdf",
        checksum_sha256="c" * 64,
        size_bytes=2048,
    )
    page = DocumentPage(page_number=1, extracted_text="Page content")
    document.pages.append(page)

    db_session.add(document)
    db_session.flush()

    page_id = page.id

    db_session.delete(document)
    db_session.flush()

    assert db_session.get(DocumentPage, page_id) is None


def test_repository_replaces_existing_document_pages(db_session: Session) -> None:
    document = Document(
        original_filename="replacement-test.pdf",
        storage_key="tests/replacement-test.pdf",
        mime_type="application/pdf",
        checksum_sha256="d" * 64,
        size_bytes=2048,
    )

    document.pages.extend(
        [
            DocumentPage(
                page_number=1,
                extracted_text="Old first page",
            ),
            DocumentPage(
                page_number=2,
                extracted_text="Old second page",
            ),
        ]
    )

    db_session.add(document)

    db_session.flush()

    repository = DocumentRepository(db_session)

    replacement_pages = [
        DocumentPage(
            document_id=document.id,
            page_number=1,
            extracted_text="New first page",
        ),
        DocumentPage(
            document_id=document.id,
            page_number=2,
            extracted_text="New second page",
        ),
        DocumentPage(
            document_id=document.id,
            page_number=3,
            extracted_text="New third page",
        ),
    ]

    repository.replace_pages(
        document_id=document.id,
        pages=replacement_pages,
    )

    stored_pages = list(
        db_session.scalars(
            select(DocumentPage)
            .where(DocumentPage.document_id == document.id)
            .order_by(DocumentPage.page_number)
        ).all()
    )

    assert [page.page_number for page in stored_pages] == [1, 2, 3]
    assert [page.extracted_text for page in stored_pages] == [
        "New first page",
        "New second page",
        "New third page",
    ]
