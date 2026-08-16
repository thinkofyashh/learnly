# Learnly backend

The Learnly backend is a synchronous FastAPI service backed by PostgreSQL. It validates and stores PDFs, extracts page-level text with PyMuPDF, tracks document lifecycle state, and serves public and administrative REST APIs.

## Prerequisites

- Python 3.12
- PostgreSQL 15
- A local PostgreSQL role with permission to own the development and test databases

## PostgreSQL setup

Start PostgreSQL 15. On a Homebrew installation:

```bash
brew services start postgresql@15
```

Create a dedicated role and both databases. Choose your own development password when prompted:

```bash
createuser --host=127.0.0.1 --login --pwprompt learnly
createdb --host=127.0.0.1 --owner=learnly learnly
createdb --host=127.0.0.1 --owner=learnly learnly_test
```

If the role or databases already exist, do not recreate them.

## Python and environment setup

From the `backend` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
cp .env.example .env
```

Edit `.env` and replace the placeholder passwords in `DATABASE_URL` and `TEST_DATABASE_URL`. If the password contains reserved URL characters, URL-encode it. The `.env` file is untracked and must never be committed.

Important settings:

| Variable            | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `APP_ENV`           | Runtime environment name                 |
| `API_V1_PREFIX`     | Versioned API prefix                     |
| `CORS_ORIGINS`      | Allowed frontend origins as a JSON array |
| `DATABASE_URL`      | Development PostgreSQL connection        |
| `TEST_DATABASE_URL` | Isolated integration-test connection     |
| `STORAGE_ROOT`      | Local root for uploaded files            |
| `MAX_UPLOAD_BYTES`  | Maximum accepted upload size             |

## Migrations and startup

Apply the database schema:

```bash
alembic upgrade head
alembic current
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Useful local URLs:

- API documentation: `http://localhost:8000/docs`
- Liveness: `http://localhost:8000/api/v1/health`
- Database readiness: `http://localhost:8000/api/v1/health/ready`

Uploaded files are written below `STORAGE_ROOT` and are ignored by Git.

## Validation

Run the complete backend checks from the `backend` directory:

```bash
ruff format --check app tests
ruff check app tests
mypy app tests
pytest -v
alembic check
```

To exercise migration reversibility on a disposable database:

```bash
alembic downgrade base
alembic upgrade head
```

Do not run the downgrade command against a database containing data you need to keep.

## Processing behavior

1. The upload endpoint validates the filename, extension, MIME type, PDF header, size, and structural readability.
2. The file is written to local storage and its PostgreSQL record is created as `uploaded`.
3. A FastAPI background task changes the record to `processing`.
4. PyMuPDF extracts page text and stores it in `document_pages`.
5. Successful processing returns the record to `uploaded`, or publishes it when automatic publication was requested.
6. Processing exceptions change the record to `failed` and store an error message for retry.

Corrupt, unreadable, empty, or password-protected PDFs are rejected before storage and never create a PostgreSQL record. Failed records remain available only for unexpected problems that occur after a valid upload has entered processing, preserving the retry workflow.

## MVP limitations

- Background tasks are in-process and non-durable. Stopping FastAPI during extraction can leave a record in `processing`.
- Administrative writes are local-only because authentication is not implemented.
- Storage is local rather than cloud-backed.
- OCR, thumbnails, automated metadata, embeddings, RAG, and agents are not included.
- Topics, tags, takeaways, prerequisites, descriptions, and difficulty remain empty unless supplied by a future metadata workflow.

The page-level extraction model intentionally provides a clean future boundary for chunking, embeddings, retrieval, and page-cited RAG without coupling those features to upload or storage code.
