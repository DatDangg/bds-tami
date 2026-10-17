import type { CollectionConfig } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { MONTH_PATTERN } from "../lib/translation/budget";

/**
 * Mức dùng Claude API theo tháng (ERD §4.13, BR-08). Chỉ admin đọc; không ai ghi qua API (PERMISSION §4):
 * `TranslationService` cộng dồn bằng một câu SQL nguyên tử (xem `lib/translation/budget.ts`), job/dashboard đọc bằng Local API.
 */
export const TranslationUsage: CollectionConfig = {
  slug: "translation-usage",
  admin: {
    useAsTitle: "month",
    defaultColumns: ["month", "requests", "inputTokens", "outputTokens", "estimatedCostUsd"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  fields: [
    {
      name: "month",
      type: "text",
      required: true,
      unique: true,
      validate: (value: string | null | undefined) =>
        typeof value === "string" && MONTH_PATTERN.test(value) ? true : "Tháng phải có dạng YYYY-MM",
    },
    { name: "inputTokens", type: "number", required: true, min: 0, defaultValue: 0 },
    { name: "outputTokens", type: "number", required: true, min: 0, defaultValue: 0 },
    { name: "requests", type: "number", required: true, min: 0, defaultValue: 0 },
    { name: "estimatedCostUsd", type: "number", required: true, min: 0, defaultValue: 0 },
  ],
};
