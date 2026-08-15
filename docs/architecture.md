# Learnly architecture

## Application boundary

Learnly is a monorepo with separately runnable frontend and backend applications. Next.js owns presentation and browser interaction. FastAPI owns validation, persistence, storage, processing, lifecycle rules, and the REST contract. PostgreSQL is the system of record, while uploaded PDF bytes remain behind a storage interface.

```text
Browser
  │
  ├── public and admin pages
  ▼
Next.js frontend
  │ versioned REST requests
  ▼
FastAPI routes
  │
  ├── services ── storage interface ── local PDF files
  │
  └── repositories ── SQLAlchemy sessions ── PostgreSQL
                         │
                         └── documents + document_pages
```

## Backend layers

- API routes translate HTTP requests and domain errors.
- Services implement upload, processing, publication, file-serving, and query behavior.
- Repositories own SQLAlchemy queries and persistence operations.
- Models define the PostgreSQL schema and relationships.
- Schemas serialize frontend-compatible camelCase responses.
- Storage exposes a replaceable backend interface; the MVP uses local files.
- Tasks create their own database sessions before running document processing.

This separation keeps PDF processing independent of the web UI and makes later cloud storage, durable workers, and retrieval components replaceable without rewriting the document domain.

## Document workflow

1. FastAPI validates an uploaded PDF's metadata, header, and configured size limit.
2. The upload service writes the file with a generated storage key.
3. The same operation creates its PostgreSQL document record transactionally.
4. A background task opens a new SQLAlchemy session and changes the record to `processing`.
5. PyMuPDF extracts ordered text from every page.
6. The repository replaces the document's page rows as one bounded operation.
7. The service stores page count, reading estimate, timestamps, and the final status.
8. Public queries expose only `published` records.

Invalid upload metadata leaves no file or database record. Processing failures are retained as failed records so the administrative interface can explain and retry them.

## Frontend data flow

Public and administrative page reads begin in Next.js Server Components. Interactive filters, upload submission, active-status polling, retry, publish, and unpublish behavior run in focused Client Components. The API client centralizes URL building, multipart behavior, response typing, and FastAPI error handling.

## Security boundary

Only non-secret configuration is exposed through `NEXT_PUBLIC_API_BASE_URL`. Database credentials, storage paths, processing details, and future provider keys stay in the backend environment. File-serving code resolves generated storage keys below the configured storage root to prevent path traversal.

Authentication is not part of the MVP. Administrative write endpoints must remain local-only until authorization is added.

## Reliability boundary

FastAPI background tasks are deliberately non-durable for the local MVP. A process shutdown during extraction can leave a document in `processing`. A production architecture should move processing to a durable queue with recovery, retry policy, idempotency, and observable job state.

## RAG extension path

Each extracted page already has a stable document relationship, page number, and text body. A future ingestion layer can chunk those page records, attach document and page metadata, create embeddings, and store retrieval indexes without changing upload or public document APIs. LangChain can orchestrate chunking and retrieval later, while PyMuPDF remains the deterministic source extractor and page citations remain traceable to PostgreSQL records.
