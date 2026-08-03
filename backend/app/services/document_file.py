from dataclasses import dataclass
from typing import BinaryIO

from app.models import Document
from app.repositories import DocumentRepository
from app.storage import StorageBackend


class DocumentNotFoundError(LookupError):
    """Raised when the requested document record does not exist."""


class DocumentFileMissingError(FileNotFoundError):
    """Raised when a document exists but its stored file is unavailable."""


@dataclass(frozen=True, slots=True)
class OpenDocumentFile:
    document: Document
    stream: BinaryIO


class DocumentFileService:
    def __init__(
        self,
        *,
        repository: DocumentRepository,
        storage: StorageBackend,
    ) -> None:
        self.repository = repository
        self.storage = storage

    def open_document(self, document_id: int) -> OpenDocumentFile:
        document = self.repository.get_by_id(document_id=document_id)

        if document is None:
            raise DocumentNotFoundError(f"Document {document_id} was not found")

        try:
            stream = self.storage.open(document.storage_key)
        except (FileNotFoundError, ValueError) as error:
            raise DocumentFileMissingError(
                f"Stored file for document {document_id} was not found"
            ) from error

        return OpenDocumentFile(
            document=document,
            stream=stream,
        )
