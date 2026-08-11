from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.main import app
from app.models import Document, DocumentStatus


@pytest.fixture
def api_context() -> Generator[tuple[TestClient, Session], None, None]:
    settings = get_settings()
    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    def override_db_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_db_session] = override_db_session

    try:
        with TestClient(app) as client:
            yield (client, session)
    finally:
        app.dependency_overrides.clear()
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def make_document(*, slug: str, status: DocumentStatus, checksum_character: str) -> Document:
    published_at = datetime.now(UTC) if status == DocumentStatus.PUBLISHED else None

    return Document(
        slug=slug,
        original_filename=f"{slug}.pdf",
        storage_key=f"tests/{slug}.pdf",
        mime_type="application/pdf",
        checksum_sha256=checksum_character * 64,
        size_bytes=1024,
        title=slug.replace("-", " ").title(),
        status=status,
        processed_at=published_at,
        published_at=published_at,
    )


def make_ready_document(
    *,
    filename: str,
    checksum_character: str,
    status: DocumentStatus = DocumentStatus.UPLOADED,
    slug: str | None = None,
) -> Document:
    processed_at = datetime.now(UTC)

    return Document(
        original_filename=filename,
        storage_key=f"tests/{filename}",
        mime_type="application/pdf",
        checksum_sha256=checksum_character * 64,
        size_bytes=1024,
        title="API Publication",
        slug=slug,
        status=status,
        page_count=1,
        processed_at=processed_at,
        published_at=(processed_at if status == DocumentStatus.PUBLISHED else None),
    )


def test_collection_returns_only_published_documents(
    api_context: tuple[TestClient, Session],
) -> None:
    client, session = api_context
    session.add_all(
        [
            make_document(
                slug="published-one", status=DocumentStatus.PUBLISHED, checksum_character="a"
            ),
            make_document(
                slug="published-two", status=DocumentStatus.PUBLISHED, checksum_character="b"
            ),
            make_document(
                slug="uploaded-document", status=DocumentStatus.UPLOADED, checksum_character="c"
            ),
        ]
    )

    session.flush()

    response = client.get("/api/v1/documents?page=1&limit=1")

    assert response.status_code == 200

    body = response.json()

    assert body["total"] == 2
    assert body["page"] == 1
    assert body["pages"] == 2
    assert body["limit"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["status"] == "published"
    assert "originalFilename" in body["items"][0]
    assert "original_filename" not in body["items"][0]


def test_detail_hides_unpublished_documents(api_context: tuple[TestClient, Session]) -> None:
    client, session = api_context
    published = make_document(
        slug="public-document", status=DocumentStatus.PUBLISHED, checksum_character="a"
    )
    unpublished = make_document(
        slug="private-document", status=DocumentStatus.UPLOADED, checksum_character="b"
    )

    session.add_all([published, unpublished])
    session.flush()

    published_response = client.get("/api/v1/documents/public-document")
    unpublished_response = client.get("/api/v1/documents/private-document")
    missing_document = client.get("/api/v1/documents/missing-document")

    assert published_response.status_code == 200
    assert published_response.json()["slug"] == "public-document"
    assert published_response.json()["previewUrl"].endswith(f"/documents/{published.id}/preview")
    assert unpublished_response.status_code == 404
    assert missing_document.status_code == 404


def test_publish_endpoint_makes_document_public(
    api_context: tuple[TestClient, Session],
) -> None:
    client, session = api_context
    document = make_ready_document(
        filename="api-publication.pdf",
        checksum_character="d",
    )

    session.add(document)
    session.flush()

    response = client.post(f"/api/v1/documents/{document.id}/publish")

    assert response.status_code == 200
    assert response.json()["status"] == "published"
    assert response.json()["slug"] == "api-publication"

    public_response = client.get("/api/v1/documents/api-publication")

    assert public_response.status_code == 200


def test_unpublish_endpoint_hides_document(
    api_context: tuple[TestClient, Session],
) -> None:
    client, session = api_context
    document = make_ready_document(
        filename="hidden.pdf",
        checksum_character="e",
        status=DocumentStatus.PUBLISHED,
        slug="hidden-document",
    )

    session.add(document)
    session.flush()

    response = client.post(f"/api/v1/documents/{document.id}/unpublish")

    assert response.status_code == 200
    assert response.json()["status"] == "uploaded"

    public_response = client.get("/api/v1/documents/hidden-document")

    assert public_response.status_code == 404


@pytest.mark.parametrize("operation", ["publish", "unpublish"])
def test_publication_endpoint_returns_404_for_missing_document(
    api_context: tuple[TestClient, Session],
    operation: str,
) -> None:
    client, _session = api_context

    response = client.post(f"/api/v1/documents/999999/{operation}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_publish_endpoint_rejects_unprocessed_document(
    api_context: tuple[TestClient, Session],
) -> None:
    client, session = api_context
    document = make_document(
        slug="unprocessed-document",
        status=DocumentStatus.UPLOADED,
        checksum_character="f",
    )

    session.add(document)
    session.flush()

    response = client.post(f"/api/v1/documents/{document.id}/publish")

    assert response.status_code == 409
    assert response.json()["detail"] == ("Document is not ready for publication")


def test_unpublish_endpoint_rejects_unpublished_document(
    api_context: tuple[TestClient, Session],
) -> None:
    client, session = api_context
    document = make_ready_document(
        filename="not-published.pdf",
        checksum_character="g",
    )

    session.add(document)
    session.flush()

    response = client.post(f"/api/v1/documents/{document.id}/unpublish")

    assert response.status_code == 409
    assert response.json()["detail"] == ("Document is not published")


@pytest.mark.parametrize("query", ["page=0", "limit=0", "limit=101"])
def test_collection_rejects_invalid_pagination(
    api_context: tuple[TestClient, Session], query: str
) -> None:
    client, _session = api_context

    response = client.get(f"/api/v1/documents?{query}")

    assert response.status_code == 422
