import type { CollectionConfig, Field } from "payload";
import { describe, expect, it } from "vitest";

import { englishTabStatus } from "../translation/admin-ui";
import { withLanguageTabs } from "./language-tabs";

const HINT = "/components/admin/ViSourceHint#ViSourceHint";
const afterInput = (field: unknown) => (field as { admin?: { components?: { afterInput?: unknown[] } } }).admin?.components?.afterInput ?? [];

describe("withLanguageTabs", () => {
  const fields: Field[] = [
    { type: "tabs", tabs: [{ label: "Nội dung", fields: [{ name: "title", type: "text", localized: true }, { name: "slug", type: "text", localized: true }, { name: "price", type: "number" }] }] },
    { name: "faqs", type: "array", localized: true, fields: [{ name: "question", type: "text" }] },
    { name: "code", type: "text" },
    { name: "translation", type: "group", fields: [{ name: "status", type: "text" }] },
  ];
  const result = withLanguageTabs({ slug: "news", fields } as CollectionConfig);

  it("thêm ô tab ngôn ngữ đầu form", () => {
    expect(result.fields[0]).toMatchObject({ name: "languageTabs", type: "ui" });
  });

  it("gắn câu tiếng Việt gốc vào ô chữ có bản dịch (kể cả con của array localized), bỏ slug và ô không dịch", () => {
    const tab = (result.fields[1] as { tabs: { fields: Field[] }[] }).tabs[0]!.fields;
    expect(afterInput(tab[0])).toContain(HINT);
    expect(afterInput(tab[1])).not.toContain(HINT);
    expect(afterInput(tab[2])).not.toContain(HINT);
    expect(afterInput((result.fields[2] as { fields: Field[] }).fields[0])).toContain(HINT);
    expect(afterInput(result.fields[3])).not.toContain(HINT);
  });

  it("collection không có nhóm translation giữ nguyên", () => {
    const plain = { slug: "leads", fields: [{ name: "name", type: "text", localized: true }] } as CollectionConfig;
    expect(withLanguageTabs(plain)).toBe(plain);
  });
});

describe("englishTabStatus", () => {
  it("nhãn theo trạng thái dịch", () => {
    expect(englishTabStatus({ status: "none" })?.label).toBe("Chưa dịch");
    expect(englishTabStatus({ status: "queued" })?.label).toBe("Đang dịch");
    expect(englishTabStatus({ status: "done", enSource: "ai" })?.label).toBe("AI đã dịch");
    expect(englishTabStatus({ status: "done", enSource: "manual" })?.label).toBe("Sửa tay");
    expect(englishTabStatus({ status: "done", enSource: "manual", viChangedAfterManual: true })?.label).toBe("Cần xem lại");
    expect(englishTabStatus({ status: "failed" })?.label).toBe("Dịch lỗi");
    expect(englishTabStatus({ status: "pending_review" })?.label).toBe("Chờ duyệt");
  });
});
