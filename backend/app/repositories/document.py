from dataclasses import dataclass
from enum import StrEnum

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.models import Document, DocumentDifficulty, DocumentPage, DocumentStatus


@dataclass(frozen=True, slots=True)
class AdminDocumentFilters:
    search: str | None = None
    difficulty: DocumentDifficulty | None = None
    status: DocumentStatus | None = None
    topic: str | None = None


class AdminDocumentSort(StrEnum):
    NEWEST = "newest"
    OLDEST = "oldest"
    TITLE_ASC = "title_asc"
    TITLE_DESC = "title_desc"


class DocumentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_published(self, *, offset: int, limit: int) -> list[Document]:
        statement = (
            select(Document)
            .where(Document.status == DocumentStatus.PUBLISHED)
            .order_by(Document.published_at.desc().nulls_last(), Document.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.session.scalars(statement).all())

    def count_published(self) -> int:
        statement = (
            select(func.count())
            .select_from(Document)
            .where(Document.status == DocumentStatus.PUBLISHED)
        )

        return self.session.scalar(statement) or 0

    def get_published_by_slug(self, slug: str) -> Document | None:
        statement = select(Document).where(
            Document.status == DocumentStatus.PUBLISHED, Document.slug == slug
        )
        return self.session.scalars(statement).one_or_none()

    def add(self, document: Document) -> Document:
        self.session.add(document)
        self.session.flush()

        return document

    def get_by_id(self, document_id: int) -> Document | None:
        return self.session.get(Document, document_id)

    def replace_pages(self, *, document_id: int, pages: list[DocumentPage]) -> None:
        delete_statement = delete(DocumentPage).where(DocumentPage.document_id == document_id)

        self.session.execute(delete_statement)
        self.session.add_all(pages)
        self.session.flush()

    def slug_exists(self, slug: str) -> bool:
        statement = select(Document.id).where(Document.slug == slug).limit(1)
        return self.session.scalar(statement) is not None

    def _admin_conditions(self, filters: AdminDocumentFilters) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = []

        search = filters.search.strip() if filters.search else ""

        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    Document.title.ilike(search_pattern),
                    Document.description.ilike(search_pattern),
                    Document.original_filename.ilike(search_pattern),
                )
            )

        if filters.status is not None:
            conditions.append(Document.status == filters.status)

        if filters.difficulty is not None:
            conditions.append(Document.difficulty == filters.difficulty)

        topic = filters.topic.strip() if filters.topic else ""

        if topic:
            conditions.append(Document.topics.contains([topic]))

        return conditions

    def list_admin(
        self,
        *,
        filters: AdminDocumentFilters,
        sort: AdminDocumentSort,
        offset: int,
        limit: int,
    ) -> list[Document]:
        conditions = self._admin_conditions(filters)

        statement = select(Document).where(*conditions)

        if sort == AdminDocumentSort.OLDEST:
            statement = statement.order_by(Document.created_at.asc(), Document.id.asc())

        elif sort == AdminDocumentSort.NEWEST:
            statement = statement.order_by(Document.created_at.desc(), Document.id.desc())

        elif sort == AdminDocumentSort.TITLE_ASC:
            statement = statement.order_by(Document.title.asc().nulls_last(), Document.id.asc())

        elif sort == AdminDocumentSort.TITLE_DESC:
            statement = statement.order_by(
                Document.title.desc().nulls_last(),
                Document.id.desc(),
            )

        else:
            statement = statement.order_by(
                Document.created_at.desc(),
                Document.id.desc(),
            )

        statement = statement.offset(offset=offset).limit(limit=limit)

        return list(self.session.scalars(statement).all())

    def count_admin(
        self,
        *,
        filters: AdminDocumentFilters,
    ) -> int:
        conditions = self._admin_conditions(filters)

        statement = select(func.count()).select_from(Document).where(*conditions)

        return self.session.scalar(statement) or 0
