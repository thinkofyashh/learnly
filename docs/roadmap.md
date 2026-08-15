# Learnly product roadmap

## Local MVP completed

- Responsive public and administrative Next.js interfaces
- FastAPI application foundation, configuration, CORS, and health checks
- PostgreSQL persistence with SQLAlchemy and reversible Alembic migration
- PDF upload validation, checksums, local storage, preview, and download
- PyMuPDF page-level text extraction and reading estimates
- Background processing, failure capture, retry, and automatic publication
- Manual publish and unpublish controls with unique slugs
- Public visibility rules and administrative search, filters, sorting, and pagination
- Live frontend reads, uploads, polling, previews, downloads, and lifecycle controls
- Automated backend coverage and frontend production-build validation

## MVP closeout

- Add authentication before exposing administrative writes outside local development
- Choose a deployment target and production storage/database services

## Next product phase

1. Add metadata editing for title, description, topic, tags, prerequisites, and difficulty.
2. Add thumbnail generation and richer public document presentation.
3. Move extraction to a durable worker with recovery for interrupted jobs.
4. Add OCR for scanned and handwritten notes.
5. Add observability for processing duration, failures, and storage health.

## RAG and learning intelligence

1. Chunk extracted page text while retaining document and page references.
2. Generate embeddings and store a versioned retrieval index.
3. Add semantic search and page-cited answers.
4. Add summaries, takeaways, quizzes, and flashcards through reviewable workflows.
5. Add progress tracking, learning paths, and focused learning agents.

RAG, embeddings, and agents remain downstream consumers of the stable document pipeline rather than responsibilities of upload or storage code.
