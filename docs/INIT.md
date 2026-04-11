# College Knowledge Base

**Version:** 0.1.0
**Status:** Draft
**Authors:** ID-Brains 'Khaled'
**Last Updated:** 2026-04-11

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [System Architecture](#3-system-architecture)
4. [Content Schema and Validation](#4-content-schema-and-validation)
5. [Contribution Flows](#5-contribution-flows)
   - 5.1 [PR-Based Flow](#51-pr-based-flow)
   - 5.2 [Web Form Flow](#52-web-form-flow)
6. [Automation Pipeline](#6-automation-pipeline)
7. [Moderation and Governance](#7-moderation-and-governance)
8. [Comments and Discussion Layer](#8-comments-and-discussion-layer)
9. [Search](#9-search)
10. [File and Asset Storage](#10-file-and-asset-storage)
11. [Open Questions](#11-open-questions)
12. [Roadmap](#12-roadmap)

---

## 1. Overview

A community-driven, open-source knowledge base for college students. The platform allows any student to contribute lecture notes, summaries, past exam questions, and corrections. GitHub serves as the single source of truth for all content and collaboration. The system is designed to be free to run indefinitely, with zero dependency on a paid backend.

---

## 2. Goals and Non-Goals

### Goals

- Allow any student to contribute content, regardless of Git knowledge.
- Enforce a consistent content structure (schema) across all contributions.
- Automate text extraction from uploaded binary files (PDF, DOCX) into searchable Markdown.
- Provide a threaded discussion layer per content page without a separate backend.
- Make the platform maintainable by a small volunteer team with minimal ops overhead.

### Non-Goals

- This is not a real-time collaboration tool (no Google Docs-style co-editing).
- This is not a grading or assessment platform.
- This is not a file hosting CDN. Large binary files are linked externally or stored via Git LFS with clear size limits.
- Authentication is not custom-built. GitHub OAuth is the only supported identity provider.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Students                             │
│           (Browser - no install required)                   │
└────────────┬──────────────────────────┬────────────────────┘
             │                          │
     Web Form (Next.js)          Direct PR (Git)
             │                          │
             ▼                          ▼
┌────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐ │
│  │  /content   │  │  GitHub       │  │  GitHub          │ │
│  │  (Markdown) │  │  Actions      │  │  Discussions     │ │
│  └─────────────┘  └───────┬───────┘  └──────────────────┘ │
│                            │                                │
│              ┌─────────────▼──────────────┐                │
│              │  Automation Workers         │                │
│              │  - Schema validation        │                │
│              │  - textract (PDF -> MD)     │                │
│              │  - PR auto-labeling         │                │
│              └────────────────────────────┘                │
└─────────────────────────────┬──────────────────────────────┘
                              │ GitHub Pages deploy
                              ▼
              ┌───────────────────────────────┐
              │   Static Site (Docusaurus)    │
              │   + Giscus comments widget    │
              └───────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Responsibility |
|---|---|---|
| Static Site | Docusaurus v3 | Renders all content, navigation, search |
| Content Store | GitHub repo (`/content`) | Single source of truth for all Markdown |
| Web Form | Next.js (static export) | Non-technical contribution UI |
| CI Automation | GitHub Actions | Validation, extraction, deployment |
| Comments | Giscus | Per-page discussions via GitHub Discussions |
| Hosting | GitHub Pages | Free, zero-ops static hosting |
| Asset Storage | Git LFS / external links | PDFs and images above size threshold |

---

## 4. Content Schema and Validation

### 4.1 Directory Structure

```
/content
  /year-1
    /term-1
      /math-101
        /lectures
          lecture-01.md
        /summaries
          summary-01.md
        /exams
          midterm-2025.md
  /year-2
    ...
```

Rules:
- Directory names are lowercase, hyphenated slugs.
- No spaces, no Arabic characters in file or directory names (use transliteration for slugs; Arabic goes inside the file only).
- Every leaf directory must contain at least one `.md` file to be included in the build.

### 4.2 Frontmatter Schema

Every Markdown file must begin with the following YAML frontmatter block:

```markdown
---
title: "ملخص محاضرة المعالجات 1"
date: "2026-04-11"            # ISO 8601, required
type: "lecture"               # enum: lecture | summary | exam | notes
subject: "microprocessors"    # slug, must match parent directory name
year: 3                       # integer: 1-5
term: 1                       # integer: 1 or 2
prof: "د. أحمد علي"         # string, required
contributor: "github_username" # GitHub username, required
tags: ["CSE", "Microprocessors"]  # array of strings, at least one required
language: "ar"                # ISO 639-1: "ar" or "en"
---
```

### 4.3 Schema Validation

Validation runs on every PR via a GitHub Actions job before merge is allowed.

**Validator behavior:**

| Condition | Action |
|---|---|
| Missing required field | Fail CI, post comment listing the missing fields |
| `type` not in allowed enum | Fail CI |
| `subject` slug does not match directory | Fail CI |
| `date` not valid ISO 8601 | Fail CI |
| `tags` array is empty | Fail CI |
| All checks pass | Label PR as `schema-valid` |

**Implementation:** A Python script (`scripts/validate_schema.py`) using `python-frontmatter` and `pydantic` for schema enforcement. Runs as a required status check - PRs cannot be merged without it passing.

```
# scripts/validate_schema.py  (interface only, implementation TBD)
# Input:  list of changed .md files from git diff
# Output: exit 0 (pass) or exit 1 with structured error messages
```

---

## 5. Contribution Flows

### 5.1 PR-Based Flow

For students and maintainers comfortable with Git.

```
Fork repo
  └── Create branch: contrib/your-subject-filename
        └── Add file at correct path with valid frontmatter
              └── Open Pull Request
                    └── CI runs schema validation + textract if binary attached
                          └── Maintainer reviews and merges
                                └── GitHub Actions deploys to GitHub Pages
```

PR title convention: `[YEAR-TERM] Subject: Short description`
Example: `[Y3-T1] Microprocessors: Lecture 01 Summary`

### 5.2 Web Form Flow

For students with no Git knowledge. This is the primary onboarding path.

#### Authentication

The student authenticates with GitHub OAuth via the web form app. The app requests the minimum required scope: `public_repo` (to open PRs on their behalf). No bot tokens are used - contributions are always attributed to the real student's GitHub account.

> **Decision point for team:** If requiring a GitHub account is too much friction, an alternative is a server-side bot token that opens PRs on behalf of an anonymous user, with the student's name stored only in the frontmatter `contributor` field. This trades attribution accuracy for accessibility. **This needs a team decision before implementation.**

#### Form Fields

| Field | Input Type | Maps to Frontmatter |
|---|---|---|
| المادة (Subject) | Dropdown (populated from repo) | `subject`, `year`, `term` |
| نوع المحتوى | Dropdown | `type` |
| اسم الدكتور | Text | `doctor` |
| العنوان | Text | `title` |
| المحتوى | Rich text editor (Markdown) OR file upload (.pdf, .docx) | Body or triggers textract |
| Tags | Multi-select | `tags` |

#### Submission Flow

```
Student fills form
  └── Clicks "إرسال"
        └── Frontend calls GitHub API (authenticated as student)
              └── Creates a new branch on the repo: contrib/form/username-timestamp
                    └── Commits the .md file (or raw uploaded binary) to that branch
                          └── Opens a Pull Request with auto-generated title and description
                                └── CI picks up from here (same as PR flow)
```

#### Hosted Form Location

The form is a Next.js static export deployed to GitHub Pages on a separate path (`/contribute`) or as a separate repo under the same GitHub organization. It has no server-side runtime - all GitHub API calls are made from the browser using the student's OAuth token stored in `sessionStorage` (cleared on tab close).

---

## 6. Automation Pipeline

All automation runs via GitHub Actions. No external CI service.

### 6.1 Workflows Overview

| Workflow File | Trigger | Jobs |
|---|---|---|
| `validate.yml` | PR opened or updated | Schema validation |
| `extract.yml` | PR opened with binary file | textract, commit Markdown output |
| `deploy.yml` | Push to `main` | Build Docusaurus, deploy to GitHub Pages |
| `label.yml` | PR opened | Auto-label by subject/year/type |

### 6.2 Text Extraction Workflow (`extract.yml`)

**Trigger:** A PR is opened or updated and the diff contains a `.pdf` or `.docx` file.

**Steps:**

```
1. Checkout PR branch
2. Detect changed binary files (pdf, docx)
3. For each binary:
   a. Run textract to extract raw text
   b. If extraction succeeds:
      - Wrap text in a Markdown template with empty frontmatter
      - Commit the .md file alongside the binary with message: "chore: auto-extracted markdown from [filename]"
      - Post PR comment: "Auto-extraction succeeded. Please review and fill in the frontmatter fields."
   c. If extraction fails (scanned PDF / image-based):
      - Post PR comment: "Could not extract text from [filename]. This file appears to be image-based.
        Please either provide a text-based PDF or paste the content directly as Markdown."
      - Label PR: `needs-manual-extraction`
      - Do not fail CI - the PR remains open for manual handling
4. Re-run schema validation on any newly committed .md files
```

**Scanned PDF handling:** textract will be attempted first. If output is empty or below a minimum character threshold (configurable, default: 100 chars), the workflow falls back to the failure path above. OCR via `tesseract-ocr` can be added as an optional fallback - **this is a team decision** due to the added runner time and dependency weight.

### 6.3 Deployment Workflow (`deploy.yml`)

Runs only on push to `main` (after a PR is merged).

```
1. Checkout main
2. Setup Node.js
3. npm ci
4. npx docusaurus build
5. Deploy /build to gh-pages branch via peaceiris/actions-gh-pages
```

Build time is expected to stay under 2 minutes for up to ~500 pages.

---

## 7. Moderation and Governance

### 7.1 Team Structure

| Role | Responsibilities | GitHub Permission |
|---|---|---|
| Maintainer | Merge PRs, manage labels, handle disputes | `Write` |
| Subject Lead | Review content accuracy for a specific subject | `Triage` |
| Contributor | Submit content via PR or web form | Fork / `Read` |

Subject Leads are volunteers assigned per subject. At least one Subject Lead must review a PR touching their subject before a Maintainer merges.

### 7.2 Merge Policy

- All PRs require: schema validation CI passing + at least one human approval.
- PRs from the web form are auto-labeled `via-web-form` and prioritized in the review queue.
- PRs that only fix typos or formatting (label: `minor-fix`) can be merged by any Maintainer without Subject Lead review.
- No direct pushes to `main`. Branch protection is enforced.

### 7.3 Content Removal Policy

If a student requests removal of content they contributed:
1. Open an Issue with the label `content-removal-request`.
2. A Maintainer verifies the requester is the original contributor (matches `contributor` field in frontmatter).
3. Content is removed via PR within 5 business days.

Reported content (wrong answers, plagiarized material) follows the same Issue-based process with label `content-dispute`.

### 7.4 CODEOWNERS

A `CODEOWNERS` file enforces that changes to specific subject directories automatically request review from the assigned Subject Lead.

```
# CODEOWNERS example
/content/year-3/term-1/microprocessors/  @subject-lead-microprocessors
/content/year-2/term-2/algorithms/       @subject-lead-algorithms
```

---

## 8. Comments and Discussion Layer

**Technology:** Giscus, backed by GitHub Discussions on the main repo.

### Configuration

- Each Docusaurus page maps to one GitHub Discussion thread, matched by page pathname.
- `category` in Giscus config is set to a dedicated Discussions category: `Page Comments`.
- Students authenticate with their GitHub account to comment. No separate account needed.
- Upvotes on comments are native GitHub Discussion reactions.

### What Giscus Does Not Handle

- Threaded Q&A with accepted answers: GitHub Discussions supports this natively under the `Q&A` category. For exam questions and subject-specific threads, a separate `Q&A` Discussions category can be used and linked from the relevant page.
- Moderation of comments falls under GitHub's built-in tools (report, hide, lock thread). Maintainers with `Write` access can moderate Discussions directly.

---

## 9. Search

Docusaurus 'if used'  ships with Algolia DocSearch integration and a local search plugin option.

**Recommended approach:** Start with `@easyops-cn/docusaurus-search-local` (no external service, no API key, works offline). Upgrade to Algolia DocSearch later if the content volume justifies it (Algolia is free for open-source docs).

Search indexes the Markdown body and frontmatter fields (`title`, `tags`, `doctor`). Binary files (PDFs) are not directly indexed - only their extracted Markdown counterparts are.

---

## 10. File and Asset Storage

| Asset Type | Size | Storage Strategy |
|---|---|---|
| Markdown files | Any | Committed directly to repo |
| Images (diagrams, photos) | < 1 MB | Committed to `/content/assets/` |
| PDFs (text-based) | < 5 MB | Committed to repo alongside .md |
| PDFs (large / scanned) | > 5 MB | Link externally (Google Drive, archive.org) |
| DOCX files | < 5 MB | Committed, then textract runs on them |

Git LFS is available as an opt-in for files between 5–25 MB if the team decides to support larger uploads. Files above 25 MB are always externally linked - this is a hard limit and 1 GB for limit so we may consider GDrives.

---

## 11. Open Questions

These need a team decision before implementation begins.

| # | Question | Options | Owner |
|---|---|---|---|
| 1 | Web form auth: student OAuth vs bot token? | OAuth (better attribution) vs bot token (lower friction) | Team 'oauth'|
| 2 | OCR fallback for scanned PDFs? | Add tesseract to extract workflow vs manual-only | Team |
| 3 | Git LFS: enable or not? | Yes (supports up to 25 MB) vs no (external links only) | Team |
| 4 | Form hosting: same repo (`/contribute`) or separate repo? | Same repo is simpler; separate repo is cleaner CI | Team |
| 5 | Minimum Subject Leads before launch? | Launch with 0 and add later vs require coverage for included subjects | Team |


*This document is a living draft for now. All sections marked with a team decision note must be resolved.*
