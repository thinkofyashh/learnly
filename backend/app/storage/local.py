import os
import shutil
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import BinaryIO

from app.storage.base import StorageBackend


class LocalStorage(StorageBackend):
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(exist_ok=True, parents=True)

    def save(self, *, storage_key: str, source: BinaryIO) -> None:
        target = self._resolve(storage_key)
        target.parent.mkdir(parents=True, exist_ok=True)

        temporary_path: Path | None = None

        try:
            with NamedTemporaryFile(
                dir=target.parent, prefix=f".{target.name}.", suffix=".tmp", mode="wb", delete=False
            ) as temporary_file:
                temporary_path = Path(temporary_file.name)
                shutil.copyfileobj(source, temporary_file)
                temporary_file.flush()
                os.fsync(temporary_file.fileno())

            if temporary_path is None:
                raise RuntimeError("Temporary file was not created")
            os.replace(temporary_path, target)
        except Exception:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            raise

    def open(self, storage_key: str) -> BinaryIO:
        return self._resolve(storage_key).open("rb")

    def exists(self, storage_key: str) -> bool:
        return self._resolve(storage_key).is_file()

    def delete(self, storage_key: str) -> None:
        self._resolve(storage_key).unlink(missing_ok=True)

    def _resolve(self, storage_key: str) -> Path:
        if not storage_key.strip():
            raise ValueError("Storage key cannot be empty")

        key_path = Path(storage_key)

        if key_path.is_absolute() or ".." in key_path.parts:
            raise ValueError("Invalid storage key")

        target = (self.root / key_path).resolve()

        if target == self.root or not target.is_relative_to(self.root):
            raise ValueError("Invalid storage key")

        return target
