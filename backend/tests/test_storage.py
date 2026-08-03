from io import BytesIO
from pathlib import Path
from typing import BinaryIO, cast

import pytest

from app.storage.local import LocalStorage


def test_local_storage_saves_opens_and_deletes_file(tmp_path: Path) -> None:
    storage = LocalStorage(tmp_path)
    storage_key = "documents/test.pdf"
    content = b"%PDF-1.7 test content"

    storage.save(storage_key=storage_key, source=BytesIO(content))

    assert storage.exists(storage_key=storage_key)

    with storage.open(storage_key=storage_key) as stored_file:
        assert stored_file.read() == content

    assert list(tmp_path.rglob("*tmp")) == []

    storage.delete(storage_key=storage_key)

    assert not storage.exists(storage_key=storage_key)


@pytest.mark.parametrize(
    "storage_key",
    [
        "",
        " ",
        ".",
        "../.env",
        "documents/../../.env",
        "/tmp/file.pdf",
    ],
)
def test_local_storage_rejects_invalid_keys(tmp_path: Path, storage_key: str) -> None:
    storage = LocalStorage(tmp_path)

    with pytest.raises(ValueError):
        storage.exists(storage_key=storage_key)


class BrokenStream:
    def read(self, _size: int = -1) -> bytes:
        raise OSError("Simulated read failure")


def test_local_storage_removes_temporary_file_after_failure(tmp_path: Path) -> None:
    storage = LocalStorage(tmp_path)
    source = cast(BinaryIO, BrokenStream())

    with pytest.raises(OSError):
        storage.save(storage_key="documents/failure.pdf", source=source)

    assert not storage.exists(storage_key="documents/failure.pdf")
    assert list(tmp_path.rglob("*.tmp")) == []
