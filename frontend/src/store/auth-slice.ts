"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Role, UserStatus } from "@/types";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName: string;
  email: string;
  role: Role;
  status: UserStatus;
};

export type AuthState = {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const initialState: AuthState = {
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuthState: (state, action: PayloadAction<Omit<AuthState, "hydrated"> | null>) => {
      state.hydrated = true;
      state.accessToken = action.payload?.accessToken ?? null;
      state.refreshToken = action.payload?.refreshToken ?? null;
      state.user = action.payload?.user ?? null;
    },
    setAuthState: (state, action: PayloadAction<Omit<AuthState, "hydrated">>) => {
      state.hydrated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    clearAuthState: (state) => {
      state.hydrated = true;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
  },
});

export const { hydrateAuthState, setAuthState, clearAuthState } = authSlice.actions;
export const authReducer = authSlice.reducer;
