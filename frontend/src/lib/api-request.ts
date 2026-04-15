"use client";

import { clearAuthState, setAuthState, type AuthUser } from "@/store/auth-slice";
import { store } from "@/store/store";
import { clearStoredAuthState, persistAuthState, readStoredAuthState } from "@/lib/auth-storage";
import { ApiError, normalizeErrorMessage } from "@/lib/error-message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_LOGOUT_REASON_KEY = "axemail_logout_reason";

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresIn: string;
  user: AuthUser;
};

let refreshPromise: Promise<string | null> | null = null;

export async function apiRequest<T>({
  path,
  method = "GET",
  body,
  auth = true,
}: RequestOptions): Promise<T> {
  const response = await performRequest(path, method, body, auth);

  if (response.status !== 401 || !auth) {
    return parseResponse<T>(response);
  }

  const refreshedToken = await refreshAccessToken();

  if (!refreshedToken) {
    const error = await createApiError(response);
    if (error.userMessage) {
      clearAuthSession(error.userMessage);
    }
    throw error;
  }

  return parseResponse<T>(await performRequest(path, method, body, auth));
}

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return API_BASE_URL;
}

async function performRequest(path: string, method: string, body: unknown, auth: boolean) {
  const accessToken = auth ? store.getState().auth.accessToken ?? readStoredAuthState()?.accessToken ?? null : null;

  return fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await createApiError(response);
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

async function createApiError(response: Response) {
  let message = "Request failed.";

  try {
    const payload = (await response.json()) as { error?: { message?: string }; message?: string };
    message = payload.error?.message ?? payload.message ?? message;
  } catch {}

  return new ApiError(message, normalizeErrorMessage(message));
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = store.getState().auth.refreshToken ?? readStoredAuthState()?.refreshToken ?? null;

      if (!refreshToken) {
        clearAuthSession();
        return null;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });

        if (!response.ok) {
          clearAuthSession("Your session has expired. Please sign in again.");
          return null;
        }

        const payload = (await response.json()) as { data: AuthResponse };
        persistSession(payload.data);
        return payload.data.accessToken;
      } catch {
        clearAuthSession("Your session has expired. Please sign in again.");
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export function persistSession(session: AuthResponse) {
  persistAuthState({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  });

  store.dispatch(
    setAuthState({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    }),
  );
}

export function clearAuthSession(reason?: string) {
  clearStoredAuthState();
  store.dispatch(clearAuthState());

  if (typeof window !== "undefined" && reason) {
    window.sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
  }

  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

export function consumeAuthLogoutReason() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);

  if (!value) {
    return null;
  }

  window.sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
  return value;
}
