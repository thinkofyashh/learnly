import re
import unicodedata
from collections.abc import Callable

MAX_SLUG_LENGTH = 255


def slugify(value: str) -> str:
    normalized_value = unicodedata.normalize("NFKD", value)

    ascii_value = normalized_value.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")

    return slug or "document"


def generate_unique_slug(
    value: str,
    slug_exists: Callable[[str], bool],
) -> str:
    base_slug = slugify(value)[:MAX_SLUG_LENGTH].rstrip("-")
    candidate = base_slug
    suffix_number = 2

    while slug_exists(candidate):
        suffix = f"-{suffix_number}"
        prefix = base_slug[: MAX_SLUG_LENGTH - len(suffix)].rstrip("-")

        candidate = f"{prefix}{suffix}"
        suffix_number += 1

    return candidate
