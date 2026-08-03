from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path, PurePosixPath
from typing import BinaryIO

PDF_SIGNATURE = b"%PDF-"
PDF_CONTENT_TYPE = "application/pdf"
READ_CHUNK_BYTES = 1024 * 1024


class UploadValidationError(ValueError):
    """Raised when an uploaded file fails PDF validation."""


class UploadTooLargeError(UploadValidationError):
    """Raised when an uploaded file exceeds the configured size limit."""


@dataclass(frozen=True, slots=True)
class ValidatedUpload:
    original_filename: str
    size_bytes: int
    checksum_sha256: str


def validate_pdf(
    *,
    filename: str | None,
    content_type: str | None,
    source: BinaryIO,
    max_upload_bytes: int,
) -> ValidatedUpload:
    source.seek(0)

    try:
        original_filename = _validate_filename(filename)
        _validate_content_type(content_type)

        if max_upload_bytes <= 0:
            raise ValueError("Maximum upload size must be greater than zero")

        checksum = sha256()
        signature = b""
        size_bytes = 0

        while chunk := source.read(READ_CHUNK_BYTES):
            if not signature:
                signature = chunk[: len(PDF_SIGNATURE)]

            size_bytes += len(chunk)

            if size_bytes > max_upload_bytes:
                raise UploadTooLargeError("PDF exceeds the maximum upload size")

            checksum.update(chunk)

        if size_bytes == 0:
            raise UploadValidationError("PDF cannot be empty")

        if not signature.startswith(PDF_SIGNATURE):
            raise UploadValidationError("File does not contain a valid PDF signature")

        return ValidatedUpload(
            original_filename=original_filename,
            size_bytes=size_bytes,
            checksum_sha256=checksum.hexdigest(),
        )
    finally:
        source.seek(0)


def _validate_filename(filename: str | None) -> str:
    if filename is None or not filename.strip():
        raise UploadValidationError("PDF filename is required")

    normalized_string = filename.replace("\\", "/")
    safe_filename = PurePosixPath(normalized_string).name

    if Path(safe_filename).suffix.lower() != ".pdf":
        raise UploadValidationError("Uploaded file must have a .pdf extension")

    return safe_filename


def _validate_content_type(content_type: str | None) -> None:
    normalized_content_type = (content_type or "").split(";", maxsplit=1)[0].strip().lower()

    if normalized_content_type != PDF_CONTENT_TYPE:
        raise UploadValidationError("Uploaded file must use the application/pdf content type")
