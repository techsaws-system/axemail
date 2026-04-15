"use client";

import { useQuery } from "@tanstack/react-query";

import { ComposerPanel } from "@/components/dashboard/composer-panel";
import { PageLoadingSkeleton } from "@/components/dashboard/dashboard-primitives";
import { getSenderCards, sendDomainCampaign } from "@/lib/api";

export default function DomainSenderPage() {
  const query = useQuery({
    queryKey: ["sender-cards", "domain"],
    queryFn: getSenderCards,
  });

  if (query.isLoading || !query.data) {
    return <PageLoadingSkeleton />;
  }

  return (
    <ComposerPanel
      apiPaths={{
        submit: "/api/domain-sender/send",
        attachments: "",
        editor: "",
      }}
      onSubmit={sendDomainCampaign}
      quotas={query.data.filter((item) => item.type === "domain")}
      title="Domain delivery"
      description="Run domain campaigns with pacing controls and sender availability visibility."
      includeCcBcc={false}
      showCooldown
      cooldownLabel="domain"
    />
  );
}
