from __future__ import annotations

import sys
from datetime import date
from pathlib import Path
from typing import Any, Literal

import frontmatter
from pydantic import BaseModel, Field, ValidationError, field_validator

LEVEL_MIN = 1
LEVEL_MAX = 5
TERM_VALUES = {1, 2}
VALID_LANGUAGES = {"ar", "en"}
VALID_TYPES = {"summary", "quiz", "notes", "reference"}


class Schema(BaseModel):
    title: str = Field(min_length=1)
    date: date
    type: Literal["summary", "quiz", "notes", "reference"]
    subject: str = Field(min_length=1)
    level: int
    term: int
    prof: str = Field(min_length=1)
    contributor: str = Field(min_length=1)
    tags: list[str]
    language: Literal["ar", "en"]

    @field_validator("title", "subject", "prof", "contributor")
    @classmethod
    def _strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("field cannot be empty")
        return stripped

    @field_validator("level")
    @classmethod
    def _check_level(cls, value: int) -> int:
        if not LEVEL_MIN <= value <= LEVEL_MAX:
            raise ValueError(f"level must be between {LEVEL_MIN} and {LEVEL_MAX}")
        return value

    @field_validator("term")
    @classmethod
    def _check_term(cls, value: int) -> int:
        if value not in TERM_VALUES:
            raise ValueError("term must be 1 or 2")
        return value

    @field_validator("tags")
    @classmethod
    def _check_tags(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("tags cannot be empty")

        normalized: list[str] = []
        for tag in value:
            if not isinstance(tag, str):
                raise TypeError("tags must contain only strings")
            stripped = tag.strip()
            if not stripped:
                raise ValueError("tags must be non-empty strings")
            normalized.append(stripped)
        return normalized

    @field_validator("language")
    @classmethod
    def _normalize_language(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_LANGUAGES:
            raise ValueError("language must be 'ar' or 'en'")
        return normalized

    @field_validator("type")
    @classmethod
    def _check_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_TYPES:
            raise ValueError("type must be summary, quiz, notes, or reference")
        return normalized


def load_md(path: Path) -> dict[str, Any]:
    post = frontmatter.load(path)
    metadata = post.metadata
    if not isinstance(metadata, dict):
        raise ValueError("frontmatter metadata must be a mapping")
    return metadata


def format_errors(err: ValidationError) -> list[str]:
    formatted: list[str] = []
    for item in err.errors():
        location = ".".join(str(part) for part in item.get("loc", ()))
        message = item.get("msg", "validation error")
        if location:
            formatted.append(f"{location}: {message}")
        else:
            formatted.append(message)
    return formatted


def validate_file(path: Path) -> tuple[bool, list[str]]:
    if not path.exists():
        message = "File not found"
        print(f"[FAIL] {path} ({message})")
        return False, [message]

    if path.suffix.lower() != ".md":
        print(f"[SKIP] {path} (not a markdown file)")
        return True, []

    try:
        metadata = load_md(path)
        Schema.model_validate(metadata)
        print(f"[OK] {path}")
        return True, []
    except ValidationError as err:
        errors = format_errors(err)
        print(f"[FAIL] {path}")
        for error in errors:
            print(f" - {error}")
        return False, errors
    except Exception as err:
        message = f"Unexpected error: {err}"
        print(f"[FAIL] {path} ({message})")
        return False, [message]


def iter_markdown_files(paths: list[str]) -> list[Path]:
    markdown_files: list[Path] = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.suffix.lower() == ".md":
            markdown_files.append(path)
    return markdown_files


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: python validation.py <file1> <file2> ...")
        return 1

    files_to_validate = iter_markdown_files(argv[1:])
    if not files_to_validate:
        print("No markdown files provided for validation.")
        return 0

    rejected = 0
    for path in files_to_validate:
        ok, _ = validate_file(path)
        if not ok:
            rejected += 1

    if rejected > 0:
        print(f"\nValidation failed for {rejected} file(s).")
        return 1

    print("\nAll files passed validation.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
