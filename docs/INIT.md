# College Knowledge Base

**Version:** 0.2.0
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
   - 5.3 [Quiz and Exam Flow](#53-quiz-and-exam-flow)
6. [Automation Pipeline](#6-automation-pipeline)
7. [Moderation and Governance](#7-moderation-and-governance)
8. [Comments and Discussion Layer](#8-comments-and-discussion-layer)
9. [Search](#9-search)
10. [File and Asset Storage](#10-file-and-asset-storage)
11. [Open Questions](#11-open-questions)
12. [Roadmap](#12-roadmap)

---

## 1. Overview

A community-driven, open-source knowledge base for college students. The platform allows any student to contribute lecture notes, summaries, past exam questions or lecturer/student quiz for revision, and corrections. GitHub serves as the single source of truth for all content and collaboration. The system is designed to be free to run indefinitely, with zero dependency on a paid backend.

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
- This is not a free-form grading or proctoring platform.
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
     Web Form (Astro)            Direct PR (Git)
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
│              │  - Python schema validation    │                │
│              │  - textract (PDF -> MD)     │                │
│              │  - PR auto-labeling         │                │
│              └────────────────────────────┘                │
└─────────────────────────────┬──────────────────────────────┘
                              │ GitHub Pages deploy
                              ▼
              ┌───────────────────────────────┐
              │  Static Site (Astro Starlight) │
              │  + Pagefind search             │
              │  + Giscus comments widget      │
              └───────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Responsibility |
|---|---|---|
| Static Site | Astro + Starlight | Renders all content, navigation, search |
| Content Store | GitHub repo (`/src/content`) | Single source of truth for all Markdown |
| Schema Enforcement | Astro Content Collections + Zod | Build-time schema validation |
| Web Form | Astro (static, islands architecture) | Non-technical contribution UI |
| CI Automation | GitHub Actions | PR-time validation, extraction, deployment |
| Search | Pagefind (built into Starlight) | Fully offline, no API key required |
| Comments | Giscus | Per-page discussions via GitHub Discussions |
| Hosting | GitHub Pages | Free, zero-ops static hosting |
| Asset Storage | Git LFS / external links | PDFs and images above size threshold |

---

## 4. Content Schema and Validation

### 4.1 Directory Structure

```
/src/content
  /docs
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

The frontmatter defines repository-level metadata. Quiz content itself is stored in the Markdown body using a strict question schema so Astro can render it into an interactive training flow so there's no guessing of author intent.

Every Markdown file must begin with the following YAML frontmatter block:

```markdown
---
title: "ملخص محاضرة المعالجات 1"
date: "2026-04-11"            # ISO 8601, required
type: "summary"               # enum: summary | quiz | notes | refrence
subject: "microprocessors"    # slug, must match parent directory name
year: 3                       # integer: 1-5
term: 1                       # integer: 1 or 2
prof: "د. أحمد علي"           # string, required
contributor: "github_username" # GitHub username, required
tags: ["CSE", "Microprocessors"]  # array of strings, at least one required
language: "ar"                # ISO 639-1: "ar" or "en"
---

### 4.2.1 Quiz Content Schema

Quiz and exam files must use `type: "quiz"`. They are authored as Markdown with embedded structured question blocks. Contributors must not rely on prose parsing for answer logic.

Required quiz rules:
- Supported question types are `mcq` and `tf` only 'and they may get mixed into mcq type'.
- Each question must define a prompt, a correct answer, and a point value.
- MCQ questions must define a fixed set of choices '4 if there's no surprises'.
- Answer order may be shuffled at render time, but the stored correct answer must remain canonical.
- Partial credit is allowed at the quiz level, but grading for each MCQ and TF question is exact-match only.
- Negative marking is not allowed.
- Feedback is shown only after submission.
- Explanations are optional 'and not recomended for now'.
- If an explanation is omitted, the rendered result must still show the correct answer and a short correction message.

Example quiz block:

```markdown
:::question
type: mcq
points: 2
prompt: "Which register holds the program counter?"
choices:
  - "ACC"
  - "PC"
  - "IR"
  - "MAR"
answer: "PC"
explanation: "The program counter stores the address of the next instruction."
:::
```

```markdown
:::question
type: tf
points: 1
prompt: "The stack grows downward in most common calling conventions."
answer: true
:::
```
```

### 4.3 Schema Validation

Validation is enforced at two layers:

**Layer 1 - Build time (Astro Content Collections):**

Defined in `src/content.config.ts` using Zod. `astro build` fails if any file violates the schema. This is the primary enforcement gate.

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  schema: z.object({
    title: z.string(),
............etc
  }),
});

export const collections = { docs };
```

**Layer 2 - PR time (GitHub Actions):**

A lightweight Python script (`scripts/validate_schema.py`) using `python-frontmatter` and `pydantic` runs on PRs before merge, providing fast feedback via PR comments without triggering a full build.

| Condition | Action |
|---|---|
| Missing required field | Fail CI, post comment listing missing fields |
| `type` not in allowed enum | Fail CI |
| `subject` slug does not match directory | Fail CI |
| `date` not valid ISO 8601 | Fail CI |
| `tags` array is empty | Fail CI |
| All checks pass | Label PR as `schema-valid` |

PRs cannot be merged without the schema validation status check passing.

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

The web form is built as a static Astro page using the islands architecture. Interactive form components are written as Astro islands (React or Preact) and hydrated client-side only. No server runtime is required.

#### Authentication

The student authenticates with GitHub OAuth via the web form. The app requests the minimum required scope: `public_repo` (to open PRs on their behalf). No bot tokens are used - contributions are always attributed to the real student's GitHub account.

> **Decision point for team:** If requiring a GitHub account is too much friction, an alternative is a server-side bot token that opens PRs on behalf of an anonymous user, with the student's name stored only in the frontmatter `contributor` field. This trades attribution accuracy for accessibility. **Team decided it will be linked via github only as making it easy and introduce alot of people to opensource SW/Knowleade is a goal.**

#### Form Fields

| Field | Input Type | Maps to Frontmatter |
|---|---|---|
| المادة (Subject) | Dropdown (populated from repo) | `subject`, `year`, `term` |
| نوع المحتوى | Dropdown | `type` |
| اسم الدكتور | Text | `prof` |
| العنوان | Text | `title` |
| المحتوى | Rich text editor (Markdown) OR file upload (.pdf, .docx) | Body or triggers textract |
| Tags | Multi-select | `tags` |

#### Submission Flow

```
Student fills form
  └── Clicks "إرسال"
        └── Frontend calls GitHub API (authenticated as student)
              └── Creates a new branch: contrib/form/username-timestamp
                    └── Commits the .md file (or raw uploaded binary) to that branch
                          └── Opens a Pull Request with auto-generated title and description
                                └── CI picks up from here (same as PR flow)
```

#### Hosted Form Location

The form is a static Astro export deployed to GitHub Pages on a separate path (`/contribute`) or as a separate repo under the same GitHub organization. All GitHub API calls are made from the browser using the student's OAuth token stored in `sessionStorage` (cleared on tab close).

### 5.3 Quiz and Exam Flow

Quiz and exam submissions follow the same contribution path as other Markdown content, but they are rendered as an interactive assessment experience instead of a static article.

#### Authoring Model

Contributors upload a Markdown file containing:
- frontmatter metadata
- a sequence of question blocks
- optional explanations
- optional references to source material

The schema is strict so that the renderer can grade deterministically, and maybe we provide them with a prompt to give to LLMs to extract and generate data in thier schema 'not needed and not recommended but the goal is to make things easier'

#### Rendering Model

Astro parses the Markdown into a typed quiz model and renders:
- one question at a time or a paginated question list
- shuffled answer choices for MCQ questions
- immediate score after submission
- per-question feedback for wrong answers
- the correct answer for any incorrect response
- optional explanation text when provided

#### Grading Rules

- MCQ and TF answers are graded exactly against the stored answer key.
- Partial credit is allowed only at the quiz level, not by guessing or fuzzy matching.
- No negative marking is applied.
- Feedback is displayed only after the user submits the quiz.
- Question order and MCQ choice order may be randomized per attempt, but grading must use stable identifiers.

#### Example User Flow

```
Student opens quiz page
  └── Astro renders quiz from Markdown
        └── Student answers MCQ and TF questions
              └── Student submits attempt
                    └── Renderer computes mark
                          └── UI shows score, correct answers, and explanations if present
```

This flow is intended for training and revision, not for high-stakes examination control.

## 6. Automation Pipeline

All automation runs via GitHub Actions. No external CI service.

### 6.1 Workflows Overview

| Workflow File | Trigger | Jobs |
|---|---|---|
| `validate.yml` | PR opened or updated | Schema validation Python 'different than buildtime astro check' |
| `extract.yml` | PR opened with binary file | textract, commit Markdown output |
| `deploy.yml` | Push to `main` | `astro build`, deploy to GitHub Pages |
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
      - Commit the .md file alongside the binary: "chore: auto-extracted markdown from [filename]"
      - Post PR comment: "Auto-extraction succeeded. Please review and fill in the frontmatter fields."
   c. If extraction fails (scanned PDF / image-based):
      - Post PR comment: "Could not extract text from [filename]. This file appears to be image-based.
        Please either provide a text-based PDF or paste the content directly as Markdown."
      - Label PR: `needs-manual-extraction`
      - Do not fail CI - the PR remains open for manual handling
4. Re-run schema validation on any newly committed .md files
```

**Scanned PDF handling:** textract is attempted first. If output is empty or below a minimum character threshold (configurable, default: 100 chars), the workflow falls back to the failure path above. OCR via `tesseract-ocr` can be added as an optional fallback - **this is a team decision** due to added runner time and dependency weight 'and the team decided it's not a Day-0 feature for now'.

### 6.3 Deployment Workflow (`deploy.yml`)

Runs only on push to `main` (after a PR is merged).

```
1. Checkout main
2. Setup Node.js
3. npm ci
4. npx astro build
5. Deploy /dist to gh-pages branch via peaceiris/actions-gh-pages
```

Build time is expected to stay under 2 minutes for up to ~500 pages. Pagefind indexes are generated automatically as part of the Starlight build.

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
/src/content/docs/year-3/term-1/microprocessors/  @subject-lead-microprocessors
/src/content/docs/year-2/term-2/algorithms/       @subject-lead-algorithms
```

---

## 8. Comments and Discussion Layer

**Technology:** Giscus, backed by GitHub Discussions on the main repo.

### Configuration

Starlight supports custom components. Giscus is injected by overriding Starlight's `Footer` or `PageFrame` component slot.

- Each page maps to one GitHub Discussion thread, matched by page pathname.
- `category` in Giscus config is set to a dedicated Discussions category: `Page Comments`.
- Students authenticate with their GitHub account to comment. No separate account needed.
- Upvotes on comments are native GitHub Discussion reactions.

### What Giscus Does Not Handle

- Threaded Q&A with accepted answers: GitHub Discussions supports this natively under the `Q&A` category. For quiz questions and subject-specific threads, a separate `Q&A` Discussions category can be used and linked from the relevant page.
- Moderation of comments falls under GitHub's built-in tools (report, hide, lock thread). Maintainers with `Write` access can moderate Discussions directly.

---

## 9. Search

Starlight ships with Pagefind integrated out of the box. No external service, no API key, works offline. The Pagefind index is built automatically during `astro build` and served as static files alongside the site.

We aim to enhance it using our own index system using a mix of some scripts and github CIs.

Search indexes the Markdown body and frontmatter fields (`title`, `tags`, `prof`). Binary files (PDFs) are not directly indexed - only their extracted Markdown counterparts are.

If content volume grows significantly, Algolia DocSearch can be enabled via Starlight's built-in Algolia config option. It is free for open-source projects"for future considration".

---

## 10. File and Asset Storage

| Asset Type | Size | Storage Strategy |
|---|---|---|
| Markdown files | Any | Committed directly to `/src/content/docs/` |
| Images (diagrams, photos) | < 1 MB | Committed to `/public/assets/` |
| PDFs (text-based) | < 5 MB | Committed to repo alongside .md |
| PDFs (large / scanned) | > 5 MB | Link externally (Google Drive, archive.org) |
| DOCX files | < 5 MB | Committed, then textract runs on them |

Git LFS is available as an opt-in for files between 5-25 MB if the team decides to support larger uploads. Files above 25 MB are always externally linked - this is a hard limit. The GitHub free tier provides 1 GB LFS storage; Google Drive is the recommended fallback for anything beyond that maybe?.

---

## 11. Open Questions

These need a team decision before implementation begins.

| # | Question | Options | Owner |
|---|---|---|---|
| 1 | Web form auth: student OAuth vs bot token? | OAuth (better attribution) vs bot token (lower friction) | Team - leaning OAuth |
| 2 | OCR fallback for scanned PDFs? | Add tesseract to extract workflow vs manual-only | NO OCR FOR NOW |
| 3 | Git LFS: enable or not? | Yes (supports up to 25 MB) vs no (external links only) | LFS for now GDrive for later |
| 4 | Form hosting: same repo (`/contribute`) or separate repo? | Same repo is simpler; separate repo is cleaner CI | Seprate |
| 5 | Minimum Subject Leads before launch? | Launch with 0 and add later vs require coverage for included subjects | Team |
| 6 | Astro island component: React or Preact for web form? | React (familiarity) vs Preact (smaller bundle, no runtime difference for this use case) | Gasser |

*This document is a living draft. All sections marked with a team decision note must be resolved before implementation begins.*
