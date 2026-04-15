"use client";

import { useQuery } from "@tanstack/react-query";

import { ComposerPanel } from "@/components/dashboard/composer-panel";
import { PageLoadingSkeleton } from "@/components/dashboard/dashboard-primitives";
import { getSenderCards, sendMaskCampaign } from "@/lib/api";

export default function MaskSenderPage() {
  const query = useQuery({
    queryKey: ["sender-cards", "mask"],
    queryFn: getSenderCards,
  });

  if (query.isLoading || !query.data) {
    return <PageLoadingSkeleton />;
  }

  return (
    <ComposerPanel
      apiPaths={{
        submit: "/api/mask-sender/send",
        attachments: "",
        editor: "",
      }}
      onSubmit={sendMaskCampaign}
      quotas={query.data.filter((item) => item.type === "mask")}
      title="Mask delivery"
      description="Send alias-based campaigns with sender control and quota visibility."
      includeFromEmail
    />
  );
}
