import type { CheckboxField, Field, FieldHook, GroupField } from "payload";

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
    // Nhân bản bỏ slug `en` (xem `slugField`) nên bản sao chưa đủ điều kiện bật; kể cả khi Local API `overrideAccess: true` giữ nguyên giá trị.
    hooks: { beforeDuplicate: [() => false] },
    admin: { position: "sidebar", readOnly: true },
  };
}

/**
 * Nhân bản (Duplicate) đặt lại MỌI trường của nhóm về "chưa dịch": mặc định Payload chép nguyên `status`/`sourceHash`/`enSource` của bản gốc, nên bản sao
 * (nội dung `vi` có thể sửa ngay) bị coi là "đã dịch xong" (hash khớp, không dịch) hoặc "đã sửa tay" (`enSource = manual`, không bao giờ được dịch). Với trạng thái
 * `none` + hash trống, job coi bản sao là chưa dịch và dịch ở lần xuất bản đầu (review L5-T03 round 1 MINOR-1).
 */
const resetOnDuplicate = (value: unknown): FieldHook => () => value;

/** Trạng thái dịch (ERD §1.1): không localized, hệ thống ghi, mọi người chỉ đọc (PERMISSION §4). Globals chỉ dùng group này (không `hasEnglish`: header/footer/site-settings luôn render ở cả hai ngôn ngữ). */
export function translationGroup(): GroupField {
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
        hooks: { beforeDuplicate: [resetOnDuplicate("none")] },
      },
      { name: "enSource", type: "select", options: options(["ai", "manual"]), hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "viChangedAfterManual", type: "checkbox", defaultValue: false, index: true, hooks: { beforeDuplicate: [resetOnDuplicate(false)] } },
      { name: "sourceHash", type: "json", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "translatedAt", type: "date", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "model", type: "text", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "lastError", type: "text", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
    ],
  };
}

export function translationFields(): Field[] {
  return [hasEnglishField(), translationGroup()];
}
