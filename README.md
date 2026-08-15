# Learnly

Turn educational PDFs into a calm, searchable learning library.

Learnly is Yash Rawat's personal learning archive for uploading, processing, reviewing, previewing, and publishing study material. The local MVP connects a Next.js frontend to a FastAPI and PostgreSQL backend, extracts page-level text with PyMuPDF, and provides an administrative publication workflow.

## What works today

- Upload and validate PDF files up to a configurable size limit
- Store original files safely on the local filesystem
- Persist document records and extracted pages in PostgreSQL
- Extract page text, page count, and estimated reading time with PyMuPDF
- Track `uploaded`, `processing`, `published`, and `failed` lifecycle states
- Retry failed processing and publish or unpublish processed documents
- Browse published documents and open real PDF previews or downloads
- Search and filter the administrative document collection
- Poll active processing records from the frontend
- Check application liveness and PostgreSQL readiness

The current extractor supports text-based PDFs. Handwriting recognition, OCR, generated summaries, embeddings, RAG, learning agents, authentication, cloud storage, and production deployment are later phases.

## Technology

- Frontend: Next.js 16, React 19, TypeScript, App Router, and CSS Modules
- Backend: Python 3.12, FastAPI, Pydantic, SQLAlchemy 2, and Psycopg
- Data: PostgreSQL 15 and Alembic migrations
- Documents: PyMuPDF and local filesystem storage
- Quality: Ruff, mypy, pytest, ESLint, Prettier, and TypeScript

## Repository structure

```text
learnly/
├── backend/   # FastAPI service, persistence, processing, migrations, and tests
├── frontend/  # Next.js public and administrative interfaces
├── docs/      # Architecture, API contract, and product roadmap
└── CHANGELOG.md
```

## Local setup

You need Python 3.12, Node.js, and PostgreSQL 15. Create the PostgreSQL databases and users first, then follow the detailed [backend setup](backend/README.md) and [frontend setup](frontend/README.md).

Start the backend:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

Start the frontend in a second terminal:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. FastAPI documentation is available at `http://localhost:8000/docs`.

Administrative write routes currently have no authentication and are intended only for local development.

## Documentation

- [Backend local setup](backend/README.md)
- [REST API contract](docs/api-contract.md)
- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)

## License

Licensed under the MIT License.
