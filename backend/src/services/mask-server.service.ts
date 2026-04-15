import axios from "axios";

import { env } from "@/config/env";

export async function getMaskServerHealth() {
  const startedAt = Date.now();

  try {
    const response = await axios.get(env.MASK_SENDER_HEALTHCHECK_URL, {
      headers: env.MASK_SENDER_API_KEY
        ? { Authorization: `Bearer ${env.MASK_SENDER_API_KEY}` }
        : undefined,
      timeout: 15000,
    });

    return {
      status: "active" as const,
      responseTimeMs: Date.now() - startedAt,
      endpoint: env.MASK_SENDER_HEALTHCHECK_URL,
      details: response.data,
    };
  } catch (error) {
    return {
      status: "not_working" as const,
      responseTimeMs: Date.now() - startedAt,
      endpoint: env.MASK_SENDER_HEALTHCHECK_URL,
      details: error instanceof Error ? error.message : "Mask server health check failed.",
    };
  }
}
