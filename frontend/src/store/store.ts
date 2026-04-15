"use client";

import { configureStore } from "@reduxjs/toolkit";

import { authReducer } from "@/store/auth-slice";
import { uiReducer } from "@/store/ui-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
