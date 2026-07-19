import pytest
from pydantic_settings import SettingsConfigDict

from app.core.config import Settings


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


def test_settings_read_environment_overrides(monkeypatch: pytest.MonkeyPatch) -> None:

    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("API_V1_PREFIX", "/customs/v2")
    monkeypatch.setenv("CORS_ORIGINS", '["https://example.com"]')

    settings = IsolatedSettings()

    assert settings.app_env == "test"
    assert settings.api_v1_prefix == "/customs/v2"
    assert settings.cors_origins == ["https://example.com"]
