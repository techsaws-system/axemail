"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { SendAnimation } from "../partials/send-animation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Template01HTML } from "@/components/templates/template-01-html";

import { SendHorizonal } from "lucide-react";
import { apiRequest } from "@/utils/api-request";
import { useSendAvailability } from "@/hooks/use-send-availability";

/* ============================= */
/* VALIDATION */
/* ============================= */
const formSchema = z.object({
  fromName: z.string().min(1, "From Name is required"),
  to: z.string().min(1, "To is required"),
  replyTo: z.string().email("Invalid email").optional().or(z.literal("")),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  examiningOfficer: z.string().min(1, "Examining Officer is required"),
  phone: z.string().min(1, "Phone Number is required"),
  appointmentTime: z.string().min(1, "Appointment Time is required"),
  appointmentNumber: z.string().min(1, "Appointment Number is required"),
  serialNumber: z.string().min(1, "Serial Number is required"),
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

function TemplateSenderTemp01() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  const {
    canSend,
    disabledReason,
    remainingToday,
    dailyLimit,
    refresh,
  } = useSendAvailability();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendEmailTransport = async (payload: any) => {
    return apiRequest("/mail/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setStatus("sending");

    try {
      const html = Template01HTML(values);

      const payload = {
        fromName: values.fromName.trim(),
        to: values.to.trim(),
        replyTo: values.replyTo?.trim() || null,
        cc: values.cc?.trim() || undefined,
        bcc: values.bcc?.trim() || undefined,
        subject: values.subject.trim(),
        html,
        meta: {
          template: "template-fast-01",
          type: "classification-verification",
        },
      };

      await sendEmailTransport(payload);
      await refresh();

      toast.success("Template email processed");
      setStatus("success");

      form.reset();
      form.clearErrors();
    } catch (err) {
      console.error(err);
      toast.error("Send failed");
      setStatus("error");
    }

    setTimeout(() => setStatus("idle"), 1500);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {!canSend && disabledReason ? (
        <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {disabledReason}
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border px-4 py-3 bg-white">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Daily Limit</p>
          <p className="mt-2 text-2xl font-semibold text-heading">{dailyLimit}</p>
        </div>
        <div className="border border-border px-4 py-3 bg-white">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Remaining Today</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{remainingToday}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">
          From Name
        </Label>
        <Input
          {...form.register("fromName")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">To</Label>
          <Input
            {...form.register("to")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Reply To
          </Label>
          <Input
            {...form.register("replyTo")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Subject</Label>
        <Input
          {...form.register("subject")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">CC</Label>
          <Input
            {...form.register("cc")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">BCC</Label>
          <Input
            {...form.register("bcc")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">
          Examining Officer
        </Label>
        <Input
          {...form.register("examiningOfficer")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Phone</Label>
        <Input
          {...form.register("phone")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Appointment Time
          </Label>
          <Input
            {...form.register("appointmentTime")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Appointment Number
          </Label>
          <Input
            {...form.register("appointmentNumber")}
            disabled={!canSend || status === "sending"}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">
          Serial Number
        </Label>
        <Input
          {...form.register("serialNumber")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Date</Label>
        <Input
          {...form.register("date")}
          disabled={!canSend || status === "sending"}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <SendAnimation status={status} />
        <Button
          disabled={!canSend || status === "sending"}
          className="h-[45px] hover:bg-primary-hover rounded-sm"
          onClick={form.handleSubmit(onSubmit)}
        >
          {status === "sending" ? (
            "Sending..."
          ) : (
            <>
              <SendHorizonal className="h-4 w-4" /> Send Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TemplateSenderTemp01;
