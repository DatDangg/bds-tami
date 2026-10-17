import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TEST_CONTENT_SLUG } from "../fixtures/test-content/collection";
import type { PublicCollectionSlug } from "../../src/lib/content/public-queries";

const baseUrl = process.env.DATABASE_URL_TEST;
// Collection thử nghiệm không có trong payload-types nên phải ép kiểu một lần ở đây.
const SLUG = TEST_CONTENT_SLUG as PublicCollectionSlug;

type Locale = "vi" | "en";
interface PublicDoc {
  id: string;
  title?: string | null;
  summary?: string | null;
  slug?: string | null;
  status?: string;
  internalNote?: string | null;
  author?: unknown;
}

/** Collection test không có trong `payload-types.ts`, nên dữ liệu đi qua kiểu rộng. */
const asData = (data: Record<string, unknown>) => data as never;

describe.skipIf(!baseUrl)("integration: lớp truy vấn công khai (collection test, DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_pubq_${runId}`;
  let payload: Payload;
  let adminId = "";
  let query: typeof import("../../src/lib/content/public-queries");

  async function createDoc(data: Record<string, unknown>, locale: Locale = "vi") {
    const doc = await payload.create({
      collection: SLUG,
      data: asData({ author: adminId, internalNote: "bí mật nội bộ", ...data }),
      locale,
      overrideAccess: true,
      depth: 0,
    });
    return doc as unknown as PublicDoc;
  }

  /** Thêm bản en và bật hasEnglish (code hệ thống: `overrideAccess`, như task dịch). */
  async function addEnglish(id: string, title: string, summary = "English summary") {
    await payload.update({
      collection: SLUG,
      id,
      data: asData({ title, summary, hasEnglish: true }),
      locale: "en",
      overrideAccess: true,
      depth: 0,
    });
  }

  const softDelete = (id: string) =>
    payload.update({ collection: SLUG, id, data: asData({ deletedAt: new Date().toISOString() }), overrideAccess: true, depth: 0 });

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const testUrl = new URL(baseUrl!);
    testUrl.pathname = `/${dbName}`;
    process.env.DATABASE_URL = testUrl.toString();
    const { getPayload } = await import("payload");
    const { buildTestContentConfig } = await import("../fixtures/test-content/payload-config");
    payload = await getPayload({ config: buildTestContentConfig(testUrl.toString()) });
    query = await import("../../src/lib/content/public-queries");
    const admin = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Admin", role: "admin", active: true },
    });
    adminId = admin.id;
  }, 120_000);

  afterAll(async () => {
    const pool = (payload?.db as unknown as { pool?: EventEmitter & { _clients?: EventEmitter[] } } | undefined)?.pool;
    pool?.on("error", () => undefined);
    for (const client of pool?._clients ?? []) client.on("error", () => undefined);
    await payload?.destroy();
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    } finally {
      await connection.end();
    }
  }, 60_000);

  describe("bản vi: chỉ nội dung công khai", () => {
    it("published ra; draft, hidden, xoá mềm không ra (danh sách lẫn theo slug)", async () => {
      const published = await createDoc({ title: "Vi công khai", summary: "tóm tắt", status: "published" });
      const draft = await createDoc({ title: "Vi nháp", summary: "tóm tắt", status: "draft" });
      const hidden = await createDoc({ title: "Vi ẩn", summary: "tóm tắt", status: "hidden" });
      const trashed = await createDoc({ title: "Vi đã xoá", summary: "tóm tắt", status: "published" });
      await softDelete(trashed.id);

      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "vi", { limit: 50 });
      const titles = list.docs.map((doc) => doc.title);
      expect(titles).toContain("Vi công khai");
      for (const hiddenTitle of ["Vi nháp", "Vi ẩn", "Vi đã xoá"]) expect(titles).not.toContain(hiddenTitle);

      const found = await query.findPublicBySlug<PublicDoc>(payload, SLUG, "vi", published.slug!);
      expect(found?.id).toBe(published.id);
      for (const doc of [draft, hidden, trashed]) {
        expect(await query.findPublicBySlug(payload, SLUG, "vi", doc.slug!)).toBeNull();
      }
    });

    it("slug không tồn tại: null", async () => {
      expect(await query.findPublicBySlug(payload, SLUG, "vi", "khong-co-slug-nay")).toBeNull();
    });

    it("`where` thêm của trang chỉ thu hẹp, không nới lỏng điều kiện công khai", async () => {
      const draft = await createDoc({ title: "Nháp lọt where", summary: "tóm tắt", status: "draft" });
      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "vi", {
        where: { or: [{ id: { equals: draft.id } }, { status: { equals: "draft" } }] },
      });
      expect(list.totalDocs).toBe(0);
      expect(
        await query.findPublicBySlug(payload, SLUG, "vi", draft.slug!, { where: { status: { equals: "draft" } } }),
      ).toBeNull();
    });
  });

  describe("bản en: hasEnglish và không fallback sang tiếng Việt", () => {
    it("chưa có hasEnglish thì không ra ở en (danh sách + slug vi) nhưng vẫn ra ở vi", async () => {
      const doc = await createDoc({ title: "Chỉ có bản Việt", summary: "tóm tắt", status: "published" });
      const english = await createDoc({ title: "Có bản Anh", summary: "tóm tắt", status: "published" });
      await addEnglish(english.id, "Has English");

      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "en", { limit: 50 });
      const ids = list.docs.map((item) => item.id);
      expect(ids).toContain(english.id);
      expect(ids).not.toContain(doc.id);
      expect(await query.findPublicBySlug(payload, SLUG, "en", doc.slug!)).toBeNull();
      expect((await query.findPublicBySlug<PublicDoc>(payload, SLUG, "vi", doc.slug!))?.id).toBe(doc.id);
    });

    it("en không bao giờ trả chữ Việt: dùng slug/tiêu đề en, slug vi không mở được bản en", async () => {
      const doc = await createDoc({ title: "Căn hộ Quận 1", summary: "Mô tả tiếng Việt", status: "published" });
      await addEnglish(doc.id, "District 1 Apartment", "English description");

      const english = await query.findPublicBySlug<PublicDoc>(payload, SLUG, "en", "district-1-apartment");
      expect(english?.title).toBe("District 1 Apartment");
      expect(english?.summary).toBe("English description");
      expect(await query.findPublicBySlug(payload, SLUG, "en", "can-ho-quan-1")).toBeNull();

      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "en", { limit: 50 });
      for (const item of list.docs) {
        expect(item.title ?? "").not.toMatch(/[À-ỹ]/);
        expect(item.summary ?? "").not.toBe("Mô tả tiếng Việt");
      }
    });

    it("trường en để trống không rơi về chữ Việt (fallbackLocale tắt)", async () => {
      const doc = await createDoc({ title: "Có chi tiết", summary: "tóm tắt", details: "Chi tiết tiếng Việt", status: "published" });
      await addEnglish(doc.id, "Has details");

      const bySlug = await query.findPublicBySlug<PublicDoc & { details?: string | null }>(payload, SLUG, "en", "has-details");
      expect(bySlug).not.toBeNull();
      expect(bySlug?.details ?? null).toBeNull();
      const list = await query.findPublicList<PublicDoc & { details?: string | null }>(payload, SLUG, "en", { limit: 50 });
      for (const item of list.docs) expect(item.details ?? "").not.toContain("tiếng Việt");
      const vietnamese = await query.findPublicBySlug<PublicDoc & { details?: string | null }>(payload, SLUG, "vi", doc.slug!);
      expect(vietnamese?.details).toBe("Chi tiết tiếng Việt");
    });

    it("hasEnglish nhưng draft hoặc xoá mềm vẫn không ra ở en", async () => {
      const draft = await createDoc({ title: "Nháp có EN", summary: "tóm tắt", status: "draft" });
      const trashed = await createDoc({ title: "Xoá có EN", summary: "tóm tắt", status: "published" });
      await addEnglish(draft.id, "Draft English");
      await addEnglish(trashed.id, "Trashed English");
      await softDelete(trashed.id);

      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "en", { limit: 50 });
      const titles = list.docs.map((item) => item.title);
      expect(titles).not.toContain("Draft English");
      expect(titles).not.toContain("Trashed English");
      expect(await query.findPublicBySlug(payload, SLUG, "en", "draft-english")).toBeNull();
      expect(await query.findPublicBySlug(payload, SLUG, "en", "trashed-english")).toBeNull();
    });
  });

  describe("quyền khách", () => {
    it("không lộ trường nội bộ (field access) và không populate người tạo (staff)", async () => {
      const doc = await createDoc({ title: "Quyền khách", summary: "tóm tắt", status: "published" });
      const found = await query.findPublicBySlug<PublicDoc>(payload, SLUG, "vi", doc.slug!, { depth: 2 });
      expect(found).not.toBeNull();
      expect(found).not.toHaveProperty("internalNote");
      // Khách không đọc được staff: author chỉ còn là id, không có email/họ tên.
      expect(JSON.stringify(found?.author ?? null)).not.toContain("@example.test");

      const list = await query.findPublicList<PublicDoc>(payload, SLUG, "vi", { limit: 50, depth: 2 });
      for (const item of list.docs) expect(item).not.toHaveProperty("internalNote");

      // Đối chứng: cùng bản ghi, đọc bằng quyền hệ thống thì có trường nội bộ.
      const system = (await payload.findByID({ collection: SLUG, id: doc.id, overrideAccess: true, depth: 0 })) as unknown as PublicDoc;
      expect(system.internalNote).toBe("bí mật nội bộ");
    });

    it("`where` theo trường khách không đọc được không dò ra dữ liệu nội bộ", async () => {
      const marker = `marker-${runId}`;
      await createDoc({ title: "Dò nội bộ", summary: "tóm tắt", status: "published", internalNote: marker });
      const outcome = await query
        .findPublicList(payload, SLUG, "vi", { where: { internalNote: { equals: marker } } })
        .then(
          (result) => result.totalDocs,
          () => 0,
        );
      expect(outcome).toBe(0);
    });
  });

  describe("phân trang", () => {
    it("chia trang đúng, tham số sai hoặc quá lớn được kẹp", async () => {
      for (let index = 1; index <= 5; index += 1) {
        await createDoc({ title: `Trang ${index}`, summary: "tóm tắt", status: "published" });
      }
      const where = { title: { like: "Trang " } };
      const first = await query.findPublicList<PublicDoc>(payload, SLUG, "vi", { where, limit: 2, page: 1, sort: "title" });
      expect(first.docs).toHaveLength(2);
      expect(first).toMatchObject({ page: 1, limit: 2, totalDocs: 5, totalPages: 3, hasNextPage: true, hasPrevPage: false });
      const last = await query.findPublicList<PublicDoc>(payload, SLUG, "vi", { where, limit: 2, page: 3, sort: "title" });
      expect(last.docs).toHaveLength(1);
      expect(last).toMatchObject({ hasNextPage: false, hasPrevPage: true });

      const beyond = await query.findPublicList(payload, SLUG, "vi", { where, limit: 2, page: 99 });
      expect(beyond.docs).toHaveLength(0);

      const bad = await query.findPublicList(payload, SLUG, "vi", { where, page: -3, limit: Number.NaN });
      expect(bad.page).toBe(1);
      expect(bad.limit).toBe(12);
      const huge = await query.findPublicList(payload, SLUG, "vi", { where, page: 1e12, limit: 1e12 });
      expect(huge.limit).toBe(50);
      expect(huge.page).toBeLessThanOrEqual(500);
    });
  });
});
