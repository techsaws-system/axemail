"use client";

import { useQuery } from "@tanstack/react-query";

import { ComposerPanel } from "@/components/dashboard/composer-panel";
import { PageLoadingSkeleton } from "@/components/dashboard/dashboard-primitives";
import { getSenderCards, sendGmailCampaign } from "@/lib/api";

export default function GmailSenderPage() {
  const query = useQuery({
    queryKey: ["sender-cards", "gmail"],
    queryFn: getSenderCards,
  });

  if (query.isLoading || !query.data) {
    return <PageLoadingSkeleton />;
  }

  return (
    <ComposerPanel
      apiPaths={{
        submit: "/api/gmail-sender/send",
        attachments: "",
        editor: "",
      }}
      onSubmit={sendGmailCampaign}
      quotas={query.data.filter((item) => item.type === "gmail")}
      title="Gmail delivery"
      description="Prepare Gmail campaigns with controlled capacity and a polished editing workflow."
      showCooldown
      cooldownLabel="gmail"
    />
  );
}
