from dataclasses import dataclass
from math import ceil
from typing import Any, BinaryIO, cast

import pymupdf

WORDS_PER_MINUTE = 200


class PdfExtractionError(RuntimeError):
    """Raised when text cannot be extracted from a PDF."""


@dataclass(frozen=True, slots=True)
class ExtractedPage:
    page_number: int
    text: str


@dataclass(frozen=True, slots=True)
class ExtractedDocument:
    pages: tuple[ExtractedPage, ...]
    page_count: int
    total_words: int
    estimated_reading_minutes: int


def estimate_reading_minutes(total_words: int) -> int:
    if total_words < 0:
        raise ValueError("Total words cannot be negative")

    return max(1, ceil(total_words / WORDS_PER_MINUTE))


class PdfExtractor:
    def extract(self, source: BinaryIO) -> ExtractedDocument:
        document: Any | None = None
        try:
            source.seek(0)
            pdf_content = source.read()

            document = cast(
                Any,
                pymupdf.open(  # type: ignore[no-untyped-call]
                    stream=pdf_content,
                    filetype="pdf",
                ),
            )

            if document.needs_pass:
                raise PdfExtractionError("Password-protected PDFs are not supported")

            if document.page_count < 1:
                raise PdfExtractionError("PDF must contain at least one page")

            pages: list[ExtractedPage] = []
            total_words = 0

            for page_number, page in enumerate(document, start=1):
                text = str(page.get_text("text", sort=True)).strip()

                pages.append(ExtractedPage(page_number=page_number, text=text))

                total_words += len(text.split())

            return ExtractedDocument(
                pages=tuple(pages),
                page_count=len(pages),
                total_words=total_words,
                estimated_reading_minutes=estimate_reading_minutes(total_words=total_words),
            )
        except PdfExtractionError:
            raise
        except Exception as error:
            raise PdfExtractionError("PDF text extraction failed") from error
        finally:
            if document is not None:
                document.close()
            source.seek(0)
