"use client";

import Image from "next/image";

import { TemplateEnum } from "@/enums/template-enums";

import { TEMPLATE_DATA } from "@/data/template-data";

import { cn } from "@/lib/utils";

type Props = {
  selected: TemplateEnum;
  onSelect: (template: TemplateEnum) => void;
};

export default function TemplateTabs({ selected, onSelect }: Props) {
  return (
    <div className="mb-12 flex items-center flex-wrap w-full gap-6">
      {Object.values(TEMPLATE_DATA).map((template) => (
        <div key={template.id} className="flex flex-col items-center gap-4">
          <div
            onClick={() => onSelect(template.id)}
            className={cn(
              "h-[200px] w-[200px] rounded-[10px] animation-standard bg-black/10 flex-center p-4 cursor-pointer",
              selected === template.id
                ? "ring-2 ring-accent"
                : "hover:bg-black/40 border-2 border-border",
            )}
          >
            <Image
              src={template.previewImage}
              className="rounded-sm object-cover border-border border shadow-2xl"
              alt={template.title}
            />
          </div>

          <h1
            className={cn(
              "text-[16px] leading-[22px] font-semibold max-w-[250px] text-center mx-auto",
              selected === template.id ? "text-accent" : "text-heading",
            )}
          >
            {template.title}
          </h1>
        </div>
      ))}
    </div>
  );
}
