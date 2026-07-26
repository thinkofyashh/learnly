from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Document, DocumentStatus


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
