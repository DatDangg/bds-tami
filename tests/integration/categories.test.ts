import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedDefaultCategories } from "../../seed/categories";
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

describe.skipIf(!baseUrl)("integration: categories + developers (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_categories_${runId}`;
  const password = "Mat-khau-hop-le-123";
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let testUrl: string;

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
  }

  const createCategory = (data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "categories",
      data: data as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateCategory = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.update({
      collection: "categories",
      id,
      data: data as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const deleteCategory = (id: string, as: Actor = admin) =>
    payload.delete({ collection: "categories", id, user: asUser(as), overrideAccess: false, trash: true });

  const createDeveloper = (data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "developers",
      data: data as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  /** Ghi thẳng bảng để kiểm ràng buộc DB (bỏ qua hook của Payload). */
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
    const { buildCategoriesTestConfig } = await import("../fixtures/categories/payload-config");
    payload = await getPayload({ config: buildCategoriesTestConfig(testUrl) });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
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

  describe("quyền (PERMISSION §3.2)", () => {
    it("sale tạo / sửa / xoá category → 403", async () => {
      expect(await statusOf(createCategory({ name: "Của sale", scope: "news" }, { as: sale }))).toBe(403);
      const doc = await createCategory({ name: "Của admin", scope: "news" });
      expect(await statusOf(updateCategory(doc.id, { sortOrder: 5 }, { as: sale }))).toBe(403);
      expect(await statusOf(deleteCategory(doc.id, sale))).toBe(403);
    });

    it("sale tạo developer → 403; admin tạo được", async () => {
      expect(await statusOf(createDeveloper({ name: "Sale thử" }, { as: sale }))).toBe(403);
      expect((await createDeveloper({ name: "Vinhomes" })).slug).toBe("vinhomes");
    });

    it("khách và sale đọc được categories + developers; khách không đọc được thùng rác", async () => {
      const doc = await createCategory({ name: "Đọc công khai", scope: "job" });
      const asGuest = await payload.find({ collection: "categories", where: { id: { equals: doc.id } }, overrideAccess: false });
      expect(asGuest.docs).toHaveLength(1);
      await createDeveloper({ name: "Đọc developer" });
      const asSale = await payload.find({ collection: "developers", user: asUser(sale), overrideAccess: false });
      expect(asSale.docs.length).toBeGreaterThan(0);

      await updateCategory(doc.id, { deletedAt: NOW() });
      const guestTrash = await payload.find({
        collection: "categories",
        where: { id: { equals: doc.id } },
        trash: true,
        overrideAccess: false,
      });
      expect(guestTrash.docs).toHaveLength(0);
    });
  });

  describe("cây danh mục: parent cùng scope, tối đa 2 cấp", () => {
    it("con cùng scope với cha: được", async () => {
      const parent = await createCategory({ name: "Cha hợp lệ", scope: "rental" });
      const child = await createCategory({ name: "Con hợp lệ", scope: "rental", parent: parent.id });
      expect(child.parent).toBe(parent.id);
    });

    it("con khác scope với cha → lỗi 400", async () => {
      const parent = await createCategory({ name: "Cha rental", scope: "rental" });
      expect(await statusOf(createCategory({ name: "Con news", scope: "news", parent: parent.id }))).toBe(400);
    });

    it("cấp 3 (cha đã là con) → lỗi 400", async () => {
      const root = await createCategory({ name: "Gốc", scope: "project" });
      const level2 = await createCategory({ name: "Cấp 2", scope: "project", parent: root.id });
      expect(await statusOf(createCategory({ name: "Cấp 3", scope: "project", parent: level2.id }))).toBe(400);
    });

    it("tự làm cha của mình, cha không tồn tại → lỗi 400", async () => {
      const doc = await createCategory({ name: "Tự cha", scope: "job" });
      expect(await statusOf(updateCategory(doc.id, { parent: doc.id }))).toBe(400);
      expect(await statusOf(createCategory({ name: "Mồ côi", scope: "job", parent: MISSING_ID }))).toBe(400);
    });

    it("danh mục đang có con không được gắn vào cha khác (con sẽ xuống cấp 3)", async () => {
      const root = await createCategory({ name: "Gốc A", scope: "news" });
      const other = await createCategory({ name: "Gốc B", scope: "news" });
      await createCategory({ name: "Con của A", scope: "news", parent: root.id });
      expect(await statusOf(updateCategory(root.id, { parent: other.id }))).toBe(400);
    });

    it("sửa tên con (parent không đổi) vẫn được", async () => {
      const parent = await createCategory({ name: "Cha giữ", scope: "news" });
      const child = await createCategory({ name: "Con giữ", scope: "news", parent: parent.id });
      const renamed = await updateCategory(child.id, { name: "Con giữ đổi tên" });
      expect(renamed.name).toBe("Con giữ đổi tên");
    });

    it("scope không đổi được sau khi tạo (bị bỏ qua)", async () => {
      const doc = await createCategory({ name: "Khoá scope", scope: "news" });
      const updated = await updateCategory(doc.id, { scope: "rental", sortOrder: 7 });
      expect(updated.scope).toBe("news");
      expect(updated.sortOrder).toBe(7);
    });
  });

  describe("hardening sau review round 1", () => {
    it("MAJOR-1: duplicate bị chặn, không sinh bản trùng (en, scope, slug) ở locale khác", async () => {
      const doc = await createCategory({ name: "Nhân bản", scope: "news" });
      await updateCategory(doc.id, { name: "Duplicate me" }, { locale: "en" });
      const duplicate = payload.duplicate({ collection: "categories", id: doc.id, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(duplicate)).toBe(400);

      const english = await payload.find({
        collection: "categories",
        where: { and: [{ scope: { equals: "news" } }, { slug: { equals: "duplicate-me" } }] },
        locale: "en",
        fallbackLocale: false,
        overrideAccess: true,
        trash: true,
      });
      expect(english.docs).toHaveLength(1);
    });

    it("MINOR-1: Local API overrideAccess vẫn không đổi được scope", async () => {
      const doc = await createCategory({ name: "Khoá scope override", scope: "news" });
      const updated = await payload.update({
        collection: "categories",
        id: doc.id,
        data: { scope: "rental", sortOrder: 3 } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });
      expect(updated.scope).toBe("news");
      expect(updated.sortOrder).toBe(3);
      const other = await payload.update({
        collection: "categories",
        id: doc.id,
        data: { name: "Khoá scope override EN" } as never,
        locale: "en",
        overrideAccess: true,
        depth: 0,
      });
      expect(other.scope).toBe("news");
    });

    it("MINOR-2: không gắn parent đang ở thùng rác → 400", async () => {
      const parent = await createCategory({ name: "Cha trong thùng rác", scope: "job" });
      await updateCategory(parent.id, { deletedAt: NOW() });
      expect(await statusOf(createCategory({ name: "Con của cha đã xoá", scope: "job", parent: parent.id }))).toBe(400);
    });

    it("MINOR-3: scope ngoài danh sách → 400 (không phải 500)", async () => {
      expect(await statusOf(createCategory({ name: "Scope lạ", scope: "khong-co" }))).toBe(400);
    });
  });

  describe("chặn xoá", () => {
    it("xoá hẳn danh mục có con → 409; xoá mềm cũng bị chặn; xoá con rồi mới xoá được cha", async () => {
      const parent = await createCategory({ name: "Cha có con", scope: "property_post" });
      const child = await createCategory({ name: "Con phụ thuộc", scope: "property_post", parent: parent.id });
      expect(await statusOf(deleteCategory(parent.id))).toBe(409);
      expect(await statusOf(updateCategory(parent.id, { deletedAt: NOW() }))).toBe(409);

      await deleteCategory(child.id);
      await deleteCategory(parent.id);
      const gone = await payload.find({ collection: "categories", where: { id: { equals: parent.id } }, trash: true, overrideAccess: true });
      expect(gone.docs).toHaveLength(0);
    });

    it("con đã xoá mềm vẫn chặn xoá cha (xoá cha sẽ để parent trỏ vào bản ghi không còn)", async () => {
      const parent = await createCategory({ name: "Cha con xoá mềm", scope: "job" });
      const child = await createCategory({ name: "Con xoá mềm", scope: "job", parent: parent.id });
      await updateCategory(child.id, { deletedAt: NOW() });
      expect(await statusOf(deleteCategory(parent.id))).toBe(409);
    });

    it("danh mục đang có nội dung (scope news → collection news) → 409; hết nội dung thì xoá được", async () => {
      const category = await createCategory({ name: "Có bài viết", scope: "news" });
      const article = await payload.create({
        collection: "news" as never,
        data: { title: "Bài", category: category.id } as never,
        overrideAccess: true,
      });
      expect(await statusOf(deleteCategory(category.id))).toBe(409);
      expect(await statusOf(updateCategory(category.id, { deletedAt: NOW() }))).toBe(409);
      await payload.delete({ collection: "news" as never, id: (article as { id: string }).id, overrideAccess: true });
      await deleteCategory(category.id);
    });

    it("scope chưa có collection nội dung trong config (rental) thì không lỗi, chỉ kiểm danh mục con", async () => {
      const category = await createCategory({ name: "Rental trống", scope: "rental" });
      await deleteCategory(category.id);
    });
  });

  describe("slug theo (_locale, scope, slug)", () => {
    it("trùng cùng locale + scope → thêm hậu tố; khác scope thì cho trùng; locale khác độc lập", async () => {
      const first = await createCategory({ name: "Trùng tên", scope: "rental" });
      const second = await createCategory({ name: "Trùng tên", scope: "rental" });
      const otherScope = await createCategory({ name: "Trùng tên", scope: "news" });
      expect([first.slug, second.slug, otherScope.slug]).toEqual(["trung-ten", "trung-ten-2", "trung-ten"]);

      const english = await updateCategory(first.id, { name: "Same name" }, { locale: "en" });
      expect(english.slug).toBe("same-name");
      const englishClash = await updateCategory(second.id, { name: "Same name" }, { locale: "en" });
      expect(englishClash.slug).toBe("same-name-2");
    });

    it("sửa tên không đổi slug đã lưu (URL ổn định)", async () => {
      const doc = await createCategory({ name: "Giữ slug", scope: "job" });
      const renamed = await updateCategory(doc.id, { name: "Tên khác hẳn" });
      expect(renamed.slug).toBe("giu-slug");
    });

    it("DB giữ UNIQUE (_locale, scope, slug): ghi thẳng bản trùng bị từ chối", async () => {
      const a = await createCategory({ name: "Khoá DB", scope: "project" });
      const b = await createCategory({ name: "Khoá DB khác scope", scope: "news" });
      await withDatabase(async (client) => {
        const dup = client.query(
          `UPDATE categories_locales SET scope_slug = 'project/khoa-db' WHERE _parent_id = $1 AND _locale = 'vi'`,
          [b.id],
        );
        await expect(dup).rejects.toMatchObject({ code: "23505" });
        const stored = await client.query(
          `SELECT scope_slug FROM categories_locales WHERE _parent_id = $1 AND _locale = 'vi'`,
          [a.id],
        );
        expect(stored.rows[0].scope_slug).toBe("project/khoa-db");
      });
    });

    it("scopeSlug không lộ ra API", async () => {
      const doc = await createCategory({ name: "Ẩn khoá", scope: "job" });
      expect(doc).not.toHaveProperty("scopeSlug");
    });

    it("nhiều bản chỉ có tiếng Việt không đụng UNIQUE của bản en (scope_slug null)", async () => {
      await createCategory({ name: "Chỉ vi 1", scope: "job" });
      await createCategory({ name: "Chỉ vi 2", scope: "job" });
    });
  });

  describe("developers", () => {
    it("slug tự sinh từ name, trùng thì hậu tố; showAsPartner mặc định false; hasEnglish chỉ đọc", async () => {
      const first = await createDeveloper({ name: "Novaland" });
      const second = await createDeveloper({ name: "Novaland", showAsPartner: true, hasEnglish: true });
      expect([first.slug, second.slug]).toEqual(["novaland", "novaland-2"]);
      expect(first.showAsPartner).toBe(false);
      expect(second.showAsPartner).toBe(true);
      expect(second.hasEnglish).toBe(false);
    });

    it("website chỉ nhận http(s)", async () => {
      expect(await statusOf(createDeveloper({ name: "XSS", website: "javascript:alert(1)" }))).toBe(400);
      expect(await statusOf(createDeveloper({ name: "Sai", website: "khong-phai-url" }))).toBe(400);
      expect((await createDeveloper({ name: "Hợp lệ", website: "https://example.com" })).website).toBe("https://example.com");
    });

    it("không có trường status/author/isFeatured/seo/publishedAt", () => {
      const keys = payload.collections.developers.config.fields.flatMap((field) => ("name" in field ? [field.name] : []));
      for (const absent of ["status", "author", "isFeatured", "seo", "publishedAt"]) expect(keys).not.toContain(absent);
    });
  });

  describe("seed danh mục mặc định", () => {
    const countAll = async () => (await payload.count({ collection: "categories", overrideAccess: true, trash: true })).totalDocs;

    it("tạo đủ 11 mục theo ERD §4.3; chạy lần 2 không nhân đôi", async () => {
      const first = await seedDefaultCategories(payload);
      const afterFirst = await countAll();
      const second = await seedDefaultCategories(payload);
      expect(first.created + first.skipped).toBe(11);
      expect(second).toEqual({ created: 0, skipped: 11 });
      expect(await countAll()).toBe(afterFirst);

      const rental = await payload.find({
        collection: "categories",
        where: { and: [{ scope: { equals: "rental" } }, { slug: { in: ["can-ho-dich-vu", "studio", "mat-bang-kinh-doanh"] } }] },
        locale: "vi",
        overrideAccess: true,
        pagination: false,
      });
      expect(rental.docs.map((doc) => doc.slug).sort()).toEqual(["can-ho-dich-vu", "mat-bang-kinh-doanh", "studio"]);
    });

    it("không ghi đè tên admin đã sửa khi seed lại", async () => {
      const found = await payload.find({
        collection: "categories",
        where: { and: [{ scope: { equals: "news" } }, { slug: { equals: "tin-tami" } }] },
        locale: "vi",
        overrideAccess: true,
      });
      const doc = found.docs[0]!;
      await updateCategory(doc.id, { name: "Tin TAMI (đã sửa)" });
      await seedDefaultCategories(payload);
      const after = await payload.findByID({ collection: "categories", id: doc.id, locale: "vi", overrideAccess: true });
      expect(after.name).toBe("Tin TAMI (đã sửa)");
    });
  });
});
