from app.models import Document
from app.repositories import DocumentRepository
from app.schemas import DocumentListResponse, DocumentResponse


class DocumentService:
    def __init__(self, repository: DocumentRepository, api_prefix: str) -> None:
        self.repository = repository
        self.api_prefix = api_prefix.rstrip("/")

    def list_published(self, *, limit: int, page: int) -> DocumentListResponse:
        if page < 1:
            raise ValueError("page must be at least 1")
        if limit < 1:
            raise ValueError("limit must be at least 1")

        offset = (page - 1) * limit

        documents = self.repository.list_published(offset=offset, limit=limit)
        total = self.repository.count_published()
        pages = (total + limit - 1) // limit if total else 0

        return DocumentListResponse(
            items=[self._build_response(document) for document in documents],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    def get_published_by_slug(self, slug: str) -> DocumentResponse | None:
        document = self.repository.get_published_by_slug(slug=slug)

        if document is None:
            return None

        return self._build_response(document)

    def _build_response(self, document: Document) -> DocumentResponse:
        base_url = f"{self.api_prefix}/documents/{document.id}"

        return DocumentResponse.model_validate(document).model_copy(
            update={
                "thumbnail_url": (
                    f"{base_url}/thumbnail" if document.thumbnail_storage_key else None
                ),
                "preview_url": f"{base_url}/preview",
                "download_url": f"{base_url}/download",
            }
        )
