"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import { SessionBootstrap } from "@/components/providers/session-bootstrap";
import { store } from "@/store/store";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "18px",
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(148,163,184,0.2)",
              boxShadow: "0 18px 50px rgba(15, 23, 42, 0.25)",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#f8fafc",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#f8fafc",
              },
            },
          }}
        />
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
