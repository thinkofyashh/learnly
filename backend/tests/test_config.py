from pathlib import Path

import pytest
from pydantic_settings import SettingsConfigDict

from app.core.config import BACKEND_ROOT, Settings


class IsolatedSettings(Settings):
    model_config = SettingsConfigDict(env_file=None)


def test_settings_use_safe_defaults() -> None:
    settings = IsolatedSettings()

    assert settings.app_env == "development"
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.cors_origins == [
        "http://localhost:3000",
        "http://localhost:3001",
    ]
    assert settings.database_url == (
        "postgresql+psycopg://learnly:change_me@localhost:5432/learnly"
    )
    assert settings.test_database_url == (
        "postgresql+psycopg://learnly:change_me@localhost:5432/learnly_test"
    )
    assert settings.storage_root == BACKEND_ROOT / "storage"
    assert settings.max_upload_bytes == 25 * 1024 * 1024


def test_settings_read_environment_overrides(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:

    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("API_V1_PREFIX", "/customs/v2")
    monkeypatch.setenv("CORS_ORIGINS", '["https://example.com"]')
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://test:test@localhost:5432/test_db",
    )
    monkeypatch.setenv(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://test:test@localhost:5432/test_db_test",
    )
    custom_storage_root = tmp_path / "uploads"

    monkeypatch.setenv("STORAGE_ROOT", str(custom_storage_root))
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "1048576")

    settings = IsolatedSettings()

    assert settings.app_env == "test"
    assert settings.api_v1_prefix == "/customs/v2"
    assert settings.cors_origins == ["https://example.com"]
    assert settings.database_url == ("postgresql+psycopg://test:test@localhost:5432/test_db")
    assert settings.test_database_url == (
        "postgresql+psycopg://test:test@localhost:5432/test_db_test"
    )
    assert settings.storage_root == custom_storage_root
    assert settings.max_upload_bytes == 1048576
