from typing import Any, cast

import pymupdf


def make_pdf_bytes(text: str = "Learnly test document") -> bytes:
    document = cast(Any, pymupdf.open())  # type: ignore[no-untyped-call]

    try:
        page = document.new_page()
        page.insert_text((72, 72), text)

        return bytes(document.tobytes())
    finally:
        document.close()


def make_password_protected_pdf_bytes() -> bytes:
    document = cast(Any, pymupdf.open())  # type: ignore[no-untyped-call]
    pymupdf_api = cast(Any, pymupdf)

    try:
        document.new_page()

        return bytes(
            document.tobytes(
                encryption=pymupdf_api.PDF_ENCRYPT_AES_256,
                owner_pw="learnly-owner",
                user_pw="learnly-user",
            )
        )
    finally:
        document.close()
