import { describe, expect, it } from "vitest";

import { countChangedFields, formatVersionTime, statusLabelFromOptions } from "./version-history";

describe("countChangedFields", () => {
  it("đếm trường cấp ngoài khác nhau, nhóm/danh sách/nội dung tính 1", () => {
    const previous = { title: "A", seo: { title: "x", description: "y" }, gallery: ["1"], status: "draft" };
    const current = { title: "B", seo: { title: "x2", description: "y2" }, gallery: ["1", "2"], status: "draft" };
    expect(countChangedFields(current, previous)).toBe(3);
  });

  it("bỏ qua trường hệ thống (mốc thời gian, trạng thái dịch, cờ job nền, id)", () => {
    const previous = { title: "A", updatedAt: "1", translation: { status: "none" }, searchReindexPending: false, id: "a" };
    const current = { title: "A", updatedAt: "2", translation: { status: "done" }, searchReindexPending: true, id: "b" };
    expect(countChangedFields(current, previous)).toBe(0);
  });

  it("trường localized dạng { vi, en }: chỉ EN đổi vẫn tính 1 (bản do job dịch)", () => {
    const previous = { title: { vi: "Tiêu đề", en: "Title" }, status: "published" };
    const current = { title: { vi: "Tiêu đề", en: "Title (edited)" }, status: "published" };
    expect(countChangedFields(current, previous)).toBe(1);
    expect(countChangedFields(previous, previous)).toBe(0);
  });

  it("{ vi } và { vi, en: null } là cùng nội dung (EN chưa có) → không đổi", () => {
    expect(countChangedFields({ note: { vi: "a", en: null }, seo: { vi: { t: null }, en: { t: null } } }, { note: { vi: "a" } })).toBe(0);
    expect(countChangedFields({ note: { vi: "a", en: "b" } }, { note: { vi: "a" } })).toBe(1);
  });

  it("thiếu trường coi như null: thêm giá trị mới là 1 thay đổi, null ↔ thiếu không đổi", () => {
    expect(countChangedFields({ title: "A", note: "x" }, { title: "A" })).toBe(1);
    expect(countChangedFields({ title: "A", note: null }, { title: "A" })).toBe(0);
  });
});

describe("formatVersionTime", () => {
  it("dd/MM/yyyy HH:mm theo giờ Việt Nam, không phụ thuộc múi giờ máy", () => {
    expect(formatVersionTime("2026-10-22T06:38:00.000Z")).toBe("22/10/2026 13:38");
    expect(formatVersionTime("2026-10-21T17:05:00.000Z")).toBe("22/10/2026 00:05");
  });

  it("giá trị hỏng → dấu gạch", () => {
    expect(formatVersionTime("không phải ngày")).toBe("—");
  });
});

describe("statusLabelFromOptions", () => {
  const options = [{ label: "Đã xuất bản", value: "published" }, "legacy", { label: () => "x", value: "fn" }];

  it("lấy nhãn tiếng Việt của option, giá trị lạ hiện nguyên giá trị", () => {
    expect(statusLabelFromOptions(options, "published")).toBe("Đã xuất bản");
    expect(statusLabelFromOptions(options, "legacy")).toBe("legacy");
    expect(statusLabelFromOptions(options, "fn")).toBe("fn");
    expect(statusLabelFromOptions(undefined, "draft")).toBe("draft");
  });
});
