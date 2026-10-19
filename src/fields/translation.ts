import type { CheckboxField, Field, FieldHook, GroupField } from "payload";

import { denyAll } from "../access";

const readOnlyForEveryone = { create: denyAll, update: denyAll };

const TRANSLATION_STATUS_LABELS: Record<string, string> = {
  none: "Chưa dịch",
  queued: "Đang chờ dịch",
  done: "Đã dịch",
  failed: "Dịch lỗi",
  pending_review: "Chờ duyệt",
};
const EN_SOURCE_LABELS: Record<string, string> = { ai: "AI dịch", manual: "Sửa tay" };

const options = (values: readonly string[], labels: Record<string, string>) => values.map((value) => ({ label: labels[value] ?? value, value }));

/** Bật khi đủ trường EN bắt buộc (ERD §1.1); logic bật nằm ở task dịch. Hook chặn bật khi thiếu: `require-english-fields`. */
function hasEnglishField(): CheckboxField {
  return {
    name: "hasEnglish",
    type: "checkbox",
    label: "Có bản tiếng Anh",
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
    label: "Bản dịch tiếng Anh",
    access: readOnlyForEveryone,
    admin: { readOnly: true, description: "Hệ thống tự dịch VI → EN khi xuất bản; các mục dưới đây chỉ đọc." },
    fields: [
      {
        name: "status",
        type: "select",
        label: "Trạng thái dịch",
        index: true,
        defaultValue: "none",
        options: options(["none", "queued", "done", "failed", "pending_review"], TRANSLATION_STATUS_LABELS),
        hooks: { beforeDuplicate: [resetOnDuplicate("none")] },
      },
      { name: "enSource", type: "select", label: "Nguồn bản tiếng Anh", options: options(["ai", "manual"], EN_SOURCE_LABELS), hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "viChangedAfterManual", type: "checkbox", label: "Bản Việt đã đổi sau khi sửa tay bản Anh", defaultValue: false, index: true, hooks: { beforeDuplicate: [resetOnDuplicate(false)] } },
      { name: "sourceHash", type: "json", label: "Dấu nội dung nguồn đã dịch", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "translatedAt", type: "date", label: "Dịch lúc", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "model", type: "text", label: "Mô hình AI", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      { name: "lastError", type: "text", label: "Lỗi gần nhất", hooks: { beforeDuplicate: [resetOnDuplicate(null)] } },
      // Trường ảo (không có cột DB): nút "Dịch lại bằng AI"; tự ẩn khi người dùng không được dịch lại bản ghi này.
      { name: "retranslateAction", type: "ui", label: "Dịch lại bằng AI", admin: { components: { Field: "/components/admin/RetranslateButton#RetranslateButton" } } },
    ],
  };
}

export function translationFields(): Field[] {
  return [hasEnglishField(), translationGroup()];
}
