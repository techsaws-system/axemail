"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import axios from "axios";
import { toast } from "react-hot-toast";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import { CharCounter } from "../includes/sender-01/char-counter";
import { SendAnimation } from "../partials/send-animation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { apiRequest } from "@/utils/api-request";
import { useSendAvailability } from "@/hooks/use-send-availability";

import {
  SendHorizonal,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Paperclip,
  X,
} from "lucide-react";

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
});

type FormValues = z.infer<typeof formSchema>;

/* ============================= */
/* TOOLBAR BUTTON */
/* ============================= */

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-9 w-9 inline-flex items-center justify-center rounded-none border",
        "border-border bg-black hover:bg-black/80 text-white",
        active ? "ring-2 ring-primary" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ============================= */
/* EMAIL EDITOR */
/* ============================= */
function EmailEditor({
  value,
  onChange,
  disabled,
  resetKey,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  resetKey: number;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your email…" }),
    ],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!editor) return null;

  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          disabled={!!disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          disabled={!!disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          disabled={!!disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Bullets"
          active={editor.isActive("bulletList")}
          disabled={!!disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Ordered"
          active={editor.isActive("orderedList")}
          disabled={!!disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Link"
          disabled={!!disabled}
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Undo"
          disabled={!!disabled}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Redo"
          disabled={!!disabled}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="min-h-[200px] border rounded-md p-3 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Sender01() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [html, setHtml] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editorResetKey, setEditorResetKey] = useState(0);
  const {
    canSend,
    disabledReason,
    remainingToday,
    dailyLimit,
    refresh,
  } = useSendAvailability();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendEmailTransport = async (payload: any) => {
    return apiRequest("/mail/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!html || html.trim().length < 5) {
      toast.error("Email body is too short");
      return;
    }

    setStatus("sending");

    try {
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await fileToBase64(file),
          contentType: file.type || "application/octet-stream",
        })),
      );

      const payload = {
        fromName: values.fromName.trim(),
        to: values.to.trim(),
        subject: values.subject.trim(),
        html,
        replyTo: values.replyTo?.trim() || undefined,
        cc: values.cc?.trim() || undefined,
        bcc: values.bcc?.trim() || undefined,
        attachments: processedAttachments.length
          ? processedAttachments
          : undefined,
      };

      await sendEmailTransport(payload);
      await refresh();

      toast.success("Email processed");
      setStatus("success");

      form.reset({
        fromName: "",
        to: "",
        replyTo: "",
        cc: "",
        bcc: "",
        subject: "",
      });
      setHtml("");
      setAttachments([]);
      setEditorResetKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      toast.error("Send failed");
      setStatus("error");
    }

    setTimeout(() => setStatus("idle"), 1500);
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const subjectValue = form.watch("subject") || "";
  const isDisabled = !canSend || status === "sending";

  return (
    <div className="w-full flex flex-col gap-6">
      {!canSend && disabledReason ? (
        <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {disabledReason}
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border border-border px-4 py-3 bg-white">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Daily Limit</p>
          <p className="mt-2 text-2xl font-semibold text-heading">{dailyLimit}</p>
        </div>
        <div className="border border-border px-4 py-3 bg-white">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Remaining Today</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{remainingToday}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">From Name</Label>
          <Input
            {...form.register("fromName")}
            disabled={isDisabled}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">To</Label>
          <Input
            {...form.register("to")}
            disabled={isDisabled}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Reply To</Label>
        <Input
          {...form.register("replyTo")}
          disabled={isDisabled}
          className="h-[50px] border-border rounded-none bg-white"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 gap-y-6">
        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">CC</Label>
          <Input
            {...form.register("cc")}
            disabled={isDisabled}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label className="font-medium text-heading">BCC</Label>
          <Input
            {...form.register("bcc")}
            disabled={isDisabled}
            className="h-[50px] border-border rounded-none bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label className="font-medium text-heading">Subject</Label>
        <Input
          {...form.register("subject")}
          disabled={isDisabled}
          className="h-[50px] border-border rounded-none bg-white"
        />
        <CharCounter value={subjectValue} limit={150} />
      </div>

      <Separator className="h-[2px] rounded-full bg-border" />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          disabled={isDisabled}
          className="h-[45px] hover:bg-primary-hover rounded-none"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Paperclip className="h-4 w-4" /> Attachment
        </Button>

        <input
          id="file-input"
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          className="hidden"
          disabled={isDisabled}
          onChange={(e) => {
            const newFiles = Array.from(e.target.files || []);

            const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

            const totalSize = [...attachments, ...newFiles].reduce(
              (acc, file) => acc + file.size,
              0,
            );

            if ([...attachments, ...newFiles].length > 5) {
              toast.error("Maximum 5 attachments allowed");
              e.currentTarget.value = "";
              return;
            }

            if (totalSize > MAX_TOTAL_SIZE) {
              toast.error("Total attachments exceed 10MB");
              e.currentTarget.value = "";
              return;
            }

            setAttachments((prev) => [...prev, ...newFiles]);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1 border rounded-full"
            >
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <EmailEditor value={html} onChange={setHtml} resetKey={editorResetKey} disabled={isDisabled} />

      <div className="flex items-center justify-between mt-4">
        <SendAnimation status={status} />
        <Button
          disabled={isDisabled}
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

export default Sender01;
