"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

import { hydrateAuthState } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { readStoredAuthState } from "@/lib/auth-storage";
import { consumeAuthLogoutReason } from "@/lib/api-request";

export function SessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const stored = readStoredAuthState();
    const logoutReason = consumeAuthLogoutReason();
    dispatch(
      hydrateAuthState(
        stored
          ? {
              accessToken: stored.accessToken,
              refreshToken: stored.refreshToken,
              user: stored.user,
            }
          : null,
      ),
    );

    if (logoutReason) {
      toast.error(logoutReason);
    }
  }, [dispatch]);

  return null;
}
