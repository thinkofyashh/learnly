from app.repositories import AdminDocumentFilters, AdminDocumentSort, DocumentRepository
from app.schemas import DocumentListResponse
from app.services.document import DocumentService


class AdminDocumentService:
    def __init__(self, repository: DocumentRepository, document_service: DocumentService) -> None:
        self.repository = repository
        self.document_service = document_service

    def list_documents(
        self, *, filters: AdminDocumentFilters, sort: AdminDocumentSort, limit: int, page: int
    ) -> DocumentListResponse:
        if page < 1:
            raise ValueError("page must be at least 1")
        if limit < 1:
            raise ValueError("limit must be at least 1")

        offset = (page - 1) * limit

        documents = self.repository.list_admin(
            filters=filters, sort=sort, limit=limit, offset=offset
        )

        total = self.repository.count_admin(filters=filters)

        pages = (total + limit - 1) // limit if total else 0

        return DocumentListResponse(
            items=[self.document_service.build_response(document) for document in documents],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )
