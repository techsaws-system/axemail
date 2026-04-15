"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
};

const initialState: UiState = {
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setSidebarOpen } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
