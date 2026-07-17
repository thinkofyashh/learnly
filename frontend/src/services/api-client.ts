const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`);
  const headers = new Headers(options.headers);

  // Let the browser supply multipart boundaries when the request body is FormData.
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    // Support the common error shapes used by the planned API without masking non-JSON errors.
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      detail?: string;
    } | null;
    throw new ApiError(
      body?.message ?? body?.detail ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
