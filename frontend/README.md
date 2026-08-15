# Learnly frontend

The Learnly web application uses Next.js 16, React 19, TypeScript, the App Router, native Fetch, and CSS Modules. It reads and writes live document data through the FastAPI service.

## Local setup

Start the backend first. Then, from the `frontend` directory:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

`NEXT_PUBLIC_API_BASE_URL` must point to the versioned FastAPI base URL. The local default is:

```text
http://localhost:8000/api/v1
```

This variable is visible in the browser and must never contain credentials or secrets.

## Available commands

- `npm run dev` — start the development server
- `npm run format` — format frontend files
- `npm run format:check` — verify formatting
- `npm run lint` — run ESLint
- `npm run typecheck` — run the TypeScript compiler without emitting files
- `npm run build` — create an optimized production build

The public pages use server-rendered API reads. Interactive library filters, uploads, processing polling, retry, and publication controls run in client components. If FastAPI is unavailable, route-level error handling explains how to restore the local connection.
