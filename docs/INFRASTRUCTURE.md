# Infrastructure & Tooling

This document provides details on the core technical tools that power the **project-hikma**.

## 1. Search (Pagefind)

We use **Pagefind** to provide high-performance search without a backend.
- **How it works:** Pagefind generates a search index during the build process. This index is then served as static files.
- **Faceted Search:** We use metadata fields (e.g., `subject`, `prof`, `level`, `term`) to allow users to filter search results directly in the UI.
- **Benefits:** No API keys, fully offline-ready, and zero hosting costs.

## 2. Comments (Giscus)

**Giscus** provides a threaded discussion layer for every content page via the [`starlight-giscus`](https://github.com/dragomano/starlight-giscus) plugin.
- **How it works:** Each page maps to a dedicated thread in **GitHub Discussions** using URL pathname mapping.
- **Interaction:** Students authenticate with their GitHub account to leave comments or react with emojis.
- **Moderation:** Discussions are managed using standard GitHub moderation tools.
- **Configuration:** See [`astro.config.mjs`](../../astro.config.mjs) for plugin settings.

## 3. Asset & File Storage

| Asset Type | Size Limit | Strategy |
| :--- | :--- | :--- |
| **Markdown (.md)** | Any | Committed to `/src/content/docs/`. |
| **Images (.png, .jpg)** | < 1 MB | Committed to `/public/assets/`. |
| **PDFs & DOCX** | < 5 MB | Committed directly for text extraction. |
| **Large Files** | > 5 MB | Linked externally (e.g., Google Drive, archive.org). |

### Git LFS
For files between 5–25 MB, we use **Git Large File Storage (LFS)**. This allows us to track large binaries without bloating the main repository's history.

## 4. Automation Tools

- **Textract:** Extract raw text from PDFs and DOCX files.
- **Astro Content Collections:** Built-in validation and type safety for our Markdown data.
- **Zod:** A TypeScript-first schema declaration and validation library.

## References
- [Pagefind: Static Search Engine](https://pagefind.app/)
- [Giscus: Comments via GitHub Discussions](https://giscus.app/)
- [Git LFS: Large File Storage](https://git-lfs.github.com/)
- [Zod Documentation](https://zod.dev/)
- [Textract: Text Extraction from Files](https://github.com/deanmalmgren/textract)
