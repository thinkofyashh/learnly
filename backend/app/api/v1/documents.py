from collections.abc import Iterator
from typing import Annotated, BinaryIO
from urllib.parse import quote

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.repositories import DocumentRepository
from app.schemas import DocumentListResponse, DocumentResponse
from app.services import DocumentService
from app.services.document_file import (
    DocumentFileMissingError,
    DocumentFileService,
    DocumentNotFoundError,
    OpenDocumentFile,
)
from app.services.document_processing import (
    DocumentProcessingService,
    DocumentRetryNotAllowedError,
    ProcessingDocumentNotFoundError,
)
from app.services.document_publication import (
    DocumentNotPublishedError,
    DocumentNotReadyForPublicationError,
    DocumentPublicationService,
    PublicationDocumentNotFoundError,
)
from app.services.document_upload import DocumentUploadService
from app.services.pdf_extraction import PdfExtractor
from app.services.upload_validation import UploadTooLargeError, UploadValidationError
from app.storage import LocalStorage
from app.tasks.document_processing import process_document_task

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


def get_document_service(session: Annotated[Session, Depends(get_db_session)]) -> DocumentService:
    settings = get_settings()
    repository = DocumentRepository(session)

    return DocumentService(repository=repository, api_prefix=settings.api_v1_prefix)


def get_document_upload_service(
    session: Annotated[Session, Depends(get_db_session)],
) -> DocumentUploadService:
    settings = get_settings()
    repository = DocumentRepository(session)
    storage = LocalStorage(settings.storage_root)

    return DocumentUploadService(
        repository=repository, storage=storage, max_upload_bytes=settings.max_upload_bytes
    )


def get_document_file_service(
    session: Annotated[Session, Depends(get_db_session)],
) -> DocumentFileService:
    settings = get_settings()
    repository = DocumentRepository(session=session)
    storage = LocalStorage(settings.storage_root)

    return DocumentFileService(repository=repository, storage=storage)


def stream_file(stream: BinaryIO) -> Iterator[bytes]:
    try:
        while chunk := stream.read(1024 * 1024):
            yield chunk
    finally:
        stream.close()


def open_document_or_404(*, document_id: int, service: DocumentFileService) -> OpenDocumentFile:
    try:
        return service.open_document(document_id=document_id)
    except DocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        ) from error
    except DocumentFileMissingError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found",
        ) from error


def get_document_processing_service(
    session: Annotated[Session, Depends(get_db_session)],
) -> DocumentProcessingService:
    settings = get_settings()

    return DocumentProcessingService(
        repository=DocumentRepository(session),
        storage=LocalStorage(settings.storage_root),
        extractor=PdfExtractor(),
    )


def get_document_publication_service(
    session: Annotated[Session, Depends(get_db_session)],
) -> DocumentPublicationService:
    return DocumentPublicationService(repository=DocumentRepository(session=session))


@router.get("", response_model=DocumentListResponse)
def list_published_documents(
    service: Annotated[DocumentService, Depends(get_document_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 12,
) -> DocumentListResponse:
    return service.list_published(limit=limit, page=page)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File(description="PDF document to upload")],
    upload_service: Annotated[DocumentUploadService, Depends(get_document_upload_service)],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
    publish_after_processing: Annotated[bool, Form(alias="publishAfterProcessing")] = False,
) -> DocumentResponse:
    try:
        document = upload_service.upload(
            filename=file.filename,
            content_type=file.content_type,
            source=file.file,
            publish_after_processing=publish_after_processing,
        )
        background_tasks.add_task(process_document_task, document_id=document.id)
    except UploadTooLargeError as error:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(error),
        ) from error
    except UploadValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return document_service.build_response(document=document)


@router.get("/{document_id}/preview")
def preview_document(
    document_id: int,
    service: Annotated[DocumentFileService, Depends(get_document_file_service)],
) -> StreamingResponse:
    opened_file = open_document_or_404(document_id=document_id, service=service)
    encoded_filename = quote(opened_file.document.original_filename, safe="")
    return StreamingResponse(
        stream_file(opened_file.stream),
        media_type=opened_file.document.mime_type,
        headers={
            "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
            "Content-Length": str(opened_file.document.size_bytes),
        },
    )


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    service: Annotated[DocumentFileService, Depends(get_document_file_service)],
) -> StreamingResponse:
    opened_file = open_document_or_404(document_id=document_id, service=service)
    encoded_filename = quote(opened_file.document.original_filename, safe="")
    return StreamingResponse(
        stream_file(opened_file.stream),
        media_type=opened_file.document.mime_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Content-Length": str(opened_file.document.size_bytes),
        },
    )


@router.post(
    "/{document_id}/retry",
    response_model=DocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def retry_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    processing_service: Annotated[
        DocumentProcessingService,
        Depends(get_document_processing_service),
    ],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> DocumentResponse:
    try:
        document = processing_service.prepare_retry(document_id=document_id)
    except ProcessingDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        ) from error
    except DocumentRetryNotAllowedError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only failed documents can be retried",
        ) from error

    background_tasks.add_task(
        process_document_task,
        document_id=document.id,
    )

    return document_service.build_response(document)


@router.post("/{document_id}/publish", response_model=DocumentResponse)
def publish_document(
    document_id: int,
    publication_service: Annotated[
        DocumentPublicationService, Depends(get_document_publication_service)
    ],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> DocumentResponse:
    try:
        published_document = publication_service.publish(document_id=document_id)
    except PublicationDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        ) from error
    except DocumentNotReadyForPublicationError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is not ready for publication",
        ) from error

    return document_service.build_response(published_document)


@router.post("/{document_id}/unpublish", response_model=DocumentResponse)
def unpublish_document(
    document_id: int,
    publication_service: Annotated[
        DocumentPublicationService, Depends(get_document_publication_service)
    ],
    document_service: Annotated[DocumentService, Depends(get_document_service)],
) -> DocumentResponse:
    try:
        document = publication_service.unpublish(document_id=document_id)
    except PublicationDocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        ) from error
    except DocumentNotPublishedError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is not published",
        ) from error

    return document_service.build_response(document)


@router.get("/{slug}", response_model=DocumentResponse)
def get_published_document(
    service: Annotated[DocumentService, Depends(get_document_service)], slug: str
) -> DocumentResponse:
    document = service.get_published_by_slug(slug)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document
