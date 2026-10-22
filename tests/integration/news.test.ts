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
  let pdfMediaId = "";
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
    // Trường upload chỉ cần `media` tồn tại: chèn thẳng dòng để khỏi ghi file ra đĩa. Có `mime_type` vì `cover` chỉ nhận ảnh (filterOptions).
    const insertMedia = async (mimeType: string) =>
      (await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, [mimeType]))).rows[0].id as string;
    mediaId = await insertMedia("image/jpeg");
    pdfMediaId = await insertMedia("application/pdf");
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

  describe("danh mục ở thùng rác (review L5-T03 MINOR-3)", () => {
    const messagesOf = async (promise: Promise<unknown>): Promise<string[]> => {
      try {
        await promise;
      } catch (error) {
        const data = (error as { data?: { errors?: { message: string }[] } }).data;
        return data?.errors?.map((entry) => entry.message) ?? [(error as Error).message];
      }
      return [];
    };
    const trashCategory = (id: string) =>
      payload.update({ collection: "categories", id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });

    it("gán tin cho danh mục đã ở thùng rác bị chặn với thông báo rõ (scoped-category.ts nhánh deletedAt)", async () => {
      const category = await createCategory("Sẽ vào thùng rác", "news");
      await trashCategory(category.id);
      const messages = await messagesOf(createNews({ title: "Vào danh mục rác", category: category.id }));
      expect(messages.join(" ")).toMatch(/thùng rác/);
      expect(await statusOf(createNews({ title: "Vào danh mục rác 2", category: category.id }))).toBe(400);
    });

    it("quyết định UX: danh mục còn tin (kể cả tin ở thùng rác) không xoá mềm được (409), nên khôi phục tin luôn thấy danh mục còn sống", async () => {
      const category = await createCategory("Chỉ còn tin rác", "news");
      const doc = await createNews({ title: "Tin sẽ vào thùng rác", category: category.id });
      await updateNews(doc.id, { deletedAt: NOW() });
      expect(await statusOf(trashCategory(category.id))).toBe(409);
      const restored = await updateNews(doc.id, { deletedAt: null }, { as: admin, trash: true });
      expect(restored.deletedAt ?? null).toBeNull();
      expect(restored.category).toBe(category.id);
    });
  });

  describe("làm mới cache khi sửa danh mục (spec-validation layer 4, G13)", () => {
    it("đổi tên / đổi slug danh mục news làm mới /tin-tuc và trang danh mục (slug cũ + mới, vi + en)", async () => {
      const category = await createCategory("Danh mục làm mới", "news");
      revalidatedPaths.length = 0;
      await payload.update({ collection: "categories", id: category.id, data: { name: "Danh mục đã đổi tên", slug: "slug-moi" } as never, locale: "vi", user: asUser(admin), overrideAccess: false });
      const flat = revalidatedPaths.flat();
      expect(flat).toEqual(expect.arrayContaining(["/vi/tin-tuc", "/en/tin-tuc", "/vi/tin-tuc/danh-muc/slug-moi", "/vi/tin-tuc/danh-muc/danh-muc-lam-moi"]));
    });

    it("danh mục scope khác (rental) làm mới danh sách cho thuê, không đụng /tin-tuc", async () => {
      const category = await createCategory("Cho thuê làm mới", "rental");
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi/cho-thue", "/en/cho-thue"]));
      expect(revalidatedPaths.flat()).not.toContain("/vi/tin-tuc");
      expect(category.id).toBeTruthy();
    });

    it("xoá mềm danh mục (không còn tin) cũng làm mới", async () => {
      const category = await createCategory("Sắp xoá", "news");
      revalidatedPaths.length = 0;
      await payload.update({ collection: "categories", id: category.id, data: { deletedAt: NOW() }, user: asUser(admin), overrideAccess: false });
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi/tin-tuc", "/vi/tin-tuc/danh-muc/sap-xoa"]));
    });
  });

  describe("trang tin tức công khai (layer-6-task-06)", () => {
    const publish = (title: string, data: Record<string, unknown> = {}) =>
      createNews({ title, status: "published", cover: mediaId, content: lexical(`Nội dung ${title}`), ...data });
    const setPublishedAt = (id: string, iso: string) =>
      withDatabase((client) => client.query(`UPDATE "news" SET published_at = $1 WHERE id = $2`, [iso, id]));
    const makeEnglish = (id: string, title: string) =>
      payload.update({
        collection: "news",
        id,
        data: { title, excerpt: "Summary", content: lexical(`Body ${title}`), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
    let newsQueries: typeof import("../../src/lib/news/news-queries");
    let listing: typeof import("../../src/lib/news/news-listing");

    beforeAll(async () => {
      newsQueries = await import("../../src/lib/news/news-queries");
      listing = await import("../../src/lib/news/news-listing");
    });

    it("bài liên quan: cùng danh mục, loại bài hiện tại, tối đa 3, mới nhất trước, chỉ bài công khai", async () => {
      const category = await createCategory("Liên quan A", "news");
      const other = await createCategory("Liên quan B", "news");
      const current = await publish("Bài đang xem", { category: category.id });
      const ids: string[] = [];
      for (const [index, title] of ["Liên quan 1", "Liên quan 2", "Liên quan 3", "Liên quan 4"].entries()) {
        const doc = await publish(title, { category: category.id });
        await setPublishedAt(doc.id, `2026-01-0${index + 1}T00:00:00.000Z`);
        ids.push(doc.id);
      }
      await publish("Khác danh mục", { category: other.id });
      await createNews({ title: "Nháp cùng danh mục", category: category.id });
      const hidden = await publish("Ẩn cùng danh mục", { category: category.id });
      await updateNews(hidden.id, { status: "hidden" });
      const gone = await publish("Xoá cùng danh mục", { category: category.id });
      await updateNews(gone.id, { deletedAt: NOW() });

      const related = await newsQueries.findRelatedNews(payload, "vi", { id: current.id, category: category.id });
      expect(related).toHaveLength(3);
      expect(related.map((doc) => doc.title)).toEqual(["Liên quan 4", "Liên quan 3", "Liên quan 2"]);
      expect(related.map((doc) => doc.id)).not.toContain(current.id);
    });

    it("bài liên quan nhận cả category đã populate; không có category → rỗng", async () => {
      const category = await createCategory("Liên quan C", "news");
      const current = await publish("Bài C1", { category: category.id });
      await publish("Bài C2", { category: category.id });
      const populated = (await payload.findByID({ collection: "news", id: current.id, depth: 1, overrideAccess: true })) as never as Parameters<typeof newsQueries.findRelatedNews>[2];
      expect(await newsQueries.findRelatedNews(payload, "vi", populated)).toHaveLength(1);
      expect(await newsQueries.findRelatedNews(payload, "vi", { id: current.id, category: null })).toEqual([]);
    });

    it("/en: bài liên quan chỉ gồm bài đã có bản EN", async () => {
      const category = await createCategory("Liên quan D", "news");
      const current = await publish("Bài D1", { category: category.id });
      const withEnglish = await publish("Bài D2", { category: category.id });
      await publish("Bài D3 chưa dịch", { category: category.id });
      await makeEnglish(current.id, "Article D1");
      await makeEnglish(withEnglish.id, "Article D2");
      const related = await newsQueries.findRelatedNews(payload, "en", { id: current.id, category: category.id });
      expect(related.map((doc) => doc.title)).toEqual(["Article D2"]);
    });

    it("trang danh mục: lọc theo danh mục + con, khối nổi bật 4 bài + 12 bài/trang, phân trang không trùng", async () => {
      const parent = await createCategory("Mục cha", "news");
      const child = await payload.create({ collection: "categories", data: { name: "Mục con", scope: "news", parent: parent.id } as never, locale: "vi", overrideAccess: true, depth: 0 });
      for (let index = 1; index <= 17; index += 1) await publish(`Tin mục cha ${index}`, { category: parent.id });
      await publish("Tin mục con", { category: child.id });
      await publish("Tin ngoài mục", { category: categoryId });

      // Trang 1 danh mục có khối nổi bật (không cờ isFeatured → 4 bài mới nhất của danh mục), bị loại khỏi lưới nên 17 bài = 4 + 12 + 1.
      const parentOnly = await listing.loadNewsListing(payload, "vi", { page: 1, categoryIds: [parent.id] });
      expect(parentOnly.items).toHaveLength(12);
      expect(parentOnly.featured).toHaveLength(4);
      for (const card of parentOnly.featured) expect(card.title).toMatch(/^Tin mục cha /);
      expect(parentOnly.items.map((item) => item.id)).not.toEqual(expect.arrayContaining([parentOnly.featured[0]?.id]));
      expect(parentOnly.featured[0]?.readMinutes).toBe(1);
      const withChildren = await listing.loadNewsListing(payload, "vi", { page: 1, categoryIds: [parent.id, child.id] });
      const page2 = await listing.loadNewsListing(payload, "vi", { page: 2, categoryIds: [parent.id, child.id] });
      expect(withChildren.totalPages).toBe(2);
      expect(page2.items).toHaveLength(2);
      expect(page2.featured).toEqual([]);
      const titles = [...withChildren.featured, ...withChildren.items, ...page2.items].map((item) => item.title);
      expect(new Set(titles).size).toBe(18);
      expect(titles).toContain("Tin mục con");
      expect(titles).not.toContain("Tin ngoài mục");
      const flaggedChild = await publish("Tin mục con nổi bật", { category: child.id });
      await updateNews(flaggedChild.id, { isFeatured: true });
      await setPublishedAt(flaggedChild.id, "2025-01-01T00:00:00.000Z");
      const flaggedListing = await listing.loadNewsListing(payload, "vi", { page: 1, categoryIds: [parent.id, child.id] });
      // `isFeatured` đứng đầu dù cũ hơn, rồi 3 bài mới nhất.
      expect(flaggedListing.featured.map((card) => card.id)[0]).toBe(flaggedChild.id);
      expect(flaggedListing.featured).toHaveLength(4);
      const beyond = await listing.loadNewsListing(payload, "vi", { page: 3, categoryIds: [parent.id, child.id] });
      expect(beyond.outOfRange).toBe(true);
      const emptyCategory = await createCategory("Mục trống", "news");
      const empty = await listing.loadNewsListing(payload, "vi", { page: 1, categoryIds: [emptyCategory.id] });
      expect(empty).toMatchObject({ isEmpty: true, outOfRange: false, items: [], featured: [] });
    });

    it("/tin-tuc trang 1: khối nổi bật 4 bài + lưới 12 bài; trang 2 không lặp; đủ mọi bài, không trùng", async () => {
      const first = await listing.loadNewsListing(payload, "vi", { page: 1 });
      const seen = [...first.featured, ...first.items];
      for (let page = 2; page <= first.totalPages; page += 1) seen.push(...(await listing.loadNewsListing(payload, "vi", { page })).items);
      expect(first.featured).toHaveLength(4);
      expect(first.items.length).toBeLessThanOrEqual(12);
      expect(new Set(seen.map((card) => card.id)).size).toBe(seen.length);
      const total = (await publicQueries.findPublicList(payload, "news", "vi", { limit: 50 })).totalDocs;
      expect(seen).toHaveLength(total);
      const page2 = await listing.loadNewsListing(payload, "vi", { page: 2 });
      expect(page2.featured).toEqual([]);
      expect(page2.items.map((card) => card.id)).not.toContain(first.featured[0]?.id);
    });

    it("q không dấu (tiêu đề + tóm tắt, mọi từ), tag khớp đúng, sort=oldest; lọc → không nổi bật, không loại bài; chỉ bài công khai", async () => {
      const scope = await createCategory("Tìm kiếm BL054", "news");
      const a = await publish("Đông Anh lên quận zq54", { category: scope.id, excerpt: "Hạ tầng phía Bắc", tags: ["quy hoạch", "đông anh"] });
      const b = await publish("Thị trường căn hộ zq54", { category: scope.id, excerpt: "Nguồn cung ĐÔNG ANH tăng mạnh", tags: ["thị trường zq54"] });
      const c = await publish("Pháp lý zq54", { category: scope.id, tags: [" quy hoạch "] });
      await createNews({ title: "Đông Anh nháp zq54", category: scope.id, tags: ["chỉ nháp zq54"] });
      await setPublishedAt(a.id, "2026-02-03T00:00:00.000Z");
      await setPublishedAt(b.id, "2026-02-02T00:00:00.000Z");
      await setPublishedAt(c.id, "2026-02-01T00:00:00.000Z");
      const load = (filters: { q?: string; tag?: string; sort?: "newest" | "oldest" }, locale: Locale = "vi", categoryIds?: string[]) =>
        listing.loadNewsListing(payload, locale, { page: 1, filters: { sort: "newest", ...filters }, ...(categoryIds ? { categoryIds } : {}) });
      const ids = (result: Awaited<ReturnType<typeof load>>) => result.items.map((item) => item.id);

      const byQ = await load({ q: "dong ANH zq54" });
      expect(ids(byQ)).toEqual([a.id, b.id]);
      expect(byQ).toMatchObject({ featured: [], totalDocs: 2, isEmpty: false });
      expect(ids(await load({ q: "zq54", sort: "oldest" }))).toEqual([c.id, b.id, a.id]);
      expect(ids(await load({ q: "zq54" }, "vi", [categoryId]))).toEqual([]);
      // Ký tự đại diện của LIKE / chuỗi SQL là chữ thường, không lỗi.
      expect(await load({ q: "zq54 %" })).toMatchObject({ isEmpty: true, items: [] });
      expect(await load({ q: "' OR 1=1 --" })).toMatchObject({ isEmpty: true });
      expect(ids(await load({ tag: "quy hoạch" }))).toEqual([a.id, c.id]);
      expect(ids(await load({ tag: "quy hoach" }))).toEqual([]);
      expect(ids(await load({ tag: "quy hoạch", q: "dong anh" }))).toEqual([a.id]);
      const sortedOnly = await load({ sort: "oldest" });
      expect(sortedOnly.featured).toEqual([]);

      await makeEnglish(a.id, "Dong Anh becomes a district zq54");
      expect(ids(await load({ q: "district zq54" }, "en"))).toEqual([a.id]);
      expect(ids(await load({ q: "district zq54" }))).toEqual([]);

      const search = await import("../../src/lib/news/news-search");
      const tags = await search.listTopNewsTags(payload, "vi");
      expect(tags.length).toBeLessThanOrEqual(12);
      expect(tags).toContain("quy hoạch");
      expect(tags.indexOf("quy hoạch")).toBeLessThan(tags.indexOf("thị trường zq54"));
      expect(tags).not.toContain("chỉ nháp zq54");
      expect(tags).not.toContain(" quy hoạch ");
      expect(await search.listTopNewsTags(payload, "en")).toEqual([]);
    });

    it("/en: lưới và danh mục chỉ gồm nội dung đã có bản EN", async () => {
      const category = await createCategory("Chỉ vi", "news");
      expect((await listing.buildNewsChips(payload, "en", "All", null)).map((chip) => chip.label)).not.toContain("Chỉ vi");
      expect(await listing.loadNewsCategoryContext(payload, "en", "chi-vi")).toBeNull();
      expect(await listing.loadNewsCategoryContext(payload, "vi", "chi-vi")).not.toBeNull();
      expect(category.id).toBeTruthy();
    });

    it("chip: /tin-tuc = Tất cả (current) + danh mục cấp 1; trang danh mục cha có con = Tất cả + con", async () => {
      const parent = await createCategory("Chip cha", "news");
      await payload.create({ collection: "categories", data: { name: "Chip con", scope: "news", parent: parent.id } as never, locale: "vi", overrideAccess: true, depth: 0 });
      const all = await listing.buildNewsChips(payload, "vi", "Tất cả", null);
      expect(all[0]).toMatchObject({ label: "Tất cả", href: "/tin-tuc", current: true });
      expect(all.find((chip) => chip.label === "Chip cha")).toMatchObject({ href: "/tin-tuc/danh-muc/chip-cha" });
      expect(all.filter((chip) => chip.current)).toHaveLength(1);
      expect(all.map((chip) => chip.label)).not.toContain("Chip con");

      const context = await listing.loadNewsCategoryContext(payload, "vi", "chip-cha");
      const chips = await listing.buildNewsChips(payload, "vi", "Tất cả", context);
      expect(chips.map((chip) => chip.label)).toEqual(["Tất cả", "Chip con"]);
      expect(chips[0]).toMatchObject({ href: "/tin-tuc/danh-muc/chip-cha", current: true });
      const childContext = await listing.loadNewsCategoryContext(payload, "vi", "chip-con");
      expect(childContext?.parent?.name).toBe("Chip cha");
      const childChips = await listing.buildNewsChips(payload, "vi", "Tất cả", childContext);
      expect(childChips.filter((chip) => chip.current).map((chip) => chip.label)).toEqual(["Chip con"]);
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

    it("cover chỉ nhận ảnh: PDF hoặc id media sai → 400 (validator upload mặc định vẫn chạy cùng kiểm publish)", async () => {
      expect(await statusOf(createNews({ title: "Bìa PDF", status: "published", cover: pdfMediaId, content: lexical("x") }))).toBe(400);
      expect(await statusOf(createNews({ title: "Nháp bìa PDF", cover: pdfMediaId, content: lexical("x") }))).toBe(400);
      expect(await statusOf(createNews({ title: "Bìa id sai", status: "published", cover: "khong-phai-uuid", content: lexical("x") }))).toBe(400);
      expect(await statusOf(createNews({ title: "Bìa không tồn tại", status: "published", cover: "00000000-0000-4000-8000-000000000000", content: lexical("x") }))).toBe(400);
      expect((await createNews({ title: "Bìa ảnh", status: "published", cover: mediaId, content: lexical("x") })).status).toBe("published");
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

  describe("khối chèn trong nội dung (BL-054)", () => {
    const withBlocks = (...blocks: Record<string, unknown>[]) => {
      const content = lexical("Mở bài");
      (content.root.children as unknown[]).push(...blocks.map((fields, index) => ({ type: "block", version: 2, format: "", fields: { id: `blk${index}`, blockName: "", ...fields } })));
      return content;
    };
    const blockFields = (content: unknown) =>
      ((content as { root: { children: { type: string; fields?: Record<string, unknown> }[] } }).root.children ?? []).filter((node) => node.type === "block").map((node) => node.fields!);

    it("editor của news.content có đúng 3 khối; editor toàn cục (collection khác) không có khối", () => {
      const content = payload.collections.news!.config.flattenedFields.find((field) => field.name === "content") as { editor?: { editorConfig?: { resolvedFeatureMap?: Map<string, { sanitizedServerFeatureProps?: { blocks?: { slug: string }[] } }> } } };
      const blocksFeature = content?.editor?.editorConfig?.resolvedFeatureMap?.get("blocks");
      expect(blocksFeature?.sanitizedServerFeatureProps?.blocks?.map((block) => block.slug)).toEqual(["statHighlights", "projectMention", "imageText"]);
      const globalEditor = payload.config.editor as { editorConfig?: { resolvedFeatureMap?: Map<string, unknown> } };
      expect(globalEditor.editorConfig?.resolvedFeatureMap?.has("blocks")).toBe(false);
    });

    it("lưu 3 khối ở vi và en (theo từng bản), đọc depth 1: ảnh populate, dự án chỉ là id", async () => {
      const projectId = ((await payload.create({ collection: "projects" as never, data: { title: "Dự án X" } as never, overrideAccess: true, depth: 0 })) as { id: string }).id;
      const vi = withBlocks(
        { blockType: "statHighlights", items: [{ value: "+18%", label: "Nguồn cung mới" }] },
        { blockType: "projectMention", project: projectId },
        { blockType: "imageText", image: mediaId, text: "Ảnh cạnh chữ", imagePosition: "right" },
      );
      const doc = await createNews({ title: "Bài có khối", content: vi });
      await payload.update({
        collection: "news",
        id: doc.id,
        data: { title: "Article with blocks", excerpt: "S", content: withBlocks({ blockType: "statHighlights", items: [{ value: "+18%", label: "New supply" }] }), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const readVi = await payload.findByID({ collection: "news", id: doc.id, locale: "vi", depth: 1, overrideAccess: true });
      const [stat, mention, imageText] = blockFields(readVi.content);
      expect(stat).toMatchObject({ blockType: "statHighlights", items: [{ value: "+18%", label: "Nguồn cung mới" }] });
      expect(mention).toMatchObject({ blockType: "projectMention", project: projectId });
      expect(imageText).toMatchObject({ blockType: "imageText", text: "Ảnh cạnh chữ", imagePosition: "right", image: { id: mediaId } });
      const readEn = await payload.findByID({ collection: "news", id: doc.id, locale: "en", depth: 0, overrideAccess: true });
      expect(blockFields(readEn.content)).toEqual([expect.objectContaining({ blockType: "statHighlights", items: [expect.objectContaining({ label: "New supply" })] })]);
    });

    it("khối thiếu dữ liệu bắt buộc / vượt giới hạn → 400 (không lưu bài hỏng)", async () => {
      const bad = [
        { blockType: "statHighlights", items: [] },
        { blockType: "statHighlights", items: [{ value: "12345678901234567", label: "Quá dài" }] },
        { blockType: "statHighlights", items: Array.from({ length: 5 }, (_, index) => ({ value: String(index), label: "x" })) },
        { blockType: "imageText", text: "Thiếu ảnh", imagePosition: "left" },
        { blockType: "imageText", image: pdfMediaId, text: "PDF", imagePosition: "left" },
        { blockType: "projectMention" },
      ];
      for (const fields of bad) expect(await statusOf(createNews({ title: `Khối hỏng ${String(fields.blockType)}`, content: withBlocks(fields) })), JSON.stringify(fields)).toBe(400);
    });
  });
});
