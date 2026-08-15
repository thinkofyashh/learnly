from hashlib import sha256
from io import BytesIO

import pytest

from app.services.upload_validation import (
    UploadTooLargeError,
    UploadValidationError,
    validate_pdf,
)
from tests.pdf_factory import make_password_protected_pdf_bytes, make_pdf_bytes


def test_validate_pdf_accepts_valid_file() -> None:
    content = make_pdf_bytes()
    source = BytesIO(content)

    result = validate_pdf(
        filename="asyncio-fundamentals.pdf",
        content_type="application/pdf",
        source=source,
        max_upload_bytes=1024,
    )

    assert result.original_filename == "asyncio-fundamentals.pdf"
    assert result.size_bytes == len(content)
    assert result.checksum_sha256 == sha256(content).hexdigest()
    assert source.tell() == 0


@pytest.mark.parametrize(
    "filename",
    [
        "",
        None,
        "notes.txt",
        "document",
    ],
)
def test_validate_pdf_rejects_invalid_filename(filename: str | None) -> None:
    source = BytesIO(b"%PDF-1.7\ncontent")

    with pytest.raises(UploadValidationError):
        validate_pdf(
            filename=filename, content_type="application/pdf", source=source, max_upload_bytes=1024
        )


def test_validate_pdf_rejects_invalid_content_type() -> None:
    source = BytesIO()

    with pytest.raises(UploadValidationError):
        validate_pdf(
            filename="document.pdf", content_type="text/plain", source=source, max_upload_bytes=1024
        )


def test_validate_pdf_rejects_empty_file() -> None:
    source = BytesIO()

    with pytest.raises(UploadValidationError):
        validate_pdf(
            filename="document.pdf",
            content_type="application/pdf",
            source=source,
            max_upload_bytes=1024,
        )

    assert source.tell() == 0


def test_validate_pdf_rejects_invalid_signature() -> None:
    source = BytesIO(b"This is not the Real PDF .")

    with pytest.raises(UploadValidationError):
        validate_pdf(
            filename="document.pdf",
            content_type="application/pdf",
            source=source,
            max_upload_bytes=1024,
        )

    assert source.tell() == 0


def test_validate_pdf_rejects_oversized_file() -> None:
    source = BytesIO(b"%PDF-" + b"x" * 20)

    with pytest.raises(UploadTooLargeError):
        validate_pdf(
            filename="document.pdf",
            content_type="application/pdf",
            source=source,
            max_upload_bytes=10,
        )

    assert source.tell() == 0


def test_validate_pdf_removes_paths_from_filename() -> None:
    source = BytesIO(make_pdf_bytes())

    result = validate_pdf(
        filename="../../document.pdf",
        content_type="application/pdf",
        source=source,
        max_upload_bytes=1024,
    )

    assert result.original_filename == "document.pdf"


def test_validate_pdf_rejects_corrupt_structure() -> None:
    source = BytesIO(b"%PDF-1.7\nThis has a PDF header but no valid structure")

    with pytest.raises(UploadValidationError, match="corrupt or unreadable"):
        validate_pdf(
            filename="corrupt.pdf",
            content_type="application/pdf",
            source=source,
            max_upload_bytes=1024,
        )

    assert source.tell() == 0


def test_validate_pdf_rejects_password_protected_file() -> None:
    source = BytesIO(make_password_protected_pdf_bytes())

    with pytest.raises(UploadValidationError, match="Password-protected"):
        validate_pdf(
            filename="protected.pdf",
            content_type="application/pdf",
            source=source,
            max_upload_bytes=4096,
        )

    assert source.tell() == 0
