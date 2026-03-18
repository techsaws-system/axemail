"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/utils/api-request";

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  pseudoName?: string;
  email: string;
}

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest("/users/me");
        setUser(data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
