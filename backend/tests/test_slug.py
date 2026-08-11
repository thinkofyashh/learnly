import pytest

from app.services.slug import generate_unique_slug, slugify


@pytest.mark.parametrize(
    ("value", "expected_slug"),
    [
        ("Asyncio Fundamentals", "asyncio-fundamentals"),
        ("FastAPI & PostgreSQL!", "fastapi-postgresql"),
        ("Café RAG", "cafe-rag"),
        ("---", "document"),
    ],
)
def test_slugify_creates_url_safe_slug(
    value: str,
    expected_slug: str,
) -> None:
    assert slugify(value) == expected_slug


def test_generate_unique_slug_returns_available_base_slug() -> None:
    result = generate_unique_slug(
        "Asyncio Fundamentals",
        slug_exists=lambda slug: False,
    )

    assert result == "asyncio-fundamentals"


def test_generate_unique_slug_adds_incrementing_suffix() -> None:
    existing_slugs = {
        "asyncio-fundamentals",
        "asyncio-fundamentals-2",
    }

    result = generate_unique_slug(
        "Asyncio Fundamentals",
        slug_exists=existing_slugs.__contains__,
    )

    assert result == "asyncio-fundamentals-3"
