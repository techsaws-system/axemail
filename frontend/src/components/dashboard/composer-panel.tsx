"use client";

import { useMutation } from "@tanstack/react-query";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { LoaderCircle, Paperclip, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MASK_SENDER_FROM_EMAIL_EXT } from "@/constants/enums";
import { filesToAttachments } from "@/lib/file";
import { getUserErrorMessage } from "@/lib/error-message";
import { formatNumber } from "@/lib/utils";
import type { SenderQuota } from "@/types";

type SenderApiPaths = {
  submit: string;
  attachments: string;
  editor: string;
};

type ComposerPanelProps = {
  quotas: SenderQuota[];
  title: string;
  description: string;
  apiPaths: SenderApiPaths;
  includeFromEmail?: boolean;
  includeCcBcc?: boolean;
  showCooldown?: boolean;
  cooldownLabel?: string;
  onSubmit: (
    payload: Record<string, unknown>,
  ) => Promise<{ id: string; status: string; recipientCount: number }>;
};

export function ComposerPanel({
  quotas,
  title,
  description,
  apiPaths,
  includeFromEmail,
  includeCcBcc = true,
  showCooldown,
  cooldownLabel = "sender",
  onSubmit,
}: ComposerPanelProps) {
  const [content, setContent] = useState("");
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(100);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fromName, setFromName] = useState("");
  const [fromEmailLocalPart, setFromEmailLocalPart] = useState("");
  const [fromEmailExtension, setFromEmailExtension] = useState(
    MASK_SENDER_FROM_EMAIL_EXT.GOV_V1,
  );
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cooldownTimerRef = useRef<number | null>(null);
  const attachmentLimitBytes = 25 * 1024 * 1024;
  const cooldownSchedule = [20, 35, 50, 70, 90];

  const attachmentBytes = useMemo(
    () => attachments.reduce((total, file) => total + file.size, 0),
    [attachments],
  );
  const remainingAttachmentBytes = Math.max(
    attachmentLimitBytes - attachmentBytes,
    0,
  );
  const totalAssignedQuota = quotas.reduce(
    (total, quota) => total + quota.assignedLimit,
    0,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalUsedQuota = quotas.reduce((total, quota) => total + quota.used, 0);
  const totalRemainingQuota = quotas.reduce(
    (total, quota) => total + Math.max(quota.assignedLimit - quota.used, 0),
    0,
  );
  const noLimitAssigned = totalAssignedQuota === 0;
  const quotaExhausted = !noLimitAssigned && totalRemainingQuota === 0;
  const hasAvailableQuota = totalRemainingQuota > 0;
  const inputsDisabled = noLimitAssigned || quotaExhausted;
  const fromEmail = includeFromEmail
    ? `${fromEmailLocalPart.trim()}@uspto.${fromEmailExtension}`
    : "";
  const quotaBannerMessage = noLimitAssigned
    ? "No limit assigned for this sender."
    : quotaExhausted
      ? "Daily limit reached for today."
      : null;
  const sendMutation = useMutation({
    mutationFn: async () => {
      const encodedAttachments = await filesToAttachments(attachments);
      return onSubmit({
        fromName,
        ...(includeFromEmail ? { fromEmail } : {}),
        to,
        ...(includeCcBcc ? { cc, bcc } : {}),
        subject,
        previewText: previewText || undefined,
        replyTo,
        attachments: encodedAttachments,
        content,
      });
    },
    onSuccess: () => {
      toast.success("Email sent successfully.");
      setTo("");
      setSubject("");
      setCc("");
      setBcc("");
      setPreviewText("");
      setReplyTo("");
      setAttachments([]);
      setContent("");
      if (includeFromEmail) {
        setFromEmailLocalPart("");
        setFromEmailExtension(MASK_SENDER_FROM_EMAIL_EXT.GOV_V1);
      }
      if (showCooldown) {
        triggerCooldown();
      }
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  function triggerCooldown() {
    startTransition(() => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
      }

      const durationSeconds =
        cooldownSchedule[Math.floor(Math.random() * cooldownSchedule.length)] ??
        20;

      setCooldownActive(true);
      setCooldownSecondsRemaining(durationSeconds);
      setCooldownProgress(0);

      cooldownTimerRef.current = window.setInterval(() => {
        setCooldownSecondsRemaining((current) => {
          const nextValue = current - 1;
          const clampedValue = Math.max(nextValue, 0);
          setCooldownProgress(
            ((durationSeconds - clampedValue) / durationSeconds) * 100,
          );

          if (clampedValue === 0) {
            if (cooldownTimerRef.current) {
              window.clearInterval(cooldownTimerRef.current);
              cooldownTimerRef.current = null;
            }
            setCooldownActive(false);
            setCooldownProgress(100);
            return 0;
          }

          return clampedValue;
        });
      }, 1000);
    });
  }

  function handleAttachmentSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setAttachments((current) => {
      const next = [...current];
      let bytes = current.reduce((total, file) => total + file.size, 0);

      for (const file of files) {
        if (bytes + file.size > attachmentLimitBytes) {
          continue;
        }
        next.push(file);
        bytes += file.size;
      }

      return next;
    });

    event.target.value = "";
  }

  function removeAttachment(targetName: string) {
    setAttachments((current) =>
      current.filter((file) => file.name !== targetName),
    );
  }

  return (
    <div className="space-y-6">
      {quotaBannerMessage ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 shadow-[0_18px_35px_rgba(245,158,11,0.08)]">
          <p className="text-sm font-semibold text-amber-800">
            {quotaBannerMessage}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Sending is unavailable for this sender right now. Review sender
            capacity below before continuing.
          </p>
        </div>
      ) : null}

      {showCooldown ? (
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Cooldown window
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {cooldownActive
                  ? `Sending is paused while the ${cooldownLabel} window cools down.`
                  : `The next send will start an automatic ${cooldownLabel} cooldown.`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Countdown
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {cooldownActive
                  ? formatCountdown(cooldownSecondsRemaining)
                  : "Ready"}
              </p>
            </div>
          </div>
          <Progress className="mt-5" value={cooldownProgress} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6">
        <div className="dashboard-card">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-900">
              Sender capacity
            </p>
          </div>
          <div className="space-y-4">
            {quotas.map((quota) => {
              const remaining = quota.assignedLimit - quota.used;
              return (
                <div
                  key={quota.id}
                  className={`rounded-[1.25rem] border px-4 py-4 ${remaining === 0 ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-slate-50/70"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-slate-900">
                        {quota.label}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                        {quota.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <Metric
                      label="Assigned"
                      value={formatNumber(quota.assignedLimit)}
                    />
                    <Metric label="Used" value={formatNumber(quota.used)} />
                    <Metric label="Remaining" value={formatNumber(remaining)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="mb-6">
            <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              {title}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              {description}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="From Name" disabled={inputsDisabled} required>
              <Input
                placeholder="Axemail Operations"
                disabled={inputsDisabled}
                value={fromName}
                onChange={(event) => setFromName(event.target.value)}
              />
            </Field>
            {includeFromEmail ? (
              <Field label="From Email" disabled={inputsDisabled} required>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
                  <Input
                    placeholder="sender"
                    disabled={inputsDisabled}
                    value={fromEmailLocalPart}
                    onChange={(event) => setFromEmailLocalPart(event.target.value)}
                  />
                  <div className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                    @uspto.
                  </div>
                  <Select
                    value={fromEmailExtension}
                    onValueChange={(value) => setFromEmailExtension(value as typeof fromEmailExtension)}
                    disabled={inputsDisabled}
                  >
                    <SelectTrigger className={`w-[110px] ${inputsDisabled ? "border-slate-200 bg-slate-100 text-slate-400" : ""}`}>
                      <SelectValue placeholder="Ext" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Object.values(MASK_SENDER_FROM_EMAIL_EXT).map((extension) => (
                        <SelectItem key={extension} value={extension}>
                          {extension}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
            ) : null}
            <Field label="To" disabled={inputsDisabled} required>
              <Input
                placeholder="recipient@company.com"
                disabled={inputsDisabled}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
            <Field label="Subject" disabled={inputsDisabled} required>
              <Input
                placeholder="Campaign subject"
                disabled={inputsDisabled}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>
            {includeCcBcc ? (
              <Field label="CC" optional disabled={inputsDisabled}>
                <Input
                  placeholder="cc@company.com"
                  disabled={inputsDisabled}
                  value={cc}
                  onChange={(event) => setCc(event.target.value)}
                />
              </Field>
            ) : null}
            {includeCcBcc ? (
              <Field label="BCC" optional disabled={inputsDisabled}>
                <Input
                  placeholder="bcc@company.com"
                  disabled={inputsDisabled}
                  value={bcc}
                  onChange={(event) => setBcc(event.target.value)}
                />
              </Field>
            ) : null}
            <Field label="Preview Text" optional disabled={inputsDisabled}>
              <Input
                placeholder="Short preview shown in the inbox"
                disabled={inputsDisabled}
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
              />
            </Field>
            <Field label="Reply-To" disabled={inputsDisabled} required>
              <Input
                placeholder="reply@axemail.io"
                disabled={inputsDisabled}
                value={replyTo}
                onChange={(event) => setReplyTo(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Attachments" disabled={inputsDisabled}>
              <div className="mt-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Attachments
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Maximum total size {formatFileSize(attachmentLimitBytes)}.
                      Remaining capacity{" "}
                      {formatFileSize(remainingAttachmentBytes)}.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentSelect}
                      disabled={inputsDisabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={
                        inputsDisabled || remainingAttachmentBytes === 0
                      }
                      data-attachment-endpoint={apiPaths.attachments}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {attachments.length ? (
                    attachments.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                            <Paperclip className="h-4 w-4 text-slate-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {file.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={inputsDisabled}
                          onClick={() => removeAttachment(file.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      No files uploaded.
                    </div>
                  )}
                </div>
              </div>
            </Field>
          </div>

          <div className="mt-5">
            <Label className={inputsDisabled ? "text-slate-400" : undefined}>
              Message
            </Label>
            <div className="mt-3">
              <RichTextEditor
                value={content}
                onChange={setContent}
                disabled={inputsDisabled}
                apiPath={apiPaths.editor}
              />
            </div>
          </div>

          <div className="mt-6 flex w-full items-center justify-end">
            <Button
              className="bg-slate-950 text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
              variant="default"
              disabled={
                inputsDisabled ||
                cooldownActive ||
                sendMutation.isPending ||
                !hasAvailableQuota ||
                !fromName ||
                !to ||
                !subject ||
                !replyTo ||
                (includeFromEmail && !fromEmailLocalPart.trim())
              }
              data-submit-endpoint={apiPaths.submit}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <>
                  Sending
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Send email"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  optional,
  required,
  disabled,
  children,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Label className={disabled ? "text-slate-400" : undefined}>
          {label}
          {required ? <span className="ml-1 text-rose-500">*</span> : null}
          {optional ? (
            <span
              className={`ml-1 ${disabled ? "text-slate-300" : "text-slate-400"}`}
            >
              (optional)
            </span>
          ) : null}
        </Label>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.ceil(size / 1024)} KB`;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
