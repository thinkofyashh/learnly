from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.main import app
from app.models import Document, DocumentDifficulty, DocumentStatus
from app.repositories import AdminDocumentFilters, AdminDocumentSort, DocumentRepository
from app.services import AdminDocumentService, DocumentService


@pytest.fixture
def admin_api_client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_db_session() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = override_db_session

    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    settings = get_settings()
    engine = create_engine(settings.test_database_url)
    connection = engine.connect()
    transaction = connection.begin()

    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    try:
        yield session
    finally:
        session.close()

        if transaction.is_active:
            transaction.rollback()

        connection.close()
        engine.dispose()


def create_document(
    *,
    session: Session,
    filename: str,
    checksum_character: str,
    title: str,
    description: str,
    status: DocumentStatus,
    difficulty: DocumentDifficulty,
    topics: list[str],
) -> Document:
    document = Document(
        original_filename=filename,
        storage_key=f"tests/admin/{filename}",
        mime_type="application/pdf",
        checksum_sha256=checksum_character * 64,
        size_bytes=1024,
        title=title,
        description=description,
        status=status,
        difficulty=difficulty,
        topics=topics,
    )

    session.add(document)
    session.flush()

    return document


def test_admin_document_filters_use_optional_defaults() -> None:
    filters = AdminDocumentFilters()

    assert filters.search is None
    assert filters.status is None
    assert filters.difficulty is None
    assert filters.topic is None


def test_admin_document_filters_store_requested_values() -> None:
    filters = AdminDocumentFilters(
        search="FastAPI",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topic="Python",
    )

    assert filters.search == "FastAPI"
    assert filters.status == DocumentStatus.PUBLISHED
    assert filters.difficulty == DocumentDifficulty.INTERMEDIATE
    assert filters.topic == "Python"


def test_admin_repository_applies_combined_filters(
    db_session: Session,
) -> None:
    matching_document = create_document(
        session=db_session,
        filename="fastapi-guide.pdf",
        checksum_character="a",
        title="FastAPI Fundamentals",
        description="Build Python APIs",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["Python", "FastAPI"],
    )

    create_document(
        session=db_session,
        filename="postgres-guide.pdf",
        checksum_character="b",
        title="PostgreSQL Fundamentals",
        description="Learn relational databases",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["PostgreSQL"],
    )

    create_document(
        session=db_session,
        filename="fastapi-draft.pdf",
        checksum_character="c",
        title="FastAPI Draft",
        description="Unpublished API notes",
        status=DocumentStatus.UPLOADED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["Python", "FastAPI"],
    )

    repository = DocumentRepository(db_session)
    filters = AdminDocumentFilters(
        search="fastapi",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topic="FastAPI",
    )

    documents = repository.list_admin(
        filters=filters,
        sort=AdminDocumentSort.NEWEST,
        offset=0,
        limit=10,
    )

    assert [document.id for document in documents] == [matching_document.id]
    assert repository.count_admin(filters=filters) == 1


def test_admin_repository_sorts_and_paginates_documents(
    db_session: Session,
) -> None:
    create_document(
        session=db_session,
        filename="zulu.pdf",
        checksum_character="d",
        title="Zulu",
        description="Third title",
        status=DocumentStatus.UPLOADED,
        difficulty=DocumentDifficulty.BEGINNER,
        topics=[],
    )

    middle_document = create_document(
        session=db_session,
        filename="bravo.pdf",
        checksum_character="e",
        title="Bravo",
        description="Second title",
        status=DocumentStatus.PROCESSING,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=[],
    )

    create_document(
        session=db_session,
        filename="alpha.pdf",
        checksum_character="f",
        title="Alpha",
        description="First title",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.ADVANCED,
        topics=[],
    )

    repository = DocumentRepository(db_session)

    documents = repository.list_admin(
        filters=AdminDocumentFilters(),
        sort=AdminDocumentSort.TITLE_ASC,
        offset=1,
        limit=1,
    )

    assert [document.id for document in documents] == [middle_document.id]
    assert repository.count_admin(filters=AdminDocumentFilters()) == 3


def test_admin_service_builds_paginated_response(db_session: Session) -> None:
    create_document(
        session=db_session,
        filename="alpha.pdf",
        checksum_character="g",
        title="Alpha",
        description="First document",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.BEGINNER,
        topics=["Python"],
    )
    create_document(
        session=db_session,
        filename="bravo.pdf",
        checksum_character="h",
        title="Bravo",
        description="Second document",
        status=DocumentStatus.PROCESSING,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["FastAPI"],
    )
    final_document = create_document(
        session=db_session,
        filename="zulu.pdf",
        checksum_character="i",
        title="Zulu",
        description="Third document",
        status=DocumentStatus.FAILED,
        difficulty=DocumentDifficulty.ADVANCED,
        topics=["PostgreSQL"],
    )
    repository = DocumentRepository(db_session)

    service = AdminDocumentService(
        repository=repository,
        document_service=DocumentService(repository=repository, api_prefix="/api/v1"),
    )

    response = service.list_documents(
        filters=AdminDocumentFilters(), sort=AdminDocumentSort.TITLE_ASC, page=2, limit=2
    )

    assert response.limit == 2
    assert response.total == 3
    assert response.page == 2
    assert response.pages == 2
    assert len(response.items) == 1
    assert response.items[0].id == final_document.id
    assert response.items[0].title == "Zulu"
    assert response.items[0].preview_url == (f"/api/v1/documents/{final_document.id}/preview")


def test_admin_service_gets_document_by_id(db_session: Session) -> None:
    document = create_document(
        session=db_session,
        filename="review.pdf",
        checksum_character="p",
        title="Review document",
        description="Administrative detail",
        status=DocumentStatus.FAILED,
        difficulty=DocumentDifficulty.BEGINNER,
        topics=[],
    )
    repository = DocumentRepository(db_session)
    service = AdminDocumentService(
        repository=repository,
        document_service=DocumentService(repository=repository, api_prefix="/api/v1"),
    )

    response = service.get_document(document_id=document.id)

    assert response is not None
    assert response.id == document.id
    assert response.status == DocumentStatus.FAILED
    assert service.get_document(document_id=999999) is None


@pytest.mark.parametrize(
    ("page", "limit"),
    [
        (0, 10),
        (1, 0),
    ],
)
def test_admin_service_rejects_invalid_pagination(
    db_session: Session,
    page: int,
    limit: int,
) -> None:
    repository = DocumentRepository(db_session)

    service = AdminDocumentService(
        repository=repository,
        document_service=DocumentService(
            repository=repository,
            api_prefix="/api/v1",
        ),
    )

    with pytest.raises(ValueError):
        service.list_documents(
            filters=AdminDocumentFilters(),
            sort=AdminDocumentSort.NEWEST,
            page=page,
            limit=limit,
        )


def test_admin_endpoint_returns_all_document_statuses(
    admin_api_client: TestClient,
    db_session: Session,
) -> None:
    create_document(
        session=db_session,
        filename="zulu.pdf",
        checksum_character="j",
        title="Zulu",
        description="Uploaded document",
        status=DocumentStatus.UPLOADED,
        difficulty=DocumentDifficulty.BEGINNER,
        topics=[],
    )

    create_document(
        session=db_session,
        filename="alpha.pdf",
        checksum_character="k",
        title="Alpha",
        description="Published document",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["Python"],
    )

    create_document(
        session=db_session,
        filename="bravo.pdf",
        checksum_character="l",
        title="Bravo",
        description="Failed document",
        status=DocumentStatus.FAILED,
        difficulty=DocumentDifficulty.ADVANCED,
        topics=["FastAPI"],
    )

    response = admin_api_client.get("/api/v1/admin/documents?sort=title_asc&page=1&limit=2")

    assert response.status_code == 200

    body = response.json()

    assert body["total"] == 3
    assert body["page"] == 1
    assert body["limit"] == 2
    assert body["pages"] == 2
    assert [item["title"] for item in body["items"]] == [
        "Alpha",
        "Bravo",
    ]


def test_admin_detail_endpoint_returns_any_status(
    admin_api_client: TestClient,
    db_session: Session,
) -> None:
    document = create_document(
        session=db_session,
        filename="private-review.pdf",
        checksum_character="q",
        title="Private review",
        description="Unpublished document",
        status=DocumentStatus.UPLOADED,
        difficulty=DocumentDifficulty.BEGINNER,
        topics=[],
    )

    response = admin_api_client.get(f"/api/v1/admin/documents/{document.id}")
    missing_response = admin_api_client.get("/api/v1/admin/documents/999999")

    assert response.status_code == 200
    assert response.json()["id"] == document.id
    assert response.json()["status"] == "uploaded"
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Document not found"


@pytest.mark.parametrize(
    "query",
    [
        "status=unknown",
        "difficulty=expert",
        "sort=unsafe",
        "page=0",
        "limit=101",
        "search=",
    ],
)
def test_admin_endpoint_rejects_invalid_queries(
    admin_api_client: TestClient,
    query: str,
) -> None:
    response = admin_api_client.get(f"/api/v1/admin/documents?{query}")

    assert response.status_code == 422


def test_admin_endpoint_applies_combined_filters(
    admin_api_client: TestClient,
    db_session: Session,
) -> None:
    matching_document = create_document(
        session=db_session,
        filename="fastapi-production.pdf",
        checksum_character="m",
        title="FastAPI Production",
        description="Deploy reliable Python APIs",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["Python", "FastAPI"],
    )

    create_document(
        session=db_session,
        filename="fastapi-draft.pdf",
        checksum_character="n",
        title="FastAPI Draft",
        description="Unpublished API notes",
        status=DocumentStatus.UPLOADED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["Python", "FastAPI"],
    )

    create_document(
        session=db_session,
        filename="postgres-production.pdf",
        checksum_character="o",
        title="PostgreSQL Production",
        description="Database operations",
        status=DocumentStatus.PUBLISHED,
        difficulty=DocumentDifficulty.INTERMEDIATE,
        topics=["PostgreSQL"],
    )

    response = admin_api_client.get(
        "/api/v1/admin/documents",
        params={
            "search": "FASTAPI",
            "status": "published",
            "difficulty": "intermediate",
            "topic": "FastAPI",
            "sort": "title_asc",
            "page": 1,
            "limit": 10,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["total"] == 1
    assert body["pages"] == 1
    assert [item["id"] for item in body["items"]] == [matching_document.id]
