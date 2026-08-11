from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import Document, DocumentPage, DocumentStatus


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
