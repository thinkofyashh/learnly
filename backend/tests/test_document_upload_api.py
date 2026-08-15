from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.main import app
from app.models import Document, DocumentStatus
from tests.pdf_factory import make_pdf_bytes


@pytest.fixture
def upload_api_context(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[tuple[TestClient, Session, Path], None, None]:
    settings = get_settings()
    monkeypatch.setattr(settings, "storage_root", tmp_path)
    monkeypatch.setattr(settings, "max_upload_bytes", 4096)

    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    def override_db_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_db_session] = override_db_session
    monkeypatch.setattr(
        "app.api.v1.documents.process_document_task",
        lambda document_id: None,
    )

    try:
        with TestClient(app) as client:
            yield client, session, tmp_path

    finally:
        app.dependency_overrides.clear()
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def test_upload_endpoint_creates_document_and_stores_pdf(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, storage_root = upload_api_context
    content = make_pdf_bytes("Learnly upload")

    response = client.post(
        "/api/v1/documents",
        files={"file": ("asyncio-fundamentals.pdf", content, "application/pdf")},
        data={"publishAfterProcessing": "true"},
    )

    assert response.status_code == 201

    body = response.json()

    assert body["originalFilename"] == "asyncio-fundamentals.pdf"
    assert body["status"] == "uploaded"
    assert body["sizeBytes"] == len(content)

    document = session.scalars(select(Document)).one()

    assert document.publish_after_processing is True
    assert (storage_root / document.storage_key).read_bytes() == content


def test_upload_endpoint_rejects_invalid_pdf_without_creating_data(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, storage_root = upload_api_context

    response = client.post(
        "/api/v1/documents", files={"file": ("fake.pdf", b"This is not a PDF", "application/pdf")}
    )

    assert response.status_code == 400
    assert "detail" in response.json()
    assert session.scalars(select(Document)).all() == []
    assert list(storage_root.rglob("*.pdf")) == []


def test_upload_endpoint_rejects_oversized_pdf(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, storage_root = upload_api_context

    response = client.post(
        "/api/v1/documents",
        files={
            "file": (
                "large.pdf",
                b"%PDF-" + b"x" * 5000,
                "application/pdf",
            )
        },
    )

    assert response.status_code == 413
    assert "detail" in response.json()
    assert session.scalars(select(Document)).all() == []
    assert list(storage_root.rglob("*.pdf")) == []


@pytest.mark.parametrize(
    ("endpoint", "expected_disposition"),
    [("preview", "inline"), ("download", "attachment")],
)
def test_document_file_endpoint_returns_stored_pdf(
    upload_api_context: tuple[TestClient, Session, Path], endpoint: str, expected_disposition: str
) -> None:
    client, _session, _storage_root = upload_api_context
    content = make_pdf_bytes("Learnly file response")

    upload_response = client.post(
        "/api/v1/documents", files={"file": ("learnly-guide.pdf", content, "application/pdf")}
    )

    assert upload_response.status_code == 201

    document_id = upload_response.json()["id"]
    response = client.get(f"/api/v1/documents/{document_id}/{endpoint}")

    assert response.status_code == 200
    assert response.content == content
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["content-disposition"].startswith(expected_disposition)
    assert response.headers["content-length"] == str(len(content))


@pytest.mark.parametrize("endpoint", ["preview", "download"])
def test_document_file_endpoint_returns_404_for_missing_document(
    upload_api_context: tuple[TestClient, Session, Path], endpoint: str
) -> None:
    client, _session, _storage = upload_api_context

    response = client.get(f"/api/v1/documents/99999/{endpoint}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_preview_returns_404_when_stored_file_is_missing(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, storage_key = upload_api_context
    content = make_pdf_bytes("Missing file test")

    upload_response = client.post(
        "/api/v1/documents", files={"file": ("missing.pdf", content, "application/pdf")}
    )

    assert upload_response.status_code == 201

    document = session.scalars(select(Document)).one()
    (storage_key / document.storage_key).unlink()

    response = client.get(f"/api/v1/documents/{document.id}/preview")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document file not found"


def test_preview_rejects_unsafe_storage_key(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, _storage_key = upload_api_context

    document = Document(
        original_filename="unsafe.pdf",
        storage_key="../.env",
        mime_type="application/pdf",
        checksum_sha256="a" * 64,
        size_bytes=100,
    )

    session.add(document)
    session.commit()

    response = client.get(f"/api/v1/documents/{document.id}/preview")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document file not found"


def test_upload_endpoint_schedules_processing(
    upload_api_context: tuple[TestClient, Session, Path],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client, _session, _storage_root = upload_api_context
    scheduled_document_ids: list[int] = []

    def fake_processing_task(document_id: int) -> None:
        scheduled_document_ids.append(document_id)

    monkeypatch.setattr(
        "app.api.v1.documents.process_document_task",
        fake_processing_task,
    )

    response = client.post(
        "/api/v1/documents",
        files={
            "file": (
                "scheduled.pdf",
                make_pdf_bytes("Scheduled processing"),
                "application/pdf",
            )
        },
    )

    assert response.status_code == 201
    assert scheduled_document_ids == [response.json()["id"]]


def test_upload_endpoint_rejects_corrupt_pdf_without_creating_data(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, storage_root = upload_api_context

    response = client.post(
        "/api/v1/documents",
        files={
            "file": (
                "corrupt.pdf",
                b"%PDF-1.7\nThis file has no valid PDF structure",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "PDF is corrupt or unreadable"
    assert session.scalars(select(Document)).all() == []
    assert list(storage_root.rglob("*.pdf")) == []


def test_retry_endpoint_schedules_failed_document(
    upload_api_context: tuple[TestClient, Session, Path],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client, session, _storage_root = upload_api_context
    scheduled_document_ids: list[int] = []

    document = Document(
        original_filename="failed.pdf",
        storage_key="documents/failed.pdf",
        mime_type="application/pdf",
        checksum_sha256="a" * 64,
        size_bytes=100,
        status=DocumentStatus.FAILED,
        processing_error="Extraction failed",
    )
    session.add(document)
    session.commit()

    def fake_processing_task(document_id: int) -> None:
        scheduled_document_ids.append(document_id)

    monkeypatch.setattr(
        "app.api.v1.documents.process_document_task",
        fake_processing_task,
    )

    response = client.post(f"/api/v1/documents/{document.id}/retry")

    assert response.status_code == 202
    assert response.json()["status"] == "processing"
    assert document.processing_error is None
    assert scheduled_document_ids == [document.id]


def test_retry_endpoint_returns_404_for_missing_document(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, _session, _storage_root = upload_api_context

    response = client.post("/api/v1/documents/999999/retry")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_retry_endpoint_rejects_non_failed_document(
    upload_api_context: tuple[TestClient, Session, Path],
) -> None:
    client, session, _storage_root = upload_api_context

    document = Document(
        original_filename="uploaded.pdf",
        storage_key="documents/uploaded.pdf",
        mime_type="application/pdf",
        checksum_sha256="b" * 64,
        size_bytes=100,
        status=DocumentStatus.UPLOADED,
    )
    session.add(document)
    session.commit()

    response = client.post(f"/api/v1/documents/{document.id}/retry")

    assert response.status_code == 409
    assert response.json()["detail"] == ("Only failed documents can be retried")
