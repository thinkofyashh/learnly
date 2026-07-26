from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.models import DocumentDifficulty, DocumentStatus


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)

    id: int
    slug: str | None
    original_filename: str
    title: str | None
    description: str | None
    status: DocumentStatus
    processing_error: str | None
    thumbnail_url: str | None = None
    preview_url: str | None = None
    download_url: str | None = None
    topics: list[str]
    tags: list[str]
    key_takeaways: list[str]
    prerequisites: list[str]
    difficulty: DocumentDifficulty | None
    estimated_reading_minutes: int | None
    page_count: int | None
    size_bytes: int
    view_count: int
    download_count: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class DocumentListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    items: list[DocumentResponse]
    total: int
    page: int
    limit: int
    pages: int
