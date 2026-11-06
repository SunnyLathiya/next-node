import { createRequestQueue } from "./requestQueue";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokenStorage";
import type { FieldError } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api";
const SKIP_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

export class ApiError extends Error {
  status: number;
  errors?: FieldError[];

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type ApiOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

let onAccessToken: ((token: string | null) => void) | null = null;

export function setAccessTokenHandler(handler: (token: string | null) => void) {
  onAccessToken = handler;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    onAccessToken?.(null);
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.token || !data.refreshToken) {
    clearTokens();
    onAccessToken?.(null);
    return null;
  }

  saveTokens(data.token, data.refreshToken);
  onAccessToken?.(data.token);
  return data.token as string;
}

const recover = createRequestQueue(refreshAccessToken);

async function send<T>(
  path: string,
  options: ApiOptions,
  token: string | null | undefined,
  skipAuthRefresh: boolean,
): Promise<T> {
  const request = { ...options };
  delete request.skipAuthRefresh;
  const headers = new Headers(request.headers);
  if (request.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const bearer = token === undefined ? getAccessToken() : token;
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);

  const response = await fetch(`${API_URL}${path}`, { ...request, headers });
  const data = await response.json().catch(() => ({}));
  const canRefresh = !skipAuthRefresh && !SKIP_REFRESH.some((item) => path.startsWith(item));

  if (response.status === 401 && canRefresh) {
    return recover((nextToken) => send(path, options, nextToken, true));
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || "Request failed",
      data.errors,
    );
  }

  return data as T;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
  token?: string | null,
): Promise<T> {
  return send(path, options, token, Boolean(options.skipAuthRefresh));
}
