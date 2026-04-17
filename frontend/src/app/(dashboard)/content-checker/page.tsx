"use client";

import { useMutation } from "@tanstack/react-query";
import { LoaderCircle, ShieldAlert, ShieldCheck, ShieldMinus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import {
  DashboardSection,
  EmptyState,
} from "@/components/dashboard/dashboard-primitives";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkContent } from "@/lib/api";
import { getUserErrorMessage } from "@/lib/error-message";
import { formatNumber } from "@/lib/utils";
import type { ContentCheckResult } from "@/types";

const primaryButtonClassName =
  "bg-slate-950 text-white cursor-pointer shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_22px_45px_rgba(15,23,42,0.24)]";

export default function ContentCheckerPage() {
  const [fromName, setFromName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ContentCheckResult | null>(null);

  const contentCheckMutation = useMutation({
    mutationFn: checkContent,
    onSuccess: (response) => {
      setResult(response);
      toast.success("Content analysis completed.");
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  function handleCheck() {
    if (!fromName.trim() || !subject.trim() || !message.trim()) {
      toast.error("Required fields are missing or invalid.");
      return;
    }

    contentCheckMutation.mutate({
      fromName,
      subject,
      previewText: previewText || undefined,
      message,
    });
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Content checker"
        description="Score draft content for spam risk and tighten the tone before sending through your sender pages."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="dashboard-card">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="From Name" required>
                <Input
                  value={fromName}
                  placeholder="USPTO Review Desk"
                  onChange={(event) => setFromName(event.target.value)}
                />
              </Field>
              <Field label="Subject" required>
                <Input
                  value={subject}
                  placeholder="Required Trademark Classification Review Notice"
                  onChange={(event) => setSubject(event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Preview Text">
                <Input
                  value={previewText}
                  placeholder="Reference information and response window for the recipient."
                  onChange={(event) => setPreviewText(event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-5">
              <Label>
                Message
                <span className="ml-1 text-rose-500">*</span>
              </Label>
              <div className="mt-3">
                <RichTextEditor
                  value={message}
                  onChange={setMessage}
                  apiPath="/api/content-checker/check"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                className={primaryButtonClassName}
                disabled={contentCheckMutation.isPending}
                onClick={handleCheck}
              >
                {contentCheckMutation.isPending ? (
                  <>
                    Checking
                    <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Check content"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {!result ? (
              <EmptyState
                title="No content score yet"
                description="Run a content check to review spam signals, scoring, and legal-tone suggestions."
              />
            ) : (
              <>
                <div className="dashboard-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Overall score
                      </p>
                      <p className="mt-3 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
                        {formatNumber(result.score)}
                      </p>
                    </div>
                    <Badge variant={mapRiskVariant(result.riskLevel)}>
                      {result.riskLevel === "low"
                        ? "Low risk"
                        : result.riskLevel === "medium"
                          ? "Medium risk"
                          : "High risk"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{result.summary}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MiniMetric
                      label="Words"
                      value={formatNumber(result.metrics.messageWordCount)}
                    />
                    <MiniMetric
                      label="Links"
                      value={formatNumber(result.metrics.linkCount)}
                    />
                    <MiniMetric
                      label="Spam hits"
                      value={formatNumber(result.metrics.spamPhraseHits)}
                    />
                    <MiniMetric
                      label="Legal tone hits"
                      value={formatNumber(result.metrics.legalToneHits)}
                    />
                  </div>
                </div>

                <div className="dashboard-card">
                  <p className="text-sm font-medium text-slate-900">
                    Suggestions
                  </p>
                  <div className="mt-4 space-y-3">
                    {result.suggestions.length ? (
                      result.suggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {suggestion}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        No major corrective suggestion was generated. The draft already reads relatively safe.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardSection>

      {result ? (
        <>
          <DashboardSection
            title="Section review"
            description="See which part of the draft is increasing or reducing spam risk."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SectionCard title="From Name" section={result.sections.fromName} />
              <SectionCard title="Subject" section={result.sections.subject} />
              <SectionCard title="Preview Text" section={result.sections.previewText} />
              <SectionCard title="Message" section={result.sections.message} />
            </div>
          </DashboardSection>

          <DashboardSection
            title="Detected signals"
            description="Positive and risky signals found during the analysis."
          >
            {!result.signals.length ? (
              <EmptyState
                title="No notable signals"
                description="The current draft did not trigger strong positive or negative content signals."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {result.signals.map((signal, index) => (
                  <div
                    key={`${signal.area}-${signal.label}-${index}`}
                    className="dashboard-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {signal.label}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                          {formatAreaLabel(signal.area)}
                        </p>
                      </div>
                      <SignalBadge tone={signal.tone} />
                    </div>
                    <p className="mt-4 text-sm text-slate-600">{signal.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  section,
}: {
  title: string;
  section: ContentCheckResult["sections"]["fromName"];
}) {
  return (
    <div className="dashboard-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            Section score
          </p>
        </div>
        <Badge variant={mapSectionVariant(section.status)}>
          {section.status}
        </Badge>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
        {formatNumber(section.score)}
      </p>
      <div className="mt-4 space-y-2">
        {section.findings.length ? (
          section.findings.map((finding) => (
            <div
              key={finding}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            >
              {finding}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No notable issues detected.
          </div>
        )}
      </div>
    </div>
  );
}

function SignalBadge({ tone }: { tone: "positive" | "warning" | "risk" }) {
  if (tone === "positive") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
        <ShieldCheck className="h-5 w-5" />
      </div>
    );
  }

  if (tone === "warning") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
        <ShieldMinus className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
      <ShieldAlert className="h-5 w-5" />
    </div>
  );
}

function mapRiskVariant(riskLevel: "low" | "medium" | "high") {
  if (riskLevel === "low") {
    return "success" as const;
  }

  if (riskLevel === "medium") {
    return "warning" as const;
  }

  return "danger" as const;
}

function mapSectionVariant(status: "strong" | "moderate" | "risky") {
  if (status === "strong") {
    return "success" as const;
  }

  if (status === "moderate") {
    return "warning" as const;
  }

  return "danger" as const;
}

function formatAreaLabel(area: "from_name" | "subject" | "preview_text" | "message") {
  if (area === "from_name") {
    return "From name";
  }

  if (area === "preview_text") {
    return "Preview text";
  }

  return area.charAt(0).toUpperCase() + area.slice(1);
}
