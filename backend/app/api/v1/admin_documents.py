from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.models import DocumentDifficulty, DocumentStatus
from app.repositories import AdminDocumentFilters, AdminDocumentSort, DocumentRepository
from app.schemas import DocumentListResponse
from app.services import AdminDocumentService, DocumentService

router = APIRouter(prefix="/admin/documents", tags=["admin"])


def get_admin_document_service(
    session: Annotated[Session, Depends(get_db_session)],
) -> AdminDocumentService:
    settings = get_settings()
    repository = DocumentRepository(session=session)

    return AdminDocumentService(
        repository=repository,
        document_service=DocumentService(repository=repository, api_prefix=settings.api_v1_prefix),
    )


@router.get("", response_model=DocumentListResponse)
def list_admin_documents(
    service: Annotated[AdminDocumentService, Depends(get_admin_document_service)],
    search: Annotated[str | None, Query(min_length=1, max_length=200)] = None,
    document_status: Annotated[DocumentStatus | None, Query(alias="status")] = None,
    difficulty: Annotated[DocumentDifficulty | None, Query()] = None,
    topic: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    sort: Annotated[AdminDocumentSort, Query()] = AdminDocumentSort.NEWEST,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> DocumentListResponse:
    filters = AdminDocumentFilters(
        search=search, difficulty=difficulty, status=document_status, topic=topic
    )

    return service.list_documents(filters=filters, sort=sort, page=page, limit=limit)
