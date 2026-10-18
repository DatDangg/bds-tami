import type { CollectionAfterChangeHook } from "payload";
import { describe, expect, it, vi } from "vitest";

import { TRANSLATABLE_COLLECTIONS } from "../../lib/translation/allowlist";
import { createEnqueueTranslation } from "./enqueue-translation";
import { TRANSLATION_JOB_CONTEXT_KEY } from "./translation-targets";

/** Hook gặp `req` giả: mọi truy cập DB đều là spy, nên test khẳng định được "không đụng tới hàng đợi/DB" cho các nhánh bị loại. */
function fakeReq(locale = "vi") {
  const queue = vi.fn(async () => ({}));
  const find = vi.fn(async () => ({ docs: [] }));
  const findGlobal = vi.fn(async () => ({ translationEnabled: true }));
  const payload = { jobs: { queue }, find, findGlobal, update: vi.fn(), collections: {}, globals: { config: [] } };
  return { req: { payload, locale } as never, queue, find, findGlobal };
}

type ChangeArgs = Parameters<CollectionAfterChangeHook>[0];
const collectionArgs = (slug: string, req: unknown, doc: Record<string, unknown>, context: Record<string, unknown> = {}) =>
  ({ doc, req, collection: { slug }, context, previousDoc: {}, operation: "update" }) as unknown as ChangeArgs;

describe("hook enqueue: các nhánh KHÔNG được xếp job", () => {
  const { collectionAfterChange, globalAfterChange } = createEnqueueTranslation();
  const published = { id: "1", status: "published", title: "x" };

  it("collection ngoài danh sách cho phép (lead, hồ sơ ứng tuyển, nhân viên...) không bao giờ xếp job và không đụng DB", async () => {
    for (const slug of ["leads", "lead-activities", "job-applications", "staff", "private-files", "audit-logs", "translation-usage", "media", "provinces"]) {
      expect(TRANSLATABLE_COLLECTIONS as readonly string[]).not.toContain(slug);
      const fake = fakeReq();
      await collectionAfterChange(collectionArgs(slug, fake.req, published));
      expect(fake.queue).not.toHaveBeenCalled();
      expect(fake.find).not.toHaveBeenCalled();
      expect(fake.findGlobal).not.toHaveBeenCalled();
    }
  });

  it("global ngoài danh sách (vd cấu hình nội bộ) cũng không", async () => {
    const fake = fakeReq();
    await globalAfterChange({ doc: {}, req: fake.req, global: { slug: "khong-co" }, context: {} } as never);
    expect(fake.queue).not.toHaveBeenCalled();
  });

  it("lần ghi do job dịch (cờ context) và request ghi locale en không xếp job", async () => {
    const fromJob = fakeReq();
    await collectionAfterChange(collectionArgs("news", fromJob.req, published, { [TRANSLATION_JOB_CONTEXT_KEY]: true }));
    expect(fromJob.queue).not.toHaveBeenCalled();
    const english = fakeReq("en");
    await collectionAfterChange(collectionArgs("news", english.req, published));
    expect(english.queue).not.toHaveBeenCalled();
  });

  it("bản nháp, ẩn, đã xoá mềm không xếp job (không dịch nháp)", async () => {
    for (const doc of [{ id: "1", status: "draft" }, { id: "1", status: "hidden" }, { id: "1", status: "published", deletedAt: "2026-10-18" }]) {
      const fake = fakeReq();
      await collectionAfterChange(collectionArgs("news", fake.req, doc));
      expect(fake.queue).not.toHaveBeenCalled();
    }
  });

  it("trả lại doc nguyên vẹn (hook không đổi dữ liệu)", async () => {
    const fake = fakeReq();
    const doc = { id: "1", status: "draft" };
    expect(await collectionAfterChange(collectionArgs("news", fake.req, doc))).toBe(doc);
  });
});
