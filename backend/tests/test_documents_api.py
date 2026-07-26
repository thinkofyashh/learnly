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


@pytest.mark.parametrize("query", ["page=0", "limit=0", "limit=101"])
def test_collection_rejects_invalid_pagination(
    api_context: tuple[TestClient, Session], query: str
) -> None:
    client, _session = api_context

    response = client.get(f"/api/v1/documents?{query}")

    assert response.status_code == 422
