from io import BytesIO
from typing import Any

import pymupdf
import pytest

from app.services.pdf_extraction import (
    PdfExtractionError,
    PdfExtractor,
    estimate_reading_minutes,
)


def create_pdf(page_texts: list[str]) -> BytesIO:
    document: Any = pymupdf.open()  # type: ignore[no-untyped-call]

    try:
        for text in page_texts:
            page = document.new_page()

            if text:
                page.insert_text(
                    (72, 72),
                    text,
                )

        return BytesIO(document.tobytes())

    finally:
        document.close()


def test_pdf_extractor_extracts_text_from_every_page() -> None:
    source = create_pdf(
        [
            "First Page Text",
            "Second Page Text",
        ]
    )

    result = PdfExtractor().extract(source)

    assert result.page_count == 2
    assert result.total_words == 6
    assert result.estimated_reading_minutes == 1
    assert result.pages[0].page_number == 1
    assert result.pages[0].text == "First Page Text"
    assert result.pages[1].page_number == 2
    assert result.pages[1].text == "Second Page Text"

    assert source.tell() == 0


def test_pdf_extractor_preserves_empty_pages() -> None:
    source = create_pdf([""])

    result = PdfExtractor().extract(source)

    assert result.page_count == 1
    assert len(result.pages) == 1
    assert result.pages[0].page_number == 1
    assert result.pages[0].text == ""


def test_pdf_extractor_rejects_corrupted_pdf() -> None:
    source = BytesIO(b"%PDF-1.7\nThis is corrupted")

    with pytest.raises(PdfExtractionError):
        PdfExtractor().extract(source)

    assert source.tell() == 0


@pytest.mark.parametrize(
    ("total_words", "expected_minutes"), [(0, 1), (1, 1), (200, 1), (201, 2), (400, 2)]
)
def test_estimate_reading_minutes(total_words: int, expected_minutes: int) -> None:
    assert estimate_reading_minutes(total_words) == expected_minutes
