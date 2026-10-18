import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { seedLegalPages } from "../../seed/pages";
import { seedSampleServices } from "../../seed/sample/services";
import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

type Locale = "vi" | "en";

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

const NOW = () => new Date().toISOString();
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

describe.skipIf(!baseUrl)("integration: services + pages (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_svcpages_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedPaths: string[][] = [];
  const revalidatedTags: string[][] = [];
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
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
  }

  const createService = (data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "services",
      data: { summary: "Mô tả ngắn", ...data } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updateService = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.update({ collection: "services", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0 });

  const createPage = (data: Record<string, unknown>, { as = admin, locale = "vi" }: Options = {}) =>
    payload.create({
      collection: "pages",
      data: { title: "Trang", content: lexical("Nội dung"), version: "1.0", effectiveDate: NOW(), ...data } as never,
      locale,
      user: asUser(as),
      overrideAccess: false,
      depth: 0,
    });

  const updatePage = (id: string, data: Record<string, unknown>, { as = admin, locale = "vi", approve = false }: Options & { approve?: boolean } = {}) =>
    payload.update({ collection: "pages", id, data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0, context: approve ? { approveEnglish: true } : {} });

  const readSettings = () => payload.findGlobal({ slug: "site-settings", locale: "vi", overrideAccess: true });

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  /** Xoá hẳn mọi bản ghi `pages` (cả thùng rác) để mỗi test có `kind` trống. */
  async function clearPages() {
    await withDatabase((client) => client.query(`DELETE FROM "pages"`));
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
    const { buildServicesPagesTestConfig } = await import("../fixtures/services-pages/payload-config");
    payload = await getPayload({
      config: buildServicesPagesTestConfig(
        testUrl,
        (paths) => void revalidatedPaths.push(paths),
        (tags) => void revalidatedTags.push(tags),
      ),
    });
    publicQueries = await import("../../src/lib/content/public-queries");
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    await payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI" }, locale: "vi", overrideAccess: true });
    // Trường upload chỉ cần một `media` tồn tại: chèn thẳng một dòng để khỏi ghi file ra đĩa.
    const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ('image/jpeg') RETURNING id`));
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
    revalidatedTags.length = 0;
  });

  describe("services", () => {
    it("sale tạo / sửa / xoá → 403; admin tạo được và slug sinh từ tiêu đề (PERMISSION §3.1)", async () => {
      expect(await statusOf(createService({ title: "Của sale" }, { as: sale }))).toBe(403);
      const doc = await createService({ title: "Môi giới" });
      expect(doc.slug).toBe("moi-gioi");
      expect(await statusOf(updateService(doc.id, { sortOrder: 5 }, { as: sale }))).toBe(403);
      expect(await statusOf(payload.delete({ collection: "services", id: doc.id, user: asUser(sale), overrideAccess: false, trash: true }))).toBe(403);
      expect(await statusOf(updateService(doc.id, { deletedAt: NOW() }, { as: sale }))).toBe(403);
    });

    it("không có author / isFeatured / publishedAt; có đủ trường ERD §4.9", () => {
      const names = payload.collections.services!.config.flattenedFields.map((field) => field.name);
      expect(names).not.toContain("author");
      expect(names).not.toContain("isFeatured");
      expect(names).toEqual(expect.arrayContaining(["title", "slug", "icon", "coverImage", "summary", "content", "sortOrder", "status", "seo"]));
    });

    it("title và summary bắt buộc ở bản vi", async () => {
      expect(await statusOf(createService({ title: "" }))).toBe(400);
      expect(await statusOf(createService({ title: "Thiếu mô tả", summary: "" }))).toBe(400);
    });

    it("coverImage bắt buộc khi published; sửa một phần không gửi coverImage vẫn giữ bản đã lưu", async () => {
      expect(await statusOf(createService({ title: "Xuất bản thiếu ảnh", status: "published" }))).toBe(400);
      const draft = await createService({ title: "Nháp không ảnh" });
      expect(await statusOf(updateService(draft.id, { status: "published" }))).toBe(400);

      const published = await createService({ title: "Có ảnh", status: "published", coverImage: mediaId });
      expect(published.status).toBe("published");
      // Sửa một phần (không gửi coverImage) khi đã xuất bản: vẫn hợp lệ.
      expect((await updateService(published.id, { sortOrder: 7 })).sortOrder).toBe(7);
      const hidden = await updateService(published.id, { status: "hidden" });
      expect((await updateService(hidden.id, { status: "published" })).status).toBe("published");
      // Gỡ ảnh khi đang xuất bản: bị chặn.
      expect(await statusOf(updateService(published.id, { coverImage: null }))).toBe(400);
      // Nháp được phép không có ảnh.
      expect((await updateService(draft.id, { sortOrder: 1 })).status).toBe("draft");
    });

    it("coverImage chỉ nhận ảnh: PDF bị validator upload mặc định chặn (helper ảnh bìa dùng chung gọi nó trước)", async () => {
      const pdf = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, ["application/pdf"]));
      expect(await statusOf(createService({ title: "Bìa PDF", coverImage: pdf.rows[0].id as string }))).toBe(400);
    });

    it("bật hasEnglish cần đủ title, slug, summary, content bản en", async () => {
      const doc = await createService({ title: "Song ngữ", content: lexical("Nội dung vi") });
      const enable = (data: Record<string, unknown>) =>
        payload.update({ collection: "services", id: doc.id, data: { hasEnglish: true, ...data } as never, locale: "en", overrideAccess: true, depth: 0 });
      expect(await statusOf(enable({ title: "Bilingual" }))).toBe(400);
      const ok = await enable({ title: "Bilingual", summary: "Short", content: lexical("English content") });
      expect(ok.hasEnglish).toBe(true);
      expect(ok.slug).toBe("bilingual");
    });

    it("Duplicate: slug mọi locale sinh lại, không phải dạng 'xyz - Copy' (services)", async () => {
      const doc = await createService({ title: "Phân phối", content: lexical("vi") });
      await payload.update({
        collection: "services",
        id: doc.id,
        data: { title: "Distribution", summary: "Sales", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      const copy = await payload.duplicate({ collection: "services", id: doc.id, user: asUser(admin), overrideAccess: false, depth: 0, locale: "vi" });
      const copies = await payload.findByID({ collection: "services", id: copy.id, locale: "all", overrideAccess: true, depth: 0 });
      const slugs = copies.slug as unknown as Record<Locale, string | null>;
      expect(slugs.vi).toBe("phan-phoi-2");
      expect(JSON.stringify(slugs)).not.toMatch(/copy/i);
      const original = await payload.findByID({ collection: "services", id: doc.id, locale: "all", overrideAccess: true, depth: 0 });
      expect((original.slug as unknown as Record<Locale, string>).vi).toBe("phan-phoi");
    });

    it("Duplicate: cũng áp cho developers (slugField dùng chung)", async () => {
      const dev = await payload.create({ collection: "developers", data: { name: "Vinhomes" }, locale: "vi", overrideAccess: true });
      const copy = await payload.duplicate({ collection: "developers", id: dev.id, overrideAccess: true, depth: 0, locale: "vi" });
      const stored = await payload.findByID({ collection: "developers", id: copy.id, locale: "all", overrideAccess: true, depth: 0 });
      const slugs = stored.slug as unknown as Record<Locale, string | null>;
      expect(slugs.vi).toBe("vinhomes-2");
      expect(JSON.stringify(slugs)).not.toMatch(/copy/i);
    });
  });

  describe("services: làm mới cache", () => {
    it("xuất bản làm mới /dich-vu/[slug] của cả vi và en; nháp thì không", async () => {
      const doc = await createService({ title: "Làm mới cache" });
      expect(revalidatedPaths).toEqual([]);
      await updateService(doc.id, { status: "published", coverImage: mediaId });
      expect(revalidatedPaths.flat()).toContain("/vi/dich-vu/lam-moi-cache");
    });
  });

  describe("pages", () => {
    beforeEach(clearPages);

    it("sale tạo / sửa / xoá → 403", async () => {
      expect(await statusOf(createPage({ kind: "privacy" }, { as: sale }))).toBe(403);
      const doc = await createPage({ kind: "privacy" });
      expect(await statusOf(updatePage(doc.id, { version: "2.0" }, { as: sale }))).toBe(403);
      expect(await statusOf(payload.delete({ collection: "pages", id: doc.id, user: asUser(sale), overrideAccess: false, trash: true }))).toBe(403);
    });

    it("không có slug / author; có kind, version, effectiveDate", () => {
      const names = payload.collections.pages!.config.flattenedFields.map((field) => field.name);
      expect(names).not.toContain("slug");
      expect(names).not.toContain("author");
      expect(names).toEqual(expect.arrayContaining(["kind", "title", "content", "version", "effectiveDate", "status", "hasEnglish", "translation", "seo"]));
    });

    it("tạo kind trùng → lỗi; kind ngoài {privacy, terms} → 400", async () => {
      await createPage({ kind: "privacy" });
      expect(await statusOf(createPage({ kind: "privacy", title: "Bản trùng" }))).toBe(400);
      expect(await statusOf(createPage({ kind: "about" }))).toBe(400);
      expect((await createPage({ kind: "terms" })).kind).toBe("terms");
    });

    it("kind trùng với bản đã xoá mềm vẫn bị chặn (UNIQUE giữ chỗ)", async () => {
      const doc = await createPage({ kind: "terms" });
      await updatePage(doc.id, { deletedAt: NOW() });
      expect(await statusOf(createPage({ kind: "terms" }))).toBe(400);
    });

    it("kind không đổi sau khi tạo, kể cả overrideAccess (seed/job)", async () => {
      const doc = await createPage({ kind: "privacy" });
      expect((await updatePage(doc.id, { kind: "terms", version: "1.1" })).kind).toBe("privacy");
      const system = await payload.update({ collection: "pages", id: doc.id, data: { kind: "terms" }, overrideAccess: true, depth: 0 });
      expect(system.kind).toBe("privacy");
    });

    it("version, effectiveDate, title bắt buộc ở bản vi", async () => {
      expect(await statusOf(createPage({ kind: "privacy", version: "" }))).toBe(400);
      expect(await statusOf(createPage({ kind: "privacy", effectiveDate: null }))).toBe(400);
      expect(await statusOf(createPage({ kind: "privacy", title: "" }))).toBe(400);
    });

    it("hasEnglish: không bật được lúc tạo; chỉ admin bật khi đủ title + content en; sale bị chặn", async () => {
      const created = await createPage({ kind: "privacy", hasEnglish: true });
      expect(created.hasEnglish).toBe(false);
      expect(await statusOf(updatePage(created.id, { hasEnglish: true, title: "Privacy", content: lexical("en") }, { as: sale, locale: "en" }))).toBe(403);
      // Thiếu nội dung en → hook chặn.
      expect(await statusOf(updatePage(created.id, { hasEnglish: true, title: "Privacy" }, { locale: "en" }))).toBe(400);
      const enabled = await updatePage(created.id, { hasEnglish: true, title: "Privacy", content: lexical("en") }, { locale: "en", approve: true });
      // Không có lệnh duyệt (form/REST) thì `hasEnglish` không bật được (hook guardEnglishApproval).
      const silent = await updatePage((await createPage({ kind: "terms" })).id, { hasEnglish: true, title: "Terms", content: lexical("en") }, { locale: "en" });
      expect(silent.hasEnglish).toBe(false);
      expect(enabled.hasEnglish).toBe(true);
    });

    it("hasEnglish: field access update chỉ admin; create và translation vẫn khoá (không ai sửa tay)", () => {
      const fields = payload.collections.pages!.config.flattenedFields;
      const hasEnglish = fields.find((field) => field.name === "hasEnglish")!;
      const translation = fields.find((field) => field.name === "translation")!;
      const argsFor = (role: string) => ({ req: { user: { active: true, role } } }) as never;
      expect(hasEnglish.access?.update?.(argsFor("admin"))).toBe(true);
      expect(hasEnglish.access?.update?.(argsFor("sale"))).toBe(false);
      expect(hasEnglish.access?.create?.(argsFor("admin"))).toBe(false);
      expect(translation.access?.update?.(argsFor("admin"))).toBe(false);
    });
  });

  describe("đồng bộ site-settings.privacyPolicyVersion (BR-30)", () => {
    beforeEach(clearPages);

    it("xuất bản privacy 1.1 → site-settings đổi theo, làm mới tag global và trang công khai", async () => {
      const doc = await createPage({ kind: "privacy", version: "1.0" });
      expect((await readSettings()).privacyPolicyVersion ?? null).not.toBe("1.0");
      revalidatedTags.length = 0;
      await updatePage(doc.id, { status: "published", version: "1.1" });
      expect((await readSettings()).privacyPolicyVersion).toBe("1.1");
      expect(revalidatedTags.flat()).toContain("global:site-settings");
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi/chinh-sach-bao-mat", "/en/chinh-sach-bao-mat"]));
    });

    it("tạo thẳng bản published; đổi version khi đang published → cập nhật theo", async () => {
      const doc = await createPage({ kind: "privacy", version: "2.0", status: "published" });
      expect((await readSettings()).privacyPolicyVersion).toBe("2.0");
      await updatePage(doc.id, { version: "2.1" });
      expect((await readSettings()).privacyPolicyVersion).toBe("2.1");
    });

    it("bản nháp và terms không đổi phiên bản; ghi bản en của privacy đã published vẫn đồng bộ được", async () => {
      await payload.updateGlobal({ slug: "site-settings", data: { privacyPolicyVersion: "9.0" }, locale: "vi", overrideAccess: true });
      const draft = await createPage({ kind: "privacy", version: "9.1" });
      await createPage({ kind: "terms", version: "9.2", status: "published" });
      expect((await readSettings()).privacyPolicyVersion).toBe("9.0");
      await updatePage(draft.id, { status: "published" });
      await updatePage(draft.id, { title: "Privacy Policy", content: lexical("en") }, { locale: "en" });
      expect((await readSettings()).privacyPolicyVersion).toBe("9.1");
    });

    it("gỡ xuất bản / ẩn / xoá mềm privacy giữ nguyên phiên bản đã công khai cuối", async () => {
      const doc = await createPage({ kind: "privacy", version: "3.0", status: "published" });
      await updatePage(doc.id, { status: "hidden" });
      expect((await readSettings()).privacyPolicyVersion).toBe("3.0");
      await updatePage(doc.id, { deletedAt: NOW() });
      expect((await readSettings()).privacyPolicyVersion).toBe("3.0");
    });

    it("privacyPolicyVersion vẫn không sửa tay được qua site-settings (denyAll)", async () => {
      await payload.updateGlobal({ slug: "site-settings", data: { privacyPolicyVersion: "hack" } as never, user: asUser(admin), overrideAccess: false });
      expect((await readSettings()).privacyPolicyVersion).not.toBe("hack");
    });
  });

  describe("truy vấn công khai (publicWhere)", () => {
    beforeEach(clearPages);

    it("pages: khách chỉ thấy bản published; en cần thêm hasEnglish", async () => {
      const privacy = await createPage({ kind: "privacy", status: "published" });
      await createPage({ kind: "terms" });
      const vi = await publicQueries.findPublicList<{ kind: string }>(payload, "pages", "vi");
      expect(vi.docs.map((doc) => doc.kind)).toEqual(["privacy"]);
      expect((await publicQueries.findPublicList(payload, "pages", "en")).docs).toHaveLength(0);
      await updatePage(privacy.id, { hasEnglish: true, title: "Privacy", content: lexical("en") }, { locale: "en", approve: true });
      const en = await publicQueries.findPublicList<{ title: string }>(payload, "pages", "en");
      expect(en.docs.map((doc) => doc.title)).toEqual(["Privacy"]);
    });

    it("findPublicOne theo kind (route cố định của trang pháp lý): nháp → null; EN chưa duyệt → null (404 EN), duyệt rồi → có", async () => {
      const byKind = (kind: string, locale: Locale) => publicQueries.findPublicOne<{ kind: string; title: string }>(payload, "pages", locale, { kind: { equals: kind } }, { depth: 0 });
      const privacy = await createPage({ kind: "privacy", title: "Chính sách" });
      expect(await byKind("privacy", "vi")).toBeNull();
      await updatePage(privacy.id, { status: "published" });
      expect(await byKind("privacy", "vi")).toMatchObject({ kind: "privacy", title: "Chính sách" });
      expect(await byKind("terms", "vi")).toBeNull();
      expect(await byKind("privacy", "en")).toBeNull();
      await updatePage(privacy.id, { hasEnglish: true, title: "Privacy", content: lexical("en") }, { locale: "en", approve: true });
      expect(await byKind("privacy", "en")).toMatchObject({ title: "Privacy" });
      await updatePage(privacy.id, { deletedAt: NOW() });
      expect(await byKind("privacy", "vi")).toBeNull();
      expect(await byKind("privacy", "en")).toBeNull();
    });

    it("services: draft/hidden/xoá mềm không lộ; en cần hasEnglish; tìm theo slug đúng locale", async () => {
      const live = await createService({ title: "Công khai Dịch vụ", status: "published", coverImage: mediaId });
      await createService({ title: "Nháp Dịch vụ" });
      const gone = await createService({ title: "Xoá Dịch vụ", status: "published", coverImage: mediaId });
      await updateService(gone.id, { deletedAt: NOW() });
      const titles = (await publicQueries.findPublicList<{ title: string }>(payload, "services", "vi")).docs.map((doc) => doc.title);
      expect(titles).toContain("Công khai Dịch vụ");
      expect(titles).not.toContain("Nháp Dịch vụ");
      expect(titles).not.toContain("Xoá Dịch vụ");
      expect(await publicQueries.findPublicBySlug(payload, "services", "en", "cong-khai-dich-vu")).toBeNull();
      await payload.update({
        collection: "services",
        id: live.id,
        data: { title: "Public Service", summary: "S", content: lexical("en"), hasEnglish: true } as never,
        locale: "en",
        overrideAccess: true,
      });
      expect(await publicQueries.findPublicBySlug(payload, "services", "en", "public-service")).not.toBeNull();
      expect(await publicQueries.findPublicBySlug(payload, "services", "vi", "cong-khai-dich-vu")).not.toBeNull();
    });
  });

  describe("seed", () => {
    beforeEach(clearPages);

    it("seedLegalPages chạy 2 lần: tạo privacy + terms nháp, lần sau bỏ qua và không ghi đè bản admin đã sửa", async () => {
      const before = (await readSettings()).privacyPolicyVersion ?? null;
      expect(await seedLegalPages(payload)).toEqual({ created: 2, skipped: 0 });
      const privacy = (await payload.find({ collection: "pages", where: { kind: { equals: "privacy" } }, overrideAccess: true, limit: 1 })).docs[0]!;
      expect(privacy.status).toBe("draft");
      await updatePage(privacy.id, { title: "Chính sách do admin sửa" });
      expect(await seedLegalPages(payload)).toEqual({ created: 0, skipped: 2 });
      const count = await payload.count({ collection: "pages", overrideAccess: true, trash: true });
      expect(count.totalDocs).toBe(2);
      const after = await payload.findByID({ collection: "pages", id: privacy.id, locale: "vi", overrideAccess: true });
      expect(after.title).toBe("Chính sách do admin sửa");
      expect((await readSettings()).privacyPolicyVersion ?? null).toBe(before); // nháp không đụng consentVersion
    });

    it("seedSampleServices chạy 2 lần không nhân đôi", async () => {
      const first = await seedSampleServices(payload);
      expect(first.created + first.skipped).toBe(3);
      expect(await seedSampleServices(payload)).toEqual({ created: 0, skipped: 3 });
    });
  });
});
