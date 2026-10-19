import type { CollectionConfig } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";
import { MONTH_PATTERN } from "../lib/translation/budget";

/**
 * Mức dùng Claude API theo tháng (ERD §4.13, BR-08). Chỉ admin đọc; không ai ghi qua API (PERMISSION §4):
 * `TranslationService` cộng dồn bằng một câu SQL nguyên tử (xem `lib/translation/budget.ts`), job/dashboard đọc bằng Local API.
 */
export const TranslationUsage: CollectionConfig = {
  slug: "translation-usage",
  labels: collectionLabels("translation-usage"),
  admin: {
    useAsTitle: "month",
    defaultColumns: ["month", "requests", "inputTokens", "outputTokens", "estimatedCostUsd"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Mức dùng AI dịch theo tháng (số lần gọi, token, chi phí ước tính) để theo dõi hạn mức.",
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  fields: [
    {
      name: "month",
      type: "text",
      label: "Tháng (YYYY-MM)",
      required: true,
      unique: true,
      validate: (value: string | null | undefined) =>
        typeof value === "string" && MONTH_PATTERN.test(value) ? true : "Tháng phải có dạng YYYY-MM",
    },
    { name: "inputTokens", type: "number", label: "Token đầu vào", required: true, min: 0, defaultValue: 0 },
    { name: "outputTokens", type: "number", label: "Token đầu ra", required: true, min: 0, defaultValue: 0 },
    { name: "requests", type: "number", label: "Số lần gọi AI", required: true, min: 0, defaultValue: 0 },
    { name: "estimatedCostUsd", type: "number", label: "Chi phí ước tính (USD)", required: true, min: 0, defaultValue: 0 },
  ],
};
