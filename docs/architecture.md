# Architecture

## Application boundary

Learnly is a monorepo with separately deployable frontend and backend applications. The Next.js frontend owns presentation, interaction, accessibility, provisional data types, and API consumption. The future FastAPI backend will own validation, storage, persistence, processing, authentication, and document intelligence.

The browser will communicate with the backend through versioned REST APIs. PostgreSQL is the planned system of record; uploaded PDF assets will be managed behind the backend boundary rather than stored in the browser or Next.js routes.

## Planned document workflow

1. Validate and store an uploaded PDF.
2. Create its database record.
3. Extract document text and page structure.
4. Generate structured metadata.
5. Review and publish the document.
6. Serve authorized previews and downloads.

## Security boundary

Public frontend variables contain only non-secret configuration such as the REST base URL. Credentials, storage access, database connectivity, processing jobs, and private provider keys remain exclusively on the backend. User-supplied files must be validated by the backend before storage or processing.

## Extensions

Later phases may add embeddings and semantic retrieval for RAG with page-level citations. Agent-driven learning workflows may build on those APIs after the core document pipeline is stable. Neither extension belongs in the browser or the current frontend foundation.

