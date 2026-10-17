import type { CheckboxField, Field, GroupField } from "payload";

import { denyAll } from "../access";

const readOnlyForEveryone = { create: denyAll, update: denyAll };

const options = (values: readonly string[]) => values.map((value) => ({ label: value, value }));

/** Bật khi đủ trường EN bắt buộc (ERD §1.1); logic bật nằm ở task dịch. Hook chặn bật khi thiếu: `require-english-fields`. */
function hasEnglishField(): CheckboxField {
  return {
    name: "hasEnglish",
    type: "checkbox",
    defaultValue: false,
    index: true,
    access: readOnlyForEveryone,
    admin: { position: "sidebar", readOnly: true },
  };
}

/** Trạng thái dịch (ERD §1.1): không localized, hệ thống ghi, mọi người chỉ đọc (PERMISSION §4). */
function translationGroup(): GroupField {
  return {
    name: "translation",
    type: "group",
    access: readOnlyForEveryone,
    admin: { readOnly: true },
    fields: [
      {
        name: "status",
        type: "select",
        index: true,
        defaultValue: "none",
        options: options(["none", "queued", "done", "failed", "pending_review"]),
      },
      { name: "enSource", type: "select", options: options(["ai", "manual"]) },
      { name: "viChangedAfterManual", type: "checkbox", defaultValue: false, index: true },
      { name: "sourceHash", type: "json" },
      { name: "translatedAt", type: "date" },
      { name: "model", type: "text" },
      { name: "lastError", type: "text" },
    ],
  };
}

export function translationFields(): Field[] {
  return [hasEnglishField(), translationGroup()];
}
