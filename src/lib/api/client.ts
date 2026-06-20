import axios, { isAxiosError } from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data;
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : error.response.statusText;

      return new ApiError(message, error.response.status, data);
    }

    if (error.code === "ECONNABORTED") {
      return new ApiError("Request timed out", 0);
    }

    return new ApiError("Network error", 0);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }

  return new ApiError("Unknown error", 0);
}

export const apiClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toLowerCase();
  const response = await apiClient.request<T>({
    url: path,
    method,
    data: init?.body ? JSON.parse(init.body as string) : undefined,
    headers: init?.headers as Record<string, string> | undefined,
  });

  return response.data;
}
