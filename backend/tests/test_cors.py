from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_allowed_origin_receives_cors_header() -> None:
    settings = Settings(cors_origins=["https://allowed.example"])

    client = TestClient(create_app(settings))

    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://allowed.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-allow-origin"] == "https://allowed.example"


def test_unknown_origin_does_not_receive_cors_header() -> None:
    settings = Settings(
        cors_origins=["https://allowed.example"],
    )
    client = TestClient(create_app(settings))

    response = client.get(
        "/api/v1/health",
        headers={
            "Origin": "https://unknown.example",
        },
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
