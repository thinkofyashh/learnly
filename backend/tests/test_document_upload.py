from io import BytesIO
from pathlib import Path
from unittest.mock import Mock

import pytest
from sqlalchemy.orm import Session

from app.repositories import DocumentRepository
from app.services.document_upload import DocumentUploadService
from app.services.upload_validation import UploadValidationError
from app.storage import LocalStorage
from tests.pdf_factory import make_pdf_bytes


def create_upload_service(tmp_path: Path) -> tuple[DocumentUploadService, Mock, LocalStorage]:
    session = Mock(spec=Session)
    storage = LocalStorage(tmp_path)
    repository = DocumentRepository(session=session)
    service = DocumentUploadService(storage=storage, repository=repository, max_upload_bytes=1024)

    return service, session, storage


def test_upload_stores_file_and_creates_document(tmp_path: Path) -> None:
    service, session, storage = create_upload_service(tmp_path)
    content = make_pdf_bytes()

    document = service.upload(
        filename="asyncio-fundamentals.pdf",
        content_type="application/pdf",
        source=BytesIO(content),
    )

    assert document.original_filename == "asyncio-fundamentals.pdf"
    assert document.mime_type == "application/pdf"
    assert document.size_bytes == len(content)
    assert document.storage_key.startswith("documents/")
    assert document.storage_key.endswith(".pdf")
    assert storage.exists(storage_key=document.storage_key)

    with storage.open(storage_key=document.storage_key) as stored_file:
        assert stored_file.read() == content

    session.add.assert_called_once_with(document)
    session.flush.assert_called_once()
    session.commit.assert_called_once()
    session.rollback.assert_not_called()


def test_upload_rejects_invalid_file_before_storage_or_database(tmp_path: Path) -> None:
    service, session, _storage = create_upload_service(tmp_path=tmp_path)

    with pytest.raises(UploadValidationError):
        service.upload(
            filename="notes.pdf", content_type="application/pdf", source=BytesIO(b"Not a Real PDF")
        )

    assert list(tmp_path.rglob("*.pdf")) == []
    session.add.assert_not_called()
    session.flush.assert_not_called()
    session.commit.assert_not_called()
    session.rollback.assert_not_called()


def test_upload_removes_file_when_database_commit_fails(tmp_path: Path) -> None:
    service, session, _storage = create_upload_service(tmp_path=tmp_path)
    session.commit.side_effect = RuntimeError("Database commit Failed")

    with pytest.raises(RuntimeError, match="Database commit Failed"):
        service.upload(
            filename="document.pdf",
            content_type="application/pdf",
            source=BytesIO(make_pdf_bytes()),
        )

    session.rollback.assert_called_once()
    assert list(tmp_path.rglob("*.pdf")) == []


def test_upload_rejects_corrupt_pdf_before_storage_or_database(tmp_path: Path) -> None:
    service, session, _storage = create_upload_service(tmp_path=tmp_path)

    with pytest.raises(UploadValidationError, match="corrupt or unreadable"):
        service.upload(
            filename="corrupt.pdf",
            content_type="application/pdf",
            source=BytesIO(b"%PDF-1.7\nCorrupt document"),
        )

    assert list(tmp_path.rglob("*.pdf")) == []
    session.add.assert_not_called()
    session.flush.assert_not_called()
    session.commit.assert_not_called()
