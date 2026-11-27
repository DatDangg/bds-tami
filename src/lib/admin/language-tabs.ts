import type { CollectionConfig, Field, GlobalConfig } from "payload";

const LANGUAGE_TABS = "/components/admin/LanguageTabs#LanguageTabs";
const VI_SOURCE_HINT = "/components/admin/ViSourceHint#ViSourceHint";
/** Ô không cần đối chiếu câu tiếng Việt (đường dẫn, không phải câu chữ). */
const SKIP_HINT_NAMES = new Set(["slug"]);

type AnyField = Field & { name?: string; type: string; localized?: boolean; fields?: Field[]; tabs?: { fields: Field[] }[]; blocks?: { fields: Field[] }[]; admin?: Record<string, unknown> };

/** Có nhóm `translation` (dữ liệu dịch) ở bất kỳ tầng nào = bản ghi có bản tiếng Anh. */
function hasTranslationGroup(fields: readonly Field[]): boolean {
  return (fields as AnyField[]).some(
    (field) =>
      (field.type === "group" && field.name === "translation") ||
      (field.fields ? hasTranslationGroup(field.fields) : false) ||
      (field.tabs ?? []).some((tab) => hasTranslationGroup(tab.fields)) ||
      (field.blocks ?? []).some((block) => hasTranslationGroup(block.fields)),
  );
}

function withViHint(field: AnyField): AnyField {
  const admin = field.admin as { hidden?: boolean; components?: { afterInput?: unknown[] } } | undefined;
  if (admin?.hidden || SKIP_HINT_NAMES.has(field.name ?? "")) return field;
  const afterInput = [...(admin?.components?.afterInput ?? []), VI_SOURCE_HINT];
  return { ...field, admin: { ...admin, components: { ...admin?.components, afterInput } } } as AnyField;
}

/** Gắn dòng "Bản tiếng Việt: …" (chỉ hiện ở tab Tiếng Anh) vào ô text/textarea có bản dịch; con của group/array localized cũng tính. */
export function addViSourceHints(fields: readonly Field[], inheritedLocalized = false): Field[] {
  return (fields as AnyField[]).map((field) => {
    const localized = inheritedLocalized || field.localized === true;
    if ((field.type === "text" || field.type === "textarea") && localized) return withViHint(field);
    if (field.tabs) return { ...field, tabs: field.tabs.map((tab) => ({ ...tab, fields: addViSourceHints(tab.fields, localized) })) } as Field;
    if (field.blocks) return { ...field, blocks: field.blocks.map((block) => ({ ...block, fields: addViSourceHints(block.fields, localized) })) } as Field;
    if (field.fields) return { ...field, fields: addViSourceHints(field.fields, localized) } as Field;
    return field as Field;
  });
}

/**
 * BL-133: form có bản tiếng Anh → tab "Tiếng Việt | Tiếng Anh" đầu form (ô ui, không có cột DB) + câu tiếng Việt gốc dưới ô chữ khi đang sửa bản tiếng Anh.
 * Collection/global không có nhóm `translation` giữ nguyên.
 */
export function withLanguageTabs<T extends CollectionConfig | GlobalConfig>(config: T): T {
  if (!hasTranslationGroup(config.fields)) return config;
  const tabsField: Field = { name: "languageTabs", type: "ui", label: "Ngôn ngữ đang sửa", admin: { components: { Field: LANGUAGE_TABS } } };
  return { ...config, fields: [tabsField, ...addViSourceHints(config.fields)] };
}
