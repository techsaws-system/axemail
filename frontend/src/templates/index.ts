import { SENDER_TYPE, TEMPLATE_KEY, type SenderType, type TemplateKey } from "@/constants/enums";
import { Template01HTML, type Template01HTMLValues } from "@/templates/template-01";
import { Template02HTML, type Template02HTMLValues } from "@/templates/template-02";
import { Template03HTML, type Template03HTMLValues } from "@/templates/template-03";

export type TemplateValues = Record<string, string>;

export type TemplateField<TValues extends TemplateValues = TemplateValues> = {
  key: keyof TValues & string;
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "datetime-local";
  optional?: boolean;
};

export type TemplateDefinition<TValues extends TemplateValues = TemplateValues> = {
  key: TemplateKey;
  title: string;
  supportedSenders: SenderType[];
  fields: TemplateField<TValues>[];
  render: (values: TValues) => string;
};

function defineTemplate<TValues extends TemplateValues>(definition: TemplateDefinition<TValues>) {
  return definition;
}

type TemplateRegistry = {
  [TEMPLATE_KEY.TEMPLATE_01]: TemplateDefinition<Template01HTMLValues>;
  [TEMPLATE_KEY.TEMPLATE_02]: TemplateDefinition<Template02HTMLValues>;
  [TEMPLATE_KEY.TEMPLATE_03]: TemplateDefinition<Template03HTMLValues>;
};

export const templates: TemplateRegistry = {
  [TEMPLATE_KEY.TEMPLATE_01]: defineTemplate<Template01HTMLValues>({
    key: TEMPLATE_KEY.TEMPLATE_01,
    title: "Review Notice",
    supportedSenders: [SENDER_TYPE.GMAIL, SENDER_TYPE.DOMAIN, SENDER_TYPE.MASK],
    fields: [
      { key: "examiningOfficer", label: "Examining Officer", placeholder: "Jonathan Miller" },
      { key: "phone", label: "Phone", placeholder: "(800) 555-0147", type: "tel" },
      { key: "appointmentTime", label: "Appointment Time", placeholder: "10:30 AM EST" },
      { key: "appointmentNumber", label: "Appointment Number", placeholder: "APT-2026-10421" },
      { key: "serialNumber", label: "Serial Number", placeholder: "97/123,456" },
      { key: "date", label: "Date", placeholder: "2026-04-10" },
    ],
    render: Template01HTML,
  }),
  [TEMPLATE_KEY.TEMPLATE_02]: defineTemplate<Template02HTMLValues>({
    key: TEMPLATE_KEY.TEMPLATE_02,
    title: "Abandonment Notice",
    supportedSenders: [SENDER_TYPE.GMAIL, SENDER_TYPE.DOMAIN, SENDER_TYPE.MASK],
    fields: [
      { key: "examiningOfficer", label: "Examining Officer", placeholder: "Jonathan Miller" },
      { key: "phone", label: "Phone", placeholder: "(800) 555-0147", type: "tel" },
      { key: "appointmentTime", label: "Appointment Time", placeholder: "10:30 AM EST" },
      { key: "appointmentNumber", label: "Appointment Number", placeholder: "APT-2026-10421" },
      { key: "serialNumber", label: "Serial Number", placeholder: "97/123,456" },
      { key: "date", label: "Date", placeholder: "2026-04-10" },
    ],
    render: Template02HTML,
  }),
  [TEMPLATE_KEY.TEMPLATE_03]: defineTemplate<Template03HTMLValues>({
    key: TEMPLATE_KEY.TEMPLATE_03,
    title: "Initial Examination Notice",
    supportedSenders: [SENDER_TYPE.GMAIL, SENDER_TYPE.DOMAIN, SENDER_TYPE.MASK],
    fields: [
      { key: "serialNumber", label: "Serial Number", placeholder: "97/123,456" },
      { key: "examiningOfficer", label: "Examining Officer", placeholder: "Jonathan Miller" },
      { key: "phone", label: "Phone", placeholder: "(800) 555-0147", type: "tel" },
      { key: "appointmentReference", label: "Appointment Reference", placeholder: "APT-2026-10421" },
      { key: "availability", label: "Availability", placeholder: "Monday to Friday, 9:00 AM - 5:00 PM EST" },
      { key: "date", label: "Date", placeholder: "2026-04-10" },
    ],
    render: Template03HTML,
  }),
};

export const templateList = Object.values(templates);
