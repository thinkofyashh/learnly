# Learnly

Turn handwritten notes into an intelligent learning library.

Learnly is a personal learning archive for uploading, organizing, previewing, and sharing handwritten notes and educational PDFs. The current release establishes the complete frontend experience using realistic mock data while the service layer remains ready for a future FastAPI backend.

## Features

- Browse and filter a responsive notes library
- Review structured note overviews, topics, prerequisites, and key takeaways
- Preview document pages and inspect reading metadata
- Explore administrative upload, processing, review, and publishing workflows
- Handle loading, empty, failed, processing, and partial-data states
- Navigate with accessible keyboard and reduced-motion support

## Project status

The frontend foundation is implemented. Backend storage, processing, authentication, and document intelligence are intentionally deferred.

## Structure

```text
learnly/
├── frontend/  # Next.js application
├── backend/   # Planned FastAPI service documentation
├── docs/      # Architecture, API contract, and roadmap
└── .github/workflows/
```

## Technology

The frontend uses Next.js, React, TypeScript, the App Router, CSS Modules, native Fetch, and ESLint. The planned backend uses FastAPI, PostgreSQL, SQLAlchemy, PyMuPDF, and background document-processing services.

## Local setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend currently uses centralized mock data, so a backend is not required.

Available commands:

- `npm run dev` — start the development server
- `npm run lint` — run lint checks
- `npm run typecheck` — validate TypeScript
- `npm run build` — create a production build

`NEXT_PUBLIC_API_BASE_URL` configures the future REST service URL. It must never contain secrets.

See [the roadmap](docs/roadmap.md) for planned backend integration and post-MVP learning features.

## License

Licensed under the MIT License.

