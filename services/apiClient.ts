import { API_BASE_URL, API_PREFIX } from "@/config/api/apiConfig";
import { clearAuthToken, getAuthToken } from "@/services/authStorage";

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  /** Full parsed response body, e.g. `shortages` on a 422 from /orders/{id}/complete */
  data?: any;

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string;
      errors?: Record<string, string[]>;
      data?: any;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.errors = options?.errors;
    this.data = options?.data;
  }
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Extra headers, e.g. `Idempotency-Key`. Merged last, but can't override Authorization. */
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(
  path: string,
  {
    method = "GET",
    body,
    query,
    signal,
    headers: extraHeaders,
  }: RequestOptions = {},
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // Set last so a caller can never override the session token
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) await clearAuthToken();
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed (${response.status})`,
      { code: payload?.code, errors: payload?.errors, data: payload },
    );
  }

  return payload as T;
}
