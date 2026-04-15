"use client";

import { Extension } from "@tiptap/core";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineAlign: {
      setInlineAlign: (alignment: "left" | "center" | "right") => ReturnType;
      unsetInlineAlign: () => ReturnType;
    };
  }
}

const InlineAlign = Extension.create({
  name: "inlineAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.textAlign || null,
            renderHTML: (attributes: { textAlign?: string | null }) =>
              attributes.textAlign
                ? {
                    style: `text-align:${attributes.textAlign};display:block;width:100%;`,
                  }
                : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setInlineAlign:
        (alignment) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textAlign: alignment }).run(),
      unsetInlineAlign:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { textAlign: null }).run(),
    };
  },
});

const fonts = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana"];
const fontSizes = ["12px", "14px", "16px", "18px", "24px"];

export function RichTextEditor({
  value,
  onChange,
  disabled,
  apiPath,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  apiPath?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      InlineAlign,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[240px] rounded-b-[1.5rem] px-5 py-4 text-sm leading-7 text-slate-800 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;
    editor.commands.setContent(value);
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-200 bg-white",
        disabled && "opacity-60",
      )}
      data-editor-endpoint={apiPath}
    >
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
        <Select
          defaultValue="Arial"
          onValueChange={(font) => editor.chain().focus().setFontFamily(font).run()}
          disabled={disabled}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Font family" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          defaultValue="14px"
          onValueChange={(fontSize) =>
            editor.chain().focus().setFontSize(fontSize).run()
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-27.5">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((fontSize) => (
              <SelectItem key={fontSize} value={fontSize}>
                {fontSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToolbarButton
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          disabled={disabled}
          onClick={() => editor.chain().focus().setInlineAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.getAttributes("textStyle").textAlign === "center"}
          disabled={disabled}
          onClick={() => editor.chain().focus().setInlineAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.getAttributes("textStyle").textAlign === "right"}
          disabled={disabled}
          onClick={() => editor.chain().focus().setInlineAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          disabled={disabled}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt("Enter URL", previousUrl || "https://");
            if (url === null) return;
            if (!url) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="icon"
      disabled={disabled}
      onClick={onClick}
      className={active ? "border-slate-900 bg-slate-900 text-white" : ""}
    >
      {children}
    </Button>
  );
}
