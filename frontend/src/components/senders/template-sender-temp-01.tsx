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
      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">
          From Name
        </Label>
        <Input
          {...form.register("fromName")}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">To</Label>
          <Input
            {...form.register("to")}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Reply To
          </Label>
          <Input
            {...form.register("replyTo")}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Subject</Label>
        <Input
          {...form.register("subject")}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">CC</Label>
          <Input
            {...form.register("cc")}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">BCC</Label>
          <Input
            {...form.register("bcc")}
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
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Phone</Label>
        <Input
          {...form.register("phone")}
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
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">
            Appointment Number
          </Label>
          <Input
            {...form.register("appointmentNumber")}
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
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Date</Label>
        <Input
          {...form.register("date")}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <SendAnimation status={status} />
        <Button
          disabled={status === "sending"}
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
