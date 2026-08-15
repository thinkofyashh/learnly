# Learnly REST API contract

The implemented FastAPI base URL is configured by `API_V1_PREFIX` and defaults to `/api/v1`. The frontend uses `NEXT_PUBLIC_API_BASE_URL`, normally `http://localhost:8000/api/v1` during local development.

## Endpoints

| Method | Endpoint                    | Success | Purpose                                                     |
| ------ | --------------------------- | ------- | ----------------------------------------------------------- |
| `GET`  | `/health`                   | `200`   | Application liveness independent of PostgreSQL              |
| `GET`  | `/health/ready`             | `200`   | PostgreSQL readiness; returns `503` when unavailable        |
| `GET`  | `/documents`                | `200`   | Paginated published document collection                     |
| `GET`  | `/documents/{slug}`         | `200`   | Published document detail; unpublished records return `404` |
| `POST` | `/documents`                | `201`   | Multipart PDF upload and background-processing request      |
| `GET`  | `/admin/documents`          | `200`   | Paginated administrative collection across every status     |
| `GET`  | `/admin/documents/{id}`     | `200`   | Administrative detail across every status                   |
| `POST` | `/documents/{id}/retry`     | `202`   | Retry a failed document                                     |
| `POST` | `/documents/{id}/publish`   | `200`   | Publish a successfully processed document                   |
| `POST` | `/documents/{id}/unpublish` | `200`   | Remove a published document from the public library         |
| `GET`  | `/documents/{id}/preview`   | `200`   | Stream the original PDF inline                              |
| `GET`  | `/documents/{id}/download`  | `200`   | Download the original PDF as an attachment                  |

Administrative write routes are unauthenticated and intended only for local development.

## Collections

Collection responses use this shape:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 0
}
```

`GET /documents` accepts:

- `page` — integer greater than or equal to 1
- `limit` — integer from 1 to 100

`GET /admin/documents` additionally accepts:

- `search` — case-insensitive title, description, or original-filename search
- `status` — `uploaded`, `processing`, `published`, or `failed`
- `difficulty` — `beginner`, `intermediate`, or `advanced`
- `topic` — exact JSONB topic membership
- `sort` — `newest`, `oldest`, `title_asc`, or `title_desc`

## Upload request

`POST /documents` uses `multipart/form-data`:

| Field                    | Required | Description                  |
| ------------------------ | -------- | ---------------------------- |
| `file`                   | Yes      | PDF upload                   |
| `publishAfterProcessing` | No       | Boolean; defaults to `false` |

The endpoint returns `400` for invalid PDF metadata or header, `413` for an oversized upload, and `201` after the file and database record are safely created. Processing continues through an in-process FastAPI background task.

## Document response

Python names remain `snake_case`; JSON fields use `camelCase` for the frontend. A document response contains:

```json
{
  "id": 1,
  "slug": "example-notes",
  "originalFilename": "example-notes.pdf",
  "title": null,
  "description": null,
  "status": "published",
  "processingError": null,
  "thumbnailUrl": null,
  "previewUrl": "/api/v1/documents/1/preview",
  "downloadUrl": "/api/v1/documents/1/download",
  "topics": [],
  "tags": [],
  "keyTakeaways": [],
  "prerequisites": [],
  "difficulty": null,
  "estimatedReadingMinutes": 4,
  "pageCount": 6,
  "sizeBytes": 245760,
  "viewCount": 0,
  "downloadCount": 0,
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-08-15T10:01:00Z",
  "publishedAt": "2026-08-15T10:01:00Z"
}
```

URL fields may be relative to the API origin. The frontend resolves them against `NEXT_PUBLIC_API_BASE_URL`.

## Lifecycle rules

- New upload: `uploaded`
- Extraction in progress: `processing`
- Successful extraction without automatic publication: `uploaded`
- Successful extraction with automatic publication: `published`
- Extraction failure: `failed`
- Unpublish: `published → uploaded`
- Retry: `failed → processing`
- Manual publication requires successful extraction

## Errors

Errors use FastAPI's standard shape:

```json
{
  "detail": "Document not found"
}
```

Validation errors may return a structured array in `detail`. The frontend converts those responses into a concise user-facing message.
