import { TemplateEnum } from "@/enums/template-enums";

import TemplateSenderTemp01 from "@/components/senders/template-sender-temp-01";
import TemplateSenderTemp02 from "@/components/senders/template-sender-temp-02";

import Temp01Img from "../../public/images/template-01.png";
import Temp02Img from "../../public/images/template-02.png";

export const TEMPLATE_DATA = {
  [TemplateEnum.TEMP01]: {
    id: TemplateEnum.TEMP01,
    title: "USPTO Trademark Classification Review Notice",
    component: TemplateSenderTemp01,
    previewImage: Temp01Img,
  },
  [TemplateEnum.TEMP02]: {
    id: TemplateEnum.TEMP02,
    title: "USPTO Trademark Application Abandonment Notice",
    component: TemplateSenderTemp02,
    previewImage: Temp02Img,
  },
};
