from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.repositories import DocumentRepository
from app.schemas import DocumentListResponse, DocumentResponse
from app.services import DocumentService

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


def get_document_service(session: Annotated[Session, Depends(get_db_session)]) -> DocumentService:
    settings = get_settings()
    repository = DocumentRepository(session)

    return DocumentService(repository=repository, api_prefix=settings.api_v1_prefix)


@router.get("", response_model=DocumentListResponse)
def list_published_documents(
    service: Annotated[DocumentService, Depends(get_document_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 12,
) -> DocumentListResponse:
    return service.list_published(limit=limit, page=page)


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
