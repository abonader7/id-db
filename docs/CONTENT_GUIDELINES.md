# Content Guidelines

This document provides technical instructions for formatting and organizing content within the knowledge base.

## 1. Directory Structure

All content is stored in `/src/content/docs/`. Organise files by academic level and subject:

```
/src/content
  /docs
    /level-1
      /term-1
        /subject-slug
          /type (e.g., slides, summaries, exams)
            file-slug.md
```

### Path Naming Rules
- Use lowercase and hyphenated slugs (e.g., `microprocessors`).
- **No spaces** and **no Arabic characters** in folder or file names. (Arabic is allowed only inside the file content).
- Every directory must contain at least one `.md` file to be indexed.

## 2. Frontmatter Schema

Every Markdown file must start with a YAML frontmatter block. This metadata is strictly validated.

```yaml
---
title: "ملخص محاضرة المعالجات 1"
date: "2026-04-11"            # ISO 8601 (YYYY-MM-DD)
type: "summary"               # Options: summary | quiz | notes | reference
subject: "microprocessors"    # Must match parent directory name
level: 3                       # 1-5
term: 1                       # 1 or 2
prof: "د. أحمد علي"           # Professor's name
contributor: "github_username" # Your GitHub username
tags: ["CSE", "Microprocessors"] # At least one required
language: "ar"                # "ar" or "en"
---
```

## 3. Quizzes and Exams

For files with `type: "quiz"`, use the special `:::question` directive to define interactive questions.

### Question Block Example

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
explanation: "The program counter stores the address of the next instruction." 'optional'
:::
```

### Quiz Formatting Rules
- Supported types: `mcq` (Multiple Choice) and `tf` (True/False).
- Keep choices concise. (4 options are recommended).
- Explanations are optional but encouraged for difficult questions.
- No negative marking is applied.

## 4. Writing Best Practices
- **Clarity:** Use clear, concise headings.
- **RTL Support:** Use Arabic for content, but slugs for technical metadata. 'shipped'
- **Visuals:** When including images, use the correct relative paths and descriptive alt text.

## References
- [Zod: TypeScript-first schema validation](https://zod.dev/)
- [ISO 8601: Date and time format](https://en.wikipedia.org/wiki/ISO_8601)
- [Remark Directives: Markdown extensions](https://github.com/remarkjs/remark-directive)
