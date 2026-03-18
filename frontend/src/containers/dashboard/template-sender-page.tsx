"use client";

import { useState } from "react";

import { TemplateEnum } from "@/enums/template-enums";
import { TEMPLATE_DATA } from "@/data/template-data";

import TemplateTabs from "@/components/includes/template-sender/template-tabs";
import TemplatePreviewer from "@/components/includes/template-sender/template-previewer";

function TemplateSenderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateEnum>(
    TemplateEnum.TEMP01,
  );

  const SelectedComponent = TEMPLATE_DATA[selectedTemplate].component;

  return (
    <main className="dashboard-layout-standard section-padding-standard">
      <h1 className="text-3xl text-heading font-semibold">Template Sender</h1>

      <div className="w-full mt-4 mb-8 h-[2px] rounded-full bg-border" />

      <TemplateTabs
        selected={selectedTemplate}
        onSelect={setSelectedTemplate}
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <SelectedComponent />
        <TemplatePreviewer selected={selectedTemplate} />
      </div>
    </main>
  );
}

export default TemplateSenderPage;
