import type { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import pg from "pg";
import type { CollectionSlug, Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ROLES } from "../../src/access/roles";
import { revalidateCalls, TEST_CONTENT_SLUG } from "../fixtures/test-content/collection";

const baseUrl = process.env.DATABASE_URL_TEST;

interface TestDoc {
  id: string;
  title?: string | null;
  summary?: string | null;
  slug?: string | null;
  status: string;
  publishedAt?: string | null;
  author: string | { id: string };
  isFeatured?: boolean | null;
  hasEnglish?: boolean | null;
  deletedAt?: string | null;
}

type Locale = "vi" | "en";
const SLUG = TEST_CONTENT_SLUG as CollectionSlug;
// Collection test không có trong `payload-types.ts` (không thuộc config production) nên dữ liệu đi qua kiểu rộng.
const asData = (data: Record<string, unknown>) => data as never;
const authorId = (doc: TestDoc) => (typeof doc.author === "object" ? doc.author.id : doc.author);

/**
 * Dùng config riêng (`tests/fixtures/test-content`) + database tạm: collection test không bao giờ vào config
 * production, và bảng của nó do `push` tạo trên DB tạm rồi bị xoá cùng DB.
 */
describe.skipIf(!baseUrl)("integration: bộ field + hook nội dung dùng chung (collection test, DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_content_${runId}`;
  const password = "Mat-khau-hop-le-123";
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  type Actor = Awaited<ReturnType<typeof createStaff>>;

  async function createDoc(
    data: Record<string, unknown>,
    options: { as?: Actor; locale?: Locale } = {},
  ): Promise<TestDoc> {
    const doc = await payload.create({
      collection: SLUG,
      // Không có người dùng (Local API hệ thống) thì không ai tự gán author, nên phải đưa vào.
      data: asData(options.as ? data : { author: admin.id, ...data }),
      locale: options.locale ?? "vi",
      user: options.as ? asUser(options.as) : undefined,
      overrideAccess: !options.as,
      depth: 0,
    });
    return doc as unknown as TestDoc;
  }

  async function updateDoc(
    id: string,
    data: Record<string, unknown>,
    options: { as?: Actor; locale?: Locale; trash?: boolean } = {},
  ): Promise<TestDoc> {
    const doc = await payload.update({
      collection: SLUG,
      id,
      data: asData(data),
      locale: options.locale ?? "vi",
      trash: options.trash,
      user: options.as ? asUser(options.as) : undefined,
      overrideAccess: !options.as,
      depth: 0,
    });
    return doc as unknown as TestDoc;
  }

  async function readDoc(id: string, locale: Locale = "vi"): Promise<TestDoc> {
    const doc = await payload.findByID({
      collection: SLUG,
      id,
      locale,
      fallbackLocale: false,
      trash: true,
      overrideAccess: true,
      depth: 0,
    });
    return doc as unknown as TestDoc;
  }

  const softDelete = (id: string, as: Actor) => updateDoc(id, { deletedAt: new Date().toISOString() }, { as });

  async function auditActions(docId: string): Promise<string[]> {
    const result = await payload.find({
      collection: "audit-logs",
      where: { docId: { equals: docId } },
      sort: "createdAt",
      overrideAccess: true,
      limit: 50,
    });
    return result.docs.map((log) => log.action);
  }

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
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("other-sale", ROLES.sale);
  }, 120_000);

  afterAll(async () => {
    // Giống audit-staff.test: client "không bao giờ trả về pool" của adapter sẽ ném lỗi khi DROP ... FORCE cắt nó.
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

  beforeEach(() => {
    revalidateCalls.length = 0;
  });

  describe("cấu hình dùng chung", () => {
    it("versions maxPerDoc 20 không drafts, trash bật, document locking không bị tắt", () => {
      const config = payload.collections[SLUG as "staff"].config;
      expect(config.versions).toMatchObject({ maxPerDoc: 20 });
      expect(config.versions && config.versions.drafts).toBeFalsy();
      expect(config.trash).toBe(true);
      expect(config.lockDocuments).not.toBe(false);
    });

    it("collection test không nằm trong config production", () => {
      const productionConfig = readFileSync("src/payload.config.ts", "utf8");
      expect(productionConfig).not.toContain("test-content");
      expect(productionConfig).not.toContain("TestContent");
    });

    it("mỗi lần sửa tạo một bản phiên bản", async () => {
      const doc = await createDoc({ title: "Phiên bản" }, { as: admin });
      await updateDoc(doc.id, { summary: "đổi" }, { as: admin });
      const versions = await payload.findVersions({
        collection: SLUG,
        where: { parent: { equals: doc.id } },
        overrideAccess: true,
      });
      expect(versions.totalDocs).toBeGreaterThanOrEqual(2);
    });
  });

  describe("slug", () => {
    it("tự sinh từ title của đúng locale: vi và en độc lập", async () => {
      const doc = await createDoc({ title: "Căn hộ Quận 1" }, { as: sale });
      expect(doc.slug).toBe("can-ho-quan-1");

      const english = await updateDoc(doc.id, { title: "District 1 Apartment" }, { locale: "en" });
      expect(english.slug).toBe("district-1-apartment");
      expect((await readDoc(doc.id, "vi")).slug).toBe("can-ho-quan-1");
    });

    it("trùng trong cùng collection + locale thì thêm hậu tố; khác locale thì không", async () => {
      const first = await createDoc({ title: "Trùng tên" });
      const second = await createDoc({ title: "Trùng tên" });
      const third = await createDoc({ title: "Trùng tên" });
      expect([first.slug, second.slug, third.slug]).toEqual(["trung-ten", "trung-ten-2", "trung-ten-3"]);

      const english = await updateDoc(first.id, { title: "Trung ten" }, { locale: "en" });
      expect(english.slug).toBe("trung-ten");
    });

    it("slug dài đúng giới hạn: ứng viên bị cắt đầu vẫn được kiểm trùng (không đụng unique index)", async () => {
      const long = "a".repeat(80);
      const slugs: (string | null | undefined)[] = [];
      for (let i = 0; i < 3; i++) slugs.push((await createDoc({ title: "x", slug: long })).slug);
      expect(slugs).toEqual([long, `${"a".repeat(78)}-2`, `${"a".repeat(78)}-3`]);
    });

    it("ghi slug với locale all bị từ chối rõ ràng", async () => {
      const doc = await createDoc({ title: "Locale all" });
      await expect(
        payload.update({
          collection: SLUG,
          id: doc.id,
          data: asData({ title: "Đổi" }),
          locale: "all" as never,
          overrideAccess: true,
          depth: 0,
        }),
      ).rejects.toThrow(/locale/i);
    });

    it("sửa tay được, được chuẩn hoá, trùng thì thêm hậu tố, không tự trùng chính mình", async () => {
      const doc = await createDoc({ title: "Bài thủ công", slug: "Slug Gõ Tay!" });
      expect(doc.slug).toBe("slug-go-tay");

      const same = await updateDoc(doc.id, { slug: "slug-go-tay", summary: "x" });
      expect(same.slug).toBe("slug-go-tay");
      const duplicate = await createDoc({ title: "Bài khác", slug: "slug-go-tay" });
      expect(duplicate.slug).toBe("slug-go-tay-2");
    });

    it("giữ slug khi đổi title mà không gửi slug; xoá trống slug thì sinh lại từ title", async () => {
      const doc = await createDoc({ title: "Tiêu đề cũ" });
      const renamed = await updateDoc(doc.id, { title: "Tiêu đề mới" });
      expect(renamed.slug).toBe("tieu-de-cu");
      const regenerated = await updateDoc(doc.id, { slug: "" });
      expect(regenerated.slug).toBe("tieu-de-moi");
    });

    it("slug của bản đã xoá mềm vẫn tính là đã dùng", async () => {
      const first = await createDoc({ title: "Đã xoá mềm" }, { as: admin });
      await softDelete(first.id, admin);
      const next = await createDoc({ title: "Đã xoá mềm" });
      expect(next.slug).toBe("da-xoa-mem-2");
    });

    it("bản vi bắt buộc có slug (không có title cũng không có slug thì lỗi)", async () => {
      await expect(createDoc({ title: "" })).rejects.toMatchObject({ name: "ValidationError" });
    });
  });

  describe("status + publishedAt", () => {
    it("mặc định draft, chưa có publishedAt; gán lần đầu khi published và giữ nguyên khi xuất bản lại", async () => {
      const doc = await createDoc({ title: "Xuất bản" });
      expect(doc.status).toBe("draft");
      expect(doc.publishedAt ?? null).toBeNull();

      const published = await updateDoc(doc.id, { status: "published" });
      expect(published.publishedAt).toBeTruthy();
      await updateDoc(doc.id, { status: "hidden" });
      const republished = await updateDoc(doc.id, { status: "published" });
      expect(republished.publishedAt).toBe(published.publishedAt);
    });

    it("tạo thẳng published cũng được gán; sửa tay publishedAt bị bỏ qua (kể cả admin)", async () => {
      const doc = await createDoc(
        { title: "Tạo thẳng", status: "published", publishedAt: "2000-01-01T00:00:00.000Z" },
        { as: admin },
      );
      expect(doc.publishedAt).toBeTruthy();
      expect(doc.publishedAt).not.toBe("2000-01-01T00:00:00.000Z");

      const attempted = await updateDoc(doc.id, { publishedAt: "1999-01-01T00:00:00.000Z" }, { as: admin });
      expect(attempted.publishedAt).toBe(doc.publishedAt);
    });

    it("status chỉ nhận draft/published/hidden", async () => {
      await expect(createDoc({ title: "Sai trạng thái", status: "rented" })).rejects.toMatchObject({
        name: "ValidationError",
      });
    });
  });

  describe("author + isFeatured (field access)", () => {
    it("author tự gán người tạo; sale không đổi được author; admin đổi được", async () => {
      const doc = await createDoc({ title: "Của sale", author: otherSale.id }, { as: sale });
      expect(authorId(doc)).toBe(sale.id);

      const bySale = await updateDoc(doc.id, { author: otherSale.id }, { as: sale });
      expect(authorId(bySale)).toBe(sale.id);
      const byAdmin = await updateDoc(doc.id, { author: otherSale.id }, { as: admin });
      expect(authorId(byAdmin)).toBe(otherSale.id);
    });

    it("admin tạo mà không chỉ định author thì author là admin", async () => {
      const doc = await createDoc({ title: "Của admin" }, { as: admin });
      expect(authorId(doc)).toBe(admin.id);
    });

    it("isFeatured chỉ admin sửa: sale gửi lên bị bỏ qua", async () => {
      const doc = await createDoc({ title: "Nổi bật", isFeatured: true }, { as: sale });
      expect(doc.isFeatured).toBe(false);
      const bySale = await updateDoc(doc.id, { isFeatured: true }, { as: sale });
      expect(bySale.isFeatured).toBe(false);
      const byAdmin = await updateDoc(doc.id, { isFeatured: true }, { as: admin });
      expect(byAdmin.isFeatured).toBe(true);
      const bySaleAgain = await updateDoc(doc.id, { isFeatured: false }, { as: sale });
      expect(bySaleAgain.isFeatured).toBe(true);
    });
  });

  describe("quyền theo bản ghi + xoá mềm / khôi phục / xoá hẳn + audit", () => {
    it("sale chỉ sửa bản của mình; admin sửa tất cả", async () => {
      const own = await createDoc({ title: "Bài của sale" }, { as: sale });
      const foreign = await createDoc({ title: "Bài của sale khác" }, { as: otherSale });

      expect((await updateDoc(own.id, { summary: "ok" }, { as: sale })).summary).toBe("ok");
      await expect(updateDoc(foreign.id, { summary: "hack" }, { as: sale })).rejects.toThrow();
      expect((await readDoc(foreign.id)).summary ?? null).toBeNull();
      expect((await updateDoc(foreign.id, { summary: "admin" }, { as: admin })).summary).toBe("admin");
    });

    it("sale xoá mềm bản của mình (ghi audit), không xoá được bản người khác, không xoá hẳn được", async () => {
      const own = await createDoc({ title: "Sale tự xoá" }, { as: sale });
      const foreign = await createDoc({ title: "Không xoá được" }, { as: otherSale });

      expect((await softDelete(own.id, sale)).deletedAt).toBeTruthy();
      await expect(softDelete(foreign.id, sale)).rejects.toThrow();
      expect((await readDoc(foreign.id)).deletedAt ?? null).toBeNull();

      await expect(
        payload.delete({ collection: SLUG, id: foreign.id, user: asUser(sale), overrideAccess: false }),
      ).rejects.toThrow();
      await expect(
        payload.delete({ collection: SLUG, id: own.id, trash: true, user: asUser(sale), overrideAccess: false }),
      ).rejects.toThrow();
      expect((await readDoc(own.id)).id).toBe(own.id);
      expect(await auditActions(own.id)).toEqual(["content.delete"]);
    });

    it("sale không khôi phục / sửa bản đã xoá mềm của chính mình; admin khôi phục được và có audit", async () => {
      const doc = await createDoc({ title: "Khôi phục" }, { as: sale });
      await softDelete(doc.id, sale);

      await expect(updateDoc(doc.id, { deletedAt: null }, { as: sale, trash: true })).rejects.toThrow();
      await expect(updateDoc(doc.id, { summary: "sửa trong thùng rác" }, { as: sale, trash: true })).rejects.toThrow();
      expect((await readDoc(doc.id)).deletedAt).toBeTruthy();

      const restored = await updateDoc(doc.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      expect(await auditActions(doc.id)).toEqual(["content.delete", "content.restore"]);
    });

    it("chỉ admin xoá hẳn, và ghi audit content.purge với actor là admin", async () => {
      const doc = await createDoc({ title: "Xoá hẳn" }, { as: sale });
      await softDelete(doc.id, sale);
      await payload.delete({ collection: SLUG, id: doc.id, trash: true, user: asUser(admin), overrideAccess: false });

      await expect(readDoc(doc.id)).rejects.toThrow();
      const logs = await payload.find({
        collection: "audit-logs",
        where: { docId: { equals: doc.id } },
        sort: "createdAt",
        overrideAccess: true,
        depth: 0,
      });
      expect(logs.docs.map((log) => log.action)).toEqual(["content.delete", "content.purge"]);
      expect(logs.docs.map((log) => log.actor)).toEqual([sale.id, admin.id]);
    });

    it("ghi audit lỗi thì xoá mềm và xoá hẳn bị rollback (fail-closed)", async () => {
      const doc = await createDoc({ title: "Audit lỗi" }, { as: sale });
      const originalCreate = payload.create.bind(payload);
      const failAudit = vi.spyOn(payload, "create").mockImplementation(((args: { collection: string }) =>
        args.collection === "audit-logs"
          ? Promise.reject(new Error("audit hỏng"))
          : originalCreate(args as never)) as never);
      try {
        await expect(softDelete(doc.id, sale)).rejects.toThrow();
        expect((await readDoc(doc.id)).deletedAt ?? null).toBeNull();

        await softDelete(doc.id, admin).catch(() => undefined);
        await expect(
          payload.delete({ collection: SLUG, id: doc.id, user: asUser(admin), overrideAccess: false }),
        ).rejects.toThrow();
        expect((await readDoc(doc.id)).id).toBe(doc.id);
      } finally {
        failAudit.mockRestore();
      }
      expect(await auditActions(doc.id)).toEqual([]);
    });

    it("khách chỉ đọc được bản đã xuất bản và chưa xoá mềm; staff đọc tất cả", async () => {
      const visible = await createDoc({ title: "Khách thấy", status: "published" }, { as: admin });
      const draft = await createDoc({ title: "Khách không thấy" }, { as: admin });
      const trashed = await createDoc({ title: "Đã xoá, đã xuất bản", status: "published" }, { as: admin });
      await softDelete(trashed.id, admin);

      const guest = await payload.find({
        collection: SLUG,
        overrideAccess: false,
        trash: true,
        depth: 0,
        pagination: false,
      });
      const guestIds = guest.docs.map((doc) => doc.id);
      expect(guestIds).toContain(visible.id);
      expect(guestIds).not.toContain(draft.id);
      expect(guestIds).not.toContain(trashed.id);

      const staff = await payload.find({
        collection: SLUG,
        user: asUser(sale),
        overrideAccess: false,
        depth: 0,
        pagination: false,
      });
      expect(staff.docs.map((doc) => doc.id)).toEqual(expect.arrayContaining([visible.id, draft.id]));
    });
  });

  describe("hasEnglish + translation", () => {
    it("chỉ đọc với mọi người: sale và admin gửi lên đều bị bỏ qua; translation.status mặc định none", async () => {
      const doc = await createDoc({ title: "Không bật được", hasEnglish: true }, { as: admin });
      expect(doc.hasEnglish).toBe(false);
      const attempted = await updateDoc(doc.id, { hasEnglish: true, translation: { status: "done" } }, { as: admin });
      expect(attempted.hasEnglish).toBe(false);
      const full = (await payload.findByID({
        collection: SLUG,
        id: doc.id,
        overrideAccess: true,
        depth: 0,
      })) as unknown as {
        translation: { status: string };
      };
      expect(full.translation.status).toBe("none");
    });

    it("hệ thống bật hasEnglish khi thiếu trường EN bắt buộc thì bị chặn, đủ thì được", async () => {
      const doc = await createDoc({ title: "Thiếu bản EN", summary: "tóm tắt" });

      await expect(updateDoc(doc.id, { hasEnglish: true })).rejects.toMatchObject({ name: "ValidationError" });
      expect((await readDoc(doc.id)).hasEnglish).toBe(false);

      await updateDoc(doc.id, { title: "Missing EN" }, { locale: "en" });
      await expect(updateDoc(doc.id, { hasEnglish: true })).rejects.toMatchObject({ name: "ValidationError" });

      const enabled = await updateDoc(doc.id, { summary: "summary", hasEnglish: true }, { locale: "en" });
      expect(enabled.hasEnglish).toBe(true);
    });

    it("đã bật hasEnglish thì xoá trống trường EN bắt buộc ở bản en bị chặn, sửa bản vi thì không", async () => {
      const doc = await createDoc({ title: "Đã bật", summary: "vi" });
      await updateDoc(doc.id, { title: "Enabled", summary: "en", hasEnglish: true }, { locale: "en" });

      await expect(updateDoc(doc.id, { summary: "" }, { locale: "en" })).rejects.toMatchObject({
        name: "ValidationError",
      });
      expect((await updateDoc(doc.id, { summary: "vi mới" })).hasEnglish).toBe(true);
    });
  });

  describe("revalidate vi + en", () => {
    it("xuất bản: làm mới chi tiết vi/en + danh sách vi/en; không làm mới khi chỉ là nháp", async () => {
      const draft = await createDoc({ title: "Nháp thôi" });
      await updateDoc(draft.id, { summary: "vẫn nháp" });
      expect(revalidateCalls).toHaveLength(0);

      await updateDoc(draft.id, { title: "Draft only" }, { locale: "en" });
      await updateDoc(draft.id, { status: "published" });
      expect(revalidateCalls).toHaveLength(1);
      expect(revalidateCalls[0]).toEqual(["/vi/tin-tuc/nhap-thoi", "/en/tin-tuc/draft-only", "/vi/tin-tuc", "/en/tin-tuc"]);
    });

    it("bài nổi bật làm mới cả trang chủ vi + en; xoá mềm bài đang công khai cũng làm mới", async () => {
      const doc = await createDoc({ title: "Nổi bật trang chủ", status: "published" }, { as: admin });
      await updateDoc(doc.id, { isFeatured: true }, { as: admin });
      expect(revalidateCalls.at(-1)).toEqual(expect.arrayContaining(["/vi", "/en", "/vi/tin-tuc/noi-bat-trang-chu"]));

      revalidateCalls.length = 0;
      await softDelete(doc.id, admin);
      expect(revalidateCalls).toHaveLength(1);
      expect(revalidateCalls[0]).toEqual(
        expect.arrayContaining(["/vi/tin-tuc/noi-bat-trang-chu", "/vi/tin-tuc", "/en/tin-tuc", "/vi"]),
      );
    });

    it("đổi slug bài đã xuất bản: làm mới cả slug cũ lẫn mới", async () => {
      const doc = await createDoc({ title: "Slug cũ", status: "published" }, { as: admin });
      revalidateCalls.length = 0;
      await updateDoc(doc.id, { slug: "slug-moi" }, { as: admin });
      expect(revalidateCalls[0]).toEqual(expect.arrayContaining(["/vi/tin-tuc/slug-moi", "/vi/tin-tuc/slug-cu"]));
    });
  });
});
