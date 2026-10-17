import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedDefaultCategories } from "../../seed/categories";
import { seedSampleNews } from "../../seed/sample/news";
import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

type Locale = "vi" | "en";

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400, APIError 409). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

const NOW = () => new Date().toISOString();
const MISSING_ID = "11111111-1111-4111-8111-111111111111";
const lexical = (text: string) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    children: [{ type: "paragraph", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "text", version: 1, text }] }],
  },
});

describe.skipIf(!baseUrl)("integration: news (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_news_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedPaths: string[][] = [];
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let categoryId = "";
  let mediaId = "";
  let publicQueries: typeof import("../../src/lib/content/public-queries");

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  type Actor = Awaited<ReturnType<typeof createStaff>>;
  interface Options {
    as?: Actor;
    locale?: Locale;
    trash?: boolean;
  }

  const createCategory = (name: string, scope: string) =>
    payload.create({ collection: "categories", data: { name, scope } as never, locale: "vi", overrideAccess: true, depth: 0 });

  const createNews = (data: Record<string, unknown>, { as = sale, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "news",
      data: { excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, ...data } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateNews = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", trash = false }: Options = {}) =>
    payload.update({ collection: "news", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, trash });

  const deleteNews = (id: string, as: Actor) =>
    payload.delete({ collection: "news", id, user: asUser(as), overrideAccess: false, trash: true });

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  beforeAll(async () => {
    const connection = new pg.Client({ connectionString: baseUrl });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const url = new URL(baseUrl!);
    url.pathname = `/${dbName}`;
    testUrl = url.toString();
    process.env.DATABASE_URL = testUrl;
    const { getPayload } = await import("payload");
    const { buildNewsTestConfig } = await import("../fixtures/news/payload-config");
    payload = await getPayload({ config: buildNewsTestConfig(testUrl, (paths) => void revalidatedPaths.push(paths)) });
    publicQueries = await import("../../src/lib/content/public-queries");
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("othersale", ROLES.sale);
    categoryId = (await createCategory("Thị trường", "news")).id;
    // Trường upload chỉ cần một `media` tồn tại: chèn thẳng một dòng để khỏi ghi file ra đĩa.
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" DEFAULT VALUES RETURNING id`));
    mediaId = inserted.rows[0].id as string;
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

  beforeEach(() => {
    revalidatedPaths.length = 0;
  });

  describe("cấu hình + schema", () => {
    it("đủ trường ERD §4.8 và không có quan hệ tới leads (BR-04)", () => {
      const fields = payload.collections.news!.config.flattenedFields;
      const names = fields.map((field) => field.name);
      expect(names).toEqual(
        expect.arrayContaining(["title", "slug", "category", "cover", "excerpt", "content", "tags", "status", "publishedAt", "author", "isFeatured", "hasEnglish", "translation", "seo"]),
      );
      const targets = new Set(fields.flatMap((field) => ("relationTo" in field ? [field.relationTo].flat().map(String) : [])));
      expect([...targets].sort()).toEqual(["categories", "media", "staff"]);
      expect(payload.collections.news!.config.trash).toBe(true);
    });

    it("DB tạm có UNIQUE (slug, _locale) trên news_locales", async () => {
      const rows = await withDatabase((client) => client.query(`SELECT indexdef FROM pg_indexes WHERE tablename = 'news_locales'`));
      const defs = rows.rows.map((row) => String(row.indexdef));
      expect(defs.some((def) => def.includes("UNIQUE") && def.includes("(slug, _locale)"))).toBe(true);
    });
  });

  describe("quyền (PERMISSION §3.1)", () => {
    it("sale tạo tin của mình (author tự gán); sale sửa / xoá tin của sale khác → 403", async () => {
      const mine = await createNews({ title: "Tin của sale" });
      expect(String(typeof mine.author === "object" ? mine.author.id : mine.author)).toBe(sale.id);
      expect((await updateNews(mine.id, { excerpt: "Sửa của mình" }, { as: sale })).excerpt).toBe("Sửa của mình");
      expect(await statusOf(updateNews(mine.id, { excerpt: "Phá" }, { as: otherSale }))).toBe(403);
      expect(await statusOf(updateNews(mine.id, { deletedAt: NOW() }, { as: otherSale }))).toBe(403);
      expect(await statusOf(deleteNews(mine.id, otherSale))).toBe(403);
    });

    it("sale xoá mềm bài của mình nhưng không xoá hẳn và không khôi phục; admin khôi phục và xoá hẳn", async () => {
      const mine = await createNews({ title: "Xoá mềm" });
      await updateNews(mine.id, { deletedAt: NOW() }, { as: sale });
      expect(await statusOf(deleteNews(mine.id, sale))).toBe(403);
      expect(await statusOf(updateNews(mine.id, { deletedAt: null }, { as: sale, trash: true }))).toBe(403);
      const restored = await updateNews(mine.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      await deleteNews(mine.id, admin);
      const gone = await payload.find({ collection: "news", where: { id: { equals: mine.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("admin sửa bài của sale; khách không tạo được", async () => {
      const mine = await createNews({ title: "Admin sửa" });
      expect((await updateNews(mine.id, { excerpt: "Admin đã sửa" })).excerpt).toBe("Admin đã sửa");
      const guestCreate = payload.create({ collection: "news", data: { title: "Khách", excerpt: "x", category: categoryId } as never, overrideAccess: false });
      expect(await statusOf(guestCreate)).toBe(403);
    });
  });

  describe("category thuộc scope news", () => {
    it("danh mục sai scope, không tồn tại hoặc thiếu → 400; đúng scope → được", async () => {
      const wrong = await createCategory("Cho thuê X", "rental");
      expect(await statusOf(createNews({ title: "Sai scope", category: wrong.id }))).toBe(400);
      expect(await statusOf(createNews({ title: "Không tồn tại", category: MISSING_ID }))).toBe(400);
      expect(await statusOf(createNews({ title: "Thiếu danh mục", category: null }))).toBe(400);
      expect((await createNews({ title: "Đúng scope" })).category).toBe(categoryId);
    });

    it("đổi sang danh mục sai scope khi sửa bị chặn; sửa một phần không gửi category vẫn hợp lệ", async () => {
      const wrong = await createCategory("Dự án Y", "project");
      const doc = await createNews({ title: "Đổi danh mục" });
      expect(await statusOf(updateNews(doc.id, { category: wrong.id }))).toBe(400);
      expect((await updateNews(doc.id, { excerpt: "Chỉ sửa tóm tắt" })).category).toBe(categoryId);
    });

    it("không xoá được danh mục đang có tin tức (xoá hẳn và xoá mềm → 409); hết tin thì xoá được", async () => {
      const category = await createCategory("Có tin", "news");
      const doc = await createNews({ title: "Giữ danh mục", category: category.id });
      const hardDelete = () => payload.delete({ collection: "categories", id: category.id, user: asUser(admin), overrideAccess: false, trash: true });
      const softDelete = () =>
        payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(hardDelete())).toBe(409);
      expect(await statusOf(softDelete())).toBe(409);
      await deleteNews(doc.id, admin);
      await hardDelete();
    });
  });

  describe("trường bắt buộc", () => {
    it("title, excerpt, content bắt buộc ở bản vi khi tạo; slug sinh từ tiêu đề", async () => {
      expect(await statusOf(createNews({ title: "" }))).toBe(400);
      expect(await statusOf(createNews({ title: "Thiếu tóm tắt", excerpt: "" }))).toBe(400);
      expect(await statusOf(createNews({ title: "Thiếu nội dung", content: { root: { type: "root", version: 1, children: [] } } }))).toBe(400);
      expect((await createNews({ title: "Tin Thị Trường", content: lexical("Nội dung") })).slug).toBe("tin-thi-truong");
    });

    it("cover bắt buộc khi published; nháp được thiếu; sửa một phần giữ bản đã lưu", async () => {
      expect(await statusOf(createNews({ title: "Xuất bản thiếu bìa", status: "published", content: lexical("x") }))).toBe(400);
      const published = await createNews({ title: "Có bìa", status: "published", cover: mediaId, content: lexical("x") });
      expect(published.status).toBe("published");
      expect((await updateNews(published.id, { excerpt: "Sửa một phần" })).excerpt).toBe("Sửa một phần");
      expect(await statusOf(updateNews(published.id, { cover: null }))).toBe(400);
    });

    it("tags là mảng chữ", async () => {
      const doc = await createNews({ title: "Có tags", tags: ["a", "b"], content: lexical("x") });
      expect(doc.tags).toEqual(["a", "b"]);
    });
  });

  describe("truy vấn công khai (publicWhere) + làm mới cache", () => {
    it("PublicCollectionSlug nhận news: khách không thấy draft / hidden / xoá mềm; en cần hasEnglish; slug theo locale", async () => {
      const content = lexical("vi");
      const live = await createNews({ title: "Tin công khai", status: "published", cover: mediaId, content });
      await createNews({ title: "Tin nháp", content });
      const hidden = await createNews({ title: "Tin ẩn", status: "published", cover: mediaId, content });
      await updateNews(hidden.id, { status: "hidden" });
      const gone = await createNews({ title: "Tin xoá", status: "published", cover: mediaId, content });
      await updateNews(gone.id, { deletedAt: NOW() });

      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "news", "vi")).docs.map((doc) => doc.title);
      expect(titles).toContain("Tin công khai");
      for (const unseen of ["Tin nháp", "Tin ẩn", "Tin xoá"]) expect(titles).not.toContain(unseen);

      expect(await publicQueries.findPublicBySlug(payload, "news", "en", "tin-cong-khai")).toBeNull();
      const enIds = (await publicQueries.findPublicList<{ id: string }>(payload, "news", "en")).docs.map((doc) => doc.id);
      expect(enIds).not.toContain(live.id);
      await payload.update({
        collection: "news",
        id: live.id,
        data: { title: "Public news", excerpt: "S", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "news", "en", "public-news")).not.toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "news", "vi", "tin-cong-khai")).not.toBeNull();
    });

    it("xuất bản làm mới /tin-tuc/[slug] + /tin-tuc của vi và en; nháp thì không; nổi bật làm mới trang chủ", async () => {
      const doc = await createNews({ title: "Làm mới tin", content: lexical("x") });
      expect(revalidatedPaths).toEqual([]);
      await updateNews(doc.id, { status: "published", cover: mediaId, isFeatured: true });
      expect(revalidatedPaths.flat()).toEqual(
        expect.arrayContaining(["/vi/tin-tuc/lam-moi-tin", "/vi/tin-tuc", "/en/tin-tuc", "/vi", "/en"]),
      );
    });
  });

  describe("Duplicate (review L5-T02 MINOR-3)", () => {
    it("overrideAccess: true: slug en sinh lại hoặc rỗng VÀ hasEnglish = false; không có chữ 'copy'", async () => {
      const doc = await createNews({ title: "Bản gốc song ngữ", content: lexical("vi") });
      await payload.update({
        collection: "news",
        id: doc.id,
        data: { title: "Bilingual original", excerpt: "S", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const copy = await payload.duplicate({ collection: "news", id: doc.id, overrideAccess: true, depth: 0, locale: "vi" });
      const stored = await payload.findByID({ collection: "news", id: copy.id, locale: "all", overrideAccess: true, depth: 0 });
      const slugs = stored.slug as unknown as Record<Locale, string | null>;
      expect(slugs.vi).toBe("ban-goc-song-ngu-2");
      expect(JSON.stringify(slugs)).not.toMatch(/copy/i);
      expect([null, undefined, "bilingual-original-2"]).toContain(slugs.en);
      expect(stored.hasEnglish).toBe(false);
      const original = await payload.findByID({ collection: "news", id: doc.id, locale: "all", overrideAccess: true, depth: 0 });
      expect(original.hasEnglish).toBe(true);
    });
  });

  describe("seed", () => {
    it("seedSampleNews: thiếu danh mục báo lỗi rõ; chạy 2 lần không nhân đôi; tin là bản nháp", async () => {
      await expect(seedSampleNews(payload)).rejects.toThrow(/seed:categories/);
      await seedDefaultCategories(payload);
      expect(await seedSampleNews(payload)).toEqual({ created: 2, skipped: 0 });
      expect(await seedSampleNews(payload)).toEqual({ created: 0, skipped: 2 });
      const seeded = await payload.find({
        collection: "news",
        where: { title: { equals: "TAMI ra mắt website mới" } },
        locale: "vi",
        depth: 0,
        overrideAccess: true,
      });
      expect(seeded.docs[0]?.status).toBe("draft");
      expect(seeded.docs[0]?.tags).toEqual(["tami", "website"]);
    });
  });
});
