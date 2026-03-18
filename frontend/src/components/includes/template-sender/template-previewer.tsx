"use client";

import Image from "next/image";
import { TemplateEnum } from "@/enums/template-enums";

import { TEMPLATE_DATA } from "@/data/template-data";

type Props = {
  selected: TemplateEnum;
};

export default function TemplatePreviewer({ selected }: Props) {
  const template = TEMPLATE_DATA[selected];

  if (!template) return null;

  return (
    <div className="border rounded-lg border-border overflow-hidden h-fit">
      <Image
        src={template.previewImage}
        alt={template.title}
        className="object-cover"
      />
    </div>
  );
}
