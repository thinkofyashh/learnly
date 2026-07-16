# Provisional REST API contract

This contract describes the planned FastAPI interface and may change when backend schemas are finalized. These endpoints are not currently implemented.

Base URL: `NEXT_PUBLIC_API_BASE_URL` (default example: `http://localhost:8000/api/v1`)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health |
| GET | `/documents` | Published document collection |
| GET | `/documents/{slug}` | Published document detail |
| POST | `/documents` | Multipart document upload |
| GET | `/admin/documents` | Administrative collection |
| POST | `/documents/{id}/retry` | Retry failed processing |
| POST | `/documents/{id}/publish` | Publish a document |
| POST | `/documents/{id}/unpublish` | Remove a document from the library |
| GET | `/documents/{id}/preview` | Authorized PDF preview |
| GET | `/documents/{id}/download` | Original PDF download |

Collection queries may include `search`, `topic`, `difficulty`, `status`, `page`, `limit`, and `sort`. Uploads use `multipart/form-data` with `file` and optional `title`, `description`, and `publishAfterProcessing` fields.

Errors should return an appropriate HTTP status and a useful human-readable message. The frontend request wrapper preserves backend error details when available and supports abort signals.

