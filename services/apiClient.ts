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
  /** A plain object is sent as JSON; a FormData is sent as multipart (file uploads). */
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

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  // For FormData, leave Content-Type unset: fetch adds `multipart/form-data`
  // with the boundary itself, and a hand-set header would drop the boundary.
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  // Set last so a caller can never override the session token
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
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

/**
 * Multipart upload (file pickers). Uses XMLHttpRequest on purpose: Expo's global
 * `fetch` rejects React Native's { uri, name, type } file parts with
 * "Unsupported FormDataPart implementation", while XHR still supports them natively
 * (and handles real Blobs on web). No Content-Type is set so the boundary is added.
 */
export async function uploadForm<T>(
  path: string,
  form: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const token = await getAuthToken();

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(path));
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 60000;

    xhr.onload = () => {
      let payload: any = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
        return;
      }

      const fail = () =>
        reject(
          new ApiError(
            xhr.status,
            payload?.message ?? `Request failed (${xhr.status})`,
            { code: payload?.code, errors: payload?.errors, data: payload },
          ),
        );
      if (xhr.status === 401) clearAuthToken().then(fail, fail);
      else fail();
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
      });
    }

    xhr.send(form);
  });
}