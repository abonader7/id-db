import os
import sys
from datetime import date
from typing import Literal

import frontmatter
from pydantic import BaseModel, ValidationError, field_validator


class Schema(BaseModel):
    title: str
    date: date
    type: Literal["summary", "quiz", "notes", "reference"]
    subject: str
    year: int
    term: int
    prof: str
    contributor: str
    tags: list[str]
    language: Literal["ar", "en"]

    @field_validator("year")
    @classmethod
    def year_check(cls, v):
        if not (1 <= v <= 5):
            raise ValueError("year must be between 1 and 5")
        return v

    @field_validator("term")
    @classmethod
    def term_check(cls, v):
        if v not in (1, 2):
            raise ValueError("term must be 1 or 2")
        return v

    @field_validator("tags")
    @classmethod
    def tags_check(cls, v):
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError("tags cannot be empty")
        return v

    @field_validator("language")
    @classmethod
    def language_norm(cls, v):
        if v is None:
            raise ValueError("language is required")
        return v.lower()


def load_md(path):
    return frontmatter.load(path).metadata


def format_errors(err: ValidationError):
    return [f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in err.errors()]


def validate_file(path):
    if not os.path.exists(path):
        print(f"[FAIL] {path} (File not found)")
        return False, ["File not found"]

    try:
        meta = load_md(path)
        Schema(**meta)
        print(f"[OK] {path}")
        return True, None

    except ValidationError as e:
        errors = format_errors(e)
        print(f"[FAIL] {path}")
        for err in errors:
            print(" -", err)
        return False, errors
    except Exception as e:
        print(f"[FAIL] {path} (Unexpected error: {str(e)})")
        return False, [str(e)]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validation.py <file1> <file2> ...")
        sys.exit(0)

    files_to_validate = sys.argv[1:]
    rejected = 0

    for path in files_to_validate:
        if not path.endswith(".md"):
            continue
        ok, _ = validate_file(path)
        if not ok:
            rejected += 1

    if rejected > 0:
        print(f"\nValidation failed for {rejected} file(s).")
        sys.exit(1)
    else:
        print("\nAll files passed validation.")
        sys.exit(0)
