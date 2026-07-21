from collections.abc import Generator
from typing import Never

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.session import get_db_session
from app.main import app

settings = get_settings()


engine = create_engine(settings.test_database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_test_db_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app.dependency_overrides[get_db_session] = get_test_db_session

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


def test_health_check_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check_returns_ready(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


class UnavailableSession:
    def execute(self, _statement: object) -> Never:
        raise OperationalError(
            statement="SELECT 1", params={}, orig=ConnectionError("Database Unavailable")
        )


def get_unavailable_db_session() -> Generator[UnavailableSession, None, None]:
    yield UnavailableSession()


def test_readiness_check_returns_503_when_database_is_unavailable(client: TestClient) -> None:
    app.dependency_overrides[get_db_session] = get_unavailable_db_session

    response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
