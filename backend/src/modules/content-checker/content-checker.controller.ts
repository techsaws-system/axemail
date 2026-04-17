import type { Request, Response } from "express";

import { contentCheckSchema } from "@/modules/content-checker/content-checker.schemas";
import { analyzeContent } from "@/services/content-checker.service";
import { asyncHandler } from "@/utils/async-handler";

export const checkContentHandler = asyncHandler(async (request: Request, response: Response) => {
  const payload = contentCheckSchema.parse(request.body);
  response.json({
    data: analyzeContent(payload),
  });
});
