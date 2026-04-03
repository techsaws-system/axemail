"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/utils/api-request";

interface UsageResponse {
  sentToday: number;
  remainingToday: number;
  user: {
    dailySendLimit: number;
  };
}

export const useSendAvailability = () => {
  const [loading, setLoading] = useState(true);
  const [sentToday, setSentToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [remainingToday, setRemainingToday] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await apiRequest("/analytics/usage/me");
      const data = response.data as UsageResponse;

      setSentToday(data.sentToday);
      setDailyLimit(data.user.dailySendLimit);
      setRemainingToday(data.remainingToday);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, 10000);

    return () => clearInterval(interval);
  }, [refresh]);

  const canSend = dailyLimit > 0 && remainingToday > 0;
  const disabledReason =
    dailyLimit <= 0
      ? "Your admin has not assigned a sending limit yet."
      : remainingToday <= 0
        ? "You have reached your daily sending limit."
        : null;

  return {
    loading,
    sentToday,
    dailyLimit,
    remainingToday,
    canSend,
    disabledReason,
    refresh,
  };
};
