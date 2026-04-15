"use client";

import { AUTH_COOKIE, AUTH_STORAGE_KEY } from "@/constants/enums";
import type { AuthUser } from "@/store/auth-slice";

export type StoredAuthState = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export function persistAuthState(value: StoredAuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY.USER, JSON.stringify(value.user));
  setCookie(AUTH_COOKIE.ACCESS_TOKEN, value.accessToken);
  setCookie(AUTH_COOKIE.REFRESH_TOKEN, value.refreshToken);
  setCookie(AUTH_COOKIE.ROLE, value.user.role);
}

export function readStoredAuthState(): StoredAuthState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = readCookie(AUTH_COOKIE.ACCESS_TOKEN);
  const refreshToken = readCookie(AUTH_COOKIE.REFRESH_TOKEN);
  const userRaw = window.localStorage.getItem(AUTH_STORAGE_KEY.USER);

  if (!accessToken || !refreshToken || !userRaw) {
    return null;
  }

  try {
    return {
      accessToken,
      refreshToken,
      user: JSON.parse(userRaw) as AuthUser,
    };
  } catch {
    clearStoredAuthState();
    return null;
  }
}

export function clearStoredAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY.USER);
  clearCookie(AUTH_COOKIE.ACCESS_TOKEN);
  clearCookie(AUTH_COOKIE.REFRESH_TOKEN);
  clearCookie(AUTH_COOKIE.ROLE);
}

function setCookie(name: string, value: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=28800; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}
