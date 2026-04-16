"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";

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
import {
  MASK_SENDER_FROM_EMAIL_EXT,
  SENDER_TYPE,
  TEMPLATE_KEY,
  type MaskSenderFromEmailExt,
  type SenderType,
  type TemplateKey,
} from "@/constants/enums";
import {
  getSenderCards,
  sendDomainCampaign,
  sendGmailCampaign,
  sendMaskCampaign,
} from "@/lib/api";
import { getUserErrorMessage } from "@/lib/error-message";
import { templateList, templates } from "@/templates";
import type { Template01HTMLValues } from "@/templates/template-01";
import type { Template02HTMLValues } from "@/templates/template-02";
import type { Template03HTMLValues } from "@/templates/template-03";

type TemplatePayloadFields = {
  fromName: string;
  fromEmailLocalPart: string;
  fromEmailExtension: MaskSenderFromEmailExt;
  to: string;
  replyTo: string;
  subject: string;
  previewText: string;
};

const emptyPayloadFields: TemplatePayloadFields = {
  fromName: "",
  fromEmailLocalPart: "",
  fromEmailExtension: MASK_SENDER_FROM_EMAIL_EXT.GOV_V1,
  to: "",
  replyTo: "",
  subject: "",
  previewText: "",
};

export default function TemplateSenderPage() {
  const senderCardsQuery = useQuery({
    queryKey: ["sender-cards"],
    queryFn: getSenderCards,
  });
  const [senderType, setSenderType] = useState<SenderType>(SENDER_TYPE.GMAIL);
  const [templateKey, setTemplateKey] = useState<TemplateKey>(
    TEMPLATE_KEY.TEMPLATE_01,
  );
  const [payloadFields, setPayloadFields] =
    useState<TemplatePayloadFields>(emptyPayloadFields);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(100);
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const cooldownSchedule = [20, 35, 50, 70, 90];
  const activeQuota = senderCardsQuery.data?.find(
    (item) => item.type === senderType,
  );
  const availableTemplates = useMemo(
    () =>
      templateList.filter((template) =>
        template.supportedSenders.includes(senderType),
      ),
    [senderType],
  );
  const activeTemplateKey = availableTemplates.some(
    (template) => template.key === templateKey,
  )
    ? templateKey
    : (availableTemplates[0]?.key ?? TEMPLATE_KEY.TEMPLATE_01);
  const activeTemplate = templates[activeTemplateKey];
  const [values, setValues] = useState<Record<string, string>>(() =>
    createEmptyTemplateValues(activeTemplate),
  );
  const sendMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      if (senderType === SENDER_TYPE.DOMAIN) {
        return sendDomainCampaign(payload);
      }

      if (senderType === SENDER_TYPE.MASK) {
        return sendMaskCampaign(payload);
      }

      return sendGmailCampaign(payload);
    },
    onSuccess: () => {
      toast.success("Email sent successfully.");

      // setPayloadFields({
      //   ...emptyPayloadFields,
      //   fromEmailExtension: MASK_SENDER_FROM_EMAIL_EXT.GOV_V1,
      // });
      // setValues(createEmptyTemplateValues(activeTemplate));

      setPayloadFields((current) => ({
        ...current,
        to: "",
      }));

      triggerCooldown();
    },
    onError: (error) => {
      toast.error(getUserErrorMessage(error));
    },
  });

  const renderedHtml = renderTemplate(activeTemplateKey, values);
  const isDomain = senderType === SENDER_TYPE.DOMAIN;
  const isGmail = senderType === SENDER_TYPE.GMAIL;
  const isMask = senderType === SENDER_TYPE.MASK;
  const fromEmail = isMask
    ? `${payloadFields.fromEmailLocalPart.trim()}@uspto.${payloadFields.fromEmailExtension}`
    : "";
  const assignedQuota = activeQuota?.assignedLimit ?? 0;
  const usedQuota = activeQuota?.used ?? 0;
  const remainingQuota =
    activeQuota?.remaining ?? Math.max(assignedQuota - usedQuota, 0);
  const noLimitAssigned = assignedQuota === 0;
  const quotaExhausted = !noLimitAssigned && remainingQuota === 0;
  const inputsDisabled =
    sendMutation.isPending || noLimitAssigned || quotaExhausted;
  const quotaBannerMessage = noLimitAssigned
    ? "No limit assigned for the selected sender."
    : quotaExhausted
      ? "Daily limit reached for the selected sender."
      : null;

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setValues(createEmptyTemplateValues(activeTemplate));
  }, [activeTemplate]);

  function handleSenderChange(nextSender: SenderType) {
    setSenderType(nextSender);
    setPayloadFields(emptyPayloadFields);
    setCooldownActive(false);
    setCooldownProgress(100);
    setCooldownSecondsRemaining(0);
    if (cooldownTimerRef.current) {
      window.clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }

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

  function submitTemplate() {
    const payload: Record<string, unknown> = {
      fromName: payloadFields.fromName,
      to: payloadFields.to,
      replyTo: payloadFields.replyTo,
      subject: payloadFields.subject,
      previewText: payloadFields.previewText || undefined,
      content: renderedHtml,
    };

    if (isMask) {
      payload.fromEmail = fromEmail;
    }

    sendMutation.mutate(payload);
  }

  return (
    <div className="space-y-6">
      {quotaBannerMessage ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 shadow-[0_18px_35px_rgba(245,158,11,0.08)]">
          <p className="text-sm font-semibold text-amber-800">
            {quotaBannerMessage}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Sending is unavailable for the selected sender right now.
          </p>
        </div>
      ) : null}

      <div className="dashboard-card">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Template delivery
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Select the sender route, complete the required fields, and
              dispatch a rendered template.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={senderType}
              onValueChange={(value) => handleSenderChange(value as SenderType)}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Select sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SENDER_TYPE.GMAIL}>Gmail</SelectItem>
                <SelectItem value={SENDER_TYPE.DOMAIN}>Domain</SelectItem>
                <SelectItem value={SENDER_TYPE.MASK}>Mask</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={activeTemplateKey}
              onValueChange={(value) => setTemplateKey(value as TemplateKey)}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isDomain || isGmail || isMask ? (
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {isDomain
                  ? "Domain cooldown"
                  : isGmail
                    ? "Gmail cooldown"
                    : "Mask cooldown"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {cooldownActive
                  ? "Sending is paused while the selected sender cools down."
                  : "The next send will start an automatic cooldown."}
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

      <div className="dashboard-card">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Delivery details
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The selected template is rendered client-side and submitted
              through the sender endpoint.
            </p>
          </div>
          {activeQuota ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Remaining quota
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {activeQuota.remaining}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="From Name" disabled={inputsDisabled}>
            <Input
              placeholder="Sender display name"
              value={payloadFields.fromName}
              disabled={inputsDisabled}
              onChange={(event) =>
                setPayloadFields((current) => ({
                  ...current,
                  fromName: event.target.value,
                }))
              }
            />
          </Field>

          {isMask ? (
            <Field label="From Email" disabled={inputsDisabled}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
                <Input
                  placeholder="sender"
                  value={payloadFields.fromEmailLocalPart}
                  disabled={inputsDisabled}
                  onChange={(event) =>
                    setPayloadFields((current) => ({
                      ...current,
                      fromEmailLocalPart: event.target.value,
                    }))
                  }
                />
                <div className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                  @uspto.
                </div>
                <Select
                  value={payloadFields.fromEmailExtension}
                  onValueChange={(value) =>
                    setPayloadFields((current) => ({
                      ...current,
                      fromEmailExtension: value as MaskSenderFromEmailExt,
                    }))
                  }
                  disabled={inputsDisabled}
                >
                  <SelectTrigger
                    className={`w-27.5 ${inputsDisabled ? "border-slate-200 bg-slate-100 text-slate-400" : ""}`}
                  >
                    <SelectValue placeholder="Ext" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.values(MASK_SENDER_FROM_EMAIL_EXT).map(
                      (extension) => (
                        <SelectItem key={extension} value={extension}>
                          {extension}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </Field>
          ) : null}

          <Field label="To" disabled={inputsDisabled}>
            <Input
              placeholder="recipient@company.com"
              value={payloadFields.to}
              disabled={inputsDisabled}
              onChange={(event) =>
                setPayloadFields((current) => ({
                  ...current,
                  to: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Subject" disabled={inputsDisabled}>
            <Input
              placeholder="Campaign subject"
              value={payloadFields.subject}
              disabled={inputsDisabled}
              onChange={(event) =>
                setPayloadFields((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Reply-To" disabled={inputsDisabled}>
            <Input
              placeholder="reply@company.com"
              value={payloadFields.replyTo}
              disabled={inputsDisabled}
              onChange={(event) =>
                setPayloadFields((current) => ({
                  ...current,
                  replyTo: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Preview Text" optional disabled={inputsDisabled}>
            <Input
              placeholder="Inbox preview text"
              value={payloadFields.previewText}
              disabled={inputsDisabled}
              onChange={(event) =>
                setPayloadFields((current) => ({
                  ...current,
                  previewText: event.target.value,
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-900">Template fields</p>
          <p className="mt-1 text-sm text-slate-500">{activeTemplate.title}</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {activeTemplate.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              optional={field.optional}
              disabled={inputsDisabled}
            >
              <Input
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                value={(values[field.key] as string | undefined) ?? ""}
                disabled={inputsDisabled}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </Field>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Button
            variant="default"
            disabled={
              cooldownActive ||
              inputsDisabled ||
              !payloadFields.fromName ||
              !payloadFields.to ||
              !payloadFields.replyTo ||
              !payloadFields.subject ||
              (isMask && !payloadFields.fromEmailLocalPart.trim())
            }
            onClick={submitTemplate}
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
  );
}

function createEmptyTemplateValues(
  template: (typeof templates)[TemplateKey],
): Record<string, string> {
  return template.fields.reduce<Record<string, string>>(
    (accumulator, field) => {
      accumulator[field.key] = "";
      return accumulator;
    },
    {},
  );
}

function renderTemplate(
  templateKey: TemplateKey,
  values: Record<string, string>,
) {
  switch (templateKey) {
    case TEMPLATE_KEY.TEMPLATE_01:
      return templates[TEMPLATE_KEY.TEMPLATE_01].render(
        values as Template01HTMLValues,
      );
    case TEMPLATE_KEY.TEMPLATE_02:
      return templates[TEMPLATE_KEY.TEMPLATE_02].render(
        values as Template02HTMLValues,
      );
    case TEMPLATE_KEY.TEMPLATE_03:
      return templates[TEMPLATE_KEY.TEMPLATE_03].render(
        values as Template03HTMLValues,
      );
    default:
      return "";
  }
}

function Field({
  label,
  optional,
  disabled,
  className,
  children,
}: {
  label: string;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Label className={disabled ? "text-slate-400" : undefined}>
          {label}
        </Label>
        {optional ? (
          <span
            className={`text-[11px] uppercase tracking-[0.22em] ${disabled ? "text-slate-300" : "text-slate-400"}`}
          >
            (OPTIONAL)
          </span>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
