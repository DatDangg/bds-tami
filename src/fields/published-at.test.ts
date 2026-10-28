import type { DateField, FieldHook } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publishedAtField } from "./published-at";

const NOW_ISO = "2026-10-28T03:00:00.000Z";
type HookArgs = Parameters<FieldHook>[0];
const run = (field: DateField, args: { value?: unknown; previousValue?: unknown; data?: object; originalDoc?: object }) =>
  (field.hooks?.beforeChange?.[0] as FieldHook)(args as unknown as HookArgs);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));
});
afterEach(() => vi.useRealTimers());

describe("publishedAtField (mặc định: chỉ đọc — Dự án / Cho thuê / Tin BĐS / Tuyển dụng)", () => {
  const field = publishedAtField();

  it("readOnly + deny-all create/update, không component riêng", () => {
    expect(field.admin?.readOnly).toBe(true);
    expect((field.access?.create as () => boolean)()).toBe(false);
    expect((field.access?.update as () => boolean)()).toBe(false);
    expect(field.admin?.components).toBeUndefined();
  });

  it("hook giữ giá trị đã có, gán now khi published lần đầu, để nguyên khi chưa published", () => {
    expect(run(field, { value: "2030-01-01T00:00:00.000Z", previousValue: "2020-01-01T00:00:00.000Z", data: { status: "published" } })).toBe("2020-01-01T00:00:00.000Z");
    expect(run(field, { value: "2000-01-01T00:00:00.000Z", data: { status: "published" } })).toBe("2000-01-01T00:00:00.000Z");
    expect(run(field, { data: { status: "published" } })).toBe(NOW_ISO);
    expect(run(field, { data: { status: "draft" } })).toBeUndefined();
  });
});

describe("publishedAtField({ scheduled: true }) (Tin tức, BL-091)", () => {
  const field = publishedAtField({ scheduled: true });

  it("sửa được: không readOnly, không deny-all; có Cell + afterInput", () => {
    expect(field.admin?.readOnly).toBeFalsy();
    expect(field.access).toBeUndefined();
    expect(field.admin?.components?.Cell).toContain("ScheduledPublishCell");
    expect(field.admin?.components?.afterInput).toEqual([expect.stringContaining("ScheduledPublishNotice")]);
    expect(field.admin?.date?.pickerAppearance).toBe("dayAndTime");
  });

  it("giá trị gửi lên được dùng nguyên, kể cả quá khứ và tương lai", () => {
    expect(run(field, { value: "2031-01-01T00:00:00.000Z", previousValue: "2020-01-01T00:00:00.000Z", data: { status: "published" } })).toBe("2031-01-01T00:00:00.000Z");
    expect(run(field, { value: "2000-01-01T00:00:00.000Z", data: { status: "published" } })).toBe("2000-01-01T00:00:00.000Z");
    expect(run(field, { value: "2031-01-01T00:00:00.000Z", data: { status: "draft" } })).toBe("2031-01-01T00:00:00.000Z");
  });

  it("không gửi (cập nhật từng phần) → giữ giá trị đã lưu", () => {
    expect(run(field, { previousValue: "2031-01-01T00:00:00.000Z", data: { title: "x" }, originalDoc: { status: "published" } })).toBe("2031-01-01T00:00:00.000Z");
  });

  it("trống + published → now (lần đầu và khi xoá trống ở bài đang published); trống + chưa published → để trống", () => {
    expect(run(field, { data: { status: "published" } })).toBe(NOW_ISO);
    expect(run(field, { value: null, previousValue: "2020-01-01T00:00:00.000Z", data: { status: "published" } })).toBe(NOW_ISO);
    expect(run(field, { value: "", data: {}, originalDoc: { status: "published" } })).toBe(NOW_ISO);
    expect(run(field, { value: null, previousValue: "2020-01-01T00:00:00.000Z", data: { status: "draft" } })).toBeNull();
    expect(run(field, { data: { status: "draft" } })).toBeUndefined();
  });
});
