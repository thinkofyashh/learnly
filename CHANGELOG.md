# Changelog

## Unreleased

### Added

- Initial Learnly monorepo structure
- Next.js and TypeScript frontend
- Core application shell
- Responsive learning-library interface
- Animated Learnly splash screen
- Public document library and detail views
- Administrative upload and processing interfaces
- Persistent light and dark appearance modes
- Subtle theme-aware cursor glow with press feedback
- Animated Asyncio hero card with reduced-motion support
- FastAPI backend foundation with a versioned health endpoint and automated test coverage
- Environment-based backend configuration with configurable API routing and CORS controls
- PostgreSQL connection management with SQLAlchemy, Psycopg, Alembic, database readiness checks, and automated test coverage
- PostgreSQL document and page persistence with lifecycle enums, JSONB metadata, relational constraints, and a reversible Alembic migration
- Published document collection and detail APIs with pagination, camelCase responses, visibility rules, and repository-service separation
- Secure PDF uploads with validation, SHA-256 checksums, atomic local storage, and transactional cleanup
- Inline document preview and download endpoints with missing-file and path-traversal protection
- Background PDF processing with page-level text extraction, reading estimates, lifecycle tracking, automatic publication, and retry support
- Manual publication controls with unique slug generation and enforced public visibility rules
- Administrative document listing with search, lifecycle and metadata filters, safe sorting, and pagination
- Live frontend integration for public library reads, PDF uploads, processing status, previews, downloads, and publication controls
- Administrative document detail API for reviewing records in any lifecycle state

### Changed

- Standardized frontend formatting and added focused debugging comments
- Refined dark-mode contrast with a premium charcoal-and-jade palette
- Replaced frontend document fixtures and planned pipeline labels with PostgreSQL-backed API data and actual processing stages
- Updated project, backend, frontend, API, architecture, and roadmap documentation for the working local MVP
