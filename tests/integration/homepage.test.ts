import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;
const MB = 1024 * 1024;

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

describe.skipIf(!baseUrl)("integration: global homepage (DB tạm)", () => {
  const dbName = `tami_homepage_${Date.now().toString(36)}`;
  const password = "Mat-khau-hop-le-123";
  const revalidatedTags: string[][] = [];
  const revalidatedPaths: string[][] = [];
  let payload: Payload;
  let testUrl: string;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let imageId = "";
  let otherImageId = "";
  let pdfId = "";

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${dbName}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  // Trường upload chỉ cần dòng `media` tồn tại: chèn thẳng (mime + dung lượng) để khỏi ghi file ra đĩa.
  async function insertMedia(mimeType: string, filesizeBytes?: number): Promise<string> {
    const inserted = await withDatabase((client) =>
      client.query(`INSERT INTO "media" (mime_type, filesize) VALUES ($1, $2) RETURNING id`, [mimeType, filesizeBytes ?? null]),
    );
    return inserted.rows[0].id as string;
  }

  const slides = (count: number, extra: Record<string, unknown> = {}) =>
    Array.from({ length: count }, () => ({ image: imageId, ...extra }));

  const updateHomepage = (data: Record<string, unknown>, as = admin, locale: "vi" | "en" = "vi") =>
    payload.updateGlobal({ slug: "homepage", data: data as never, locale, user: asUser(as), overrideAccess: false, depth: 0 });

  const createService = (data: Record<string, unknown>) =>
    payload.create({
      collection: "services",
      data: { title: "Phân phối", summary: "Mô tả", coverImage: imageId, ...data } as never,
      locale: "vi",
      user: asUser(admin),
      overrideAccess: false,
      depth: 0,
    });

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
    await withDatabase((client) => client.query(`CREATE EXTENSION IF NOT EXISTS postgis`));
    const { getPayload } = await import("payload");
    const { buildHomepageTestConfig } = await import("../fixtures/homepage/payload-config");
    payload = await getPayload({
      config: buildHomepageTestConfig(testUrl, {
        tags: (tags) => void revalidatedTags.push(tags),
        paths: (paths) => void revalidatedPaths.push(paths),
      }),
    });
    await withDatabase((client) => client.query(`CREATE SEQUENCE IF NOT EXISTS rentals_code_seq START 1`));
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    imageId = await insertMedia("image/jpeg");
    otherImageId = await insertMedia("image/png");
    pdfId = await insertMedia("application/pdf");
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
    revalidatedTags.length = 0;
    revalidatedPaths.length = 0;
  });

  // Chạy đầu tiên: cần global còn trống (các test sau ghi slide).
  describe("seed trang chủ mẫu", () => {
    it("tạo trang chủ hợp lệ cả vi và en, idempotent, không ghi đè sửa của admin", async () => {
      const { seedSampleHomepage } = await import("../../seed/sample/homepage");
      expect(await seedSampleHomepage(payload)).toEqual({ created: true });
      const vi = await payload.findGlobal({ slug: "homepage", locale: "vi", fallbackLocale: false, depth: 0, overrideAccess: true });
      const en = await payload.findGlobal({ slug: "homepage", locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true });
      expect(vi.hero?.slides).toHaveLength(3);
      expect(en.hero?.slides?.map((slide) => slide.id)).toEqual(vi.hero?.slides?.map((slide) => slide.id));
      expect(vi.hero?.slides?.[0]?.title).toBe("Bất động sản chọn lọc");
      expect(en.hero?.slides?.[0]?.title).toBe("Curated real estate");
      expect(vi.ctaBanner?.title).toBe("Cần tư vấn bất động sản?");
      expect(en.ctaBanner?.title).toBe("Need real estate advice?");
      expect(vi.about?.stats).toHaveLength(2);
      expect(await seedSampleHomepage(payload)).toEqual({ created: false });
    });
  });

  describe("hero: 1–8 slide", () => {
    it("0 slide → 400; 9 slide → 400; 1 và 8 slide lưu được", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: [] } }))).toBe(400);
      expect(await statusOf(updateHomepage({ hero: { slides: slides(9) } }))).toBe(400);
      expect((await updateHomepage({ hero: { slides: slides(1) } })).hero?.slides).toHaveLength(1);
      expect((await updateHomepage({ hero: { slides: slides(8) } })).hero?.slides).toHaveLength(8);
    });

    it("slide thiếu ảnh → 400", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: [{ title: "Không ảnh" }] } }))).toBe(400);
    });

    it("link CTA không hợp lệ → 400 (khoá trang hoặc URL http(s))", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: slides(1, { ctaLink: "javascript:alert(1)" }) } }))).toBe(400);
      expect((await updateHomepage({ hero: { slides: slides(1, { ctaLink: "projects" }) } })).hero?.slides?.[0]?.ctaLink).toBe("projects");
    });
  });

  describe("hero: video tuỳ chọn MP4/WebM ≤ 15MB", () => {
    it("MP4 5MB và WebM đúng 15MB lưu được", async () => {
      const mp4 = await insertMedia("video/mp4", 5 * MB);
      const webm = await insertMedia("video/webm", 15 * MB);
      const saved = await updateHomepage({ hero: { slides: [{ image: imageId, video: mp4 }, { image: imageId, video: webm }] } });
      expect(saved.hero?.slides?.map((slide) => slide.video)).toEqual([mp4, webm]);
    });

    it("video 20MB → 400", async () => {
      const big = await insertMedia("video/mp4", 20 * MB);
      expect(await statusOf(updateHomepage({ hero: { slides: [{ image: imageId, video: big }] } }))).toBe(400);
    });

    it("video thực chất là ảnh hoặc PDF → 400", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: [{ image: imageId, video: otherImageId }] } }))).toBe(400);
      expect(await statusOf(updateHomepage({ hero: { slides: [{ image: imageId, video: pdfId }] } }))).toBe(400);
    });

    it("ảnh slide là PDF → 400; id không tồn tại → 400 thay vì 500", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: [{ image: pdfId }] } }))).toBe(400);
      expect(
        await statusOf(updateHomepage({ hero: { slides: [{ image: imageId, video: "00000000-0000-4000-8000-000000000000" }] } })),
      ).toBe(400);
    });
  });

  describe("khối và thứ tự", () => {
    it("ctaBanner bật mà thiếu title (vi) → 400; tắt thì không cần; bản en chưa có title vẫn lưu được", async () => {
      await updateHomepage({ ctaBanner: { enabled: false, title: "" } });
      expect(await statusOf(updateHomepage({ ctaBanner: { enabled: true } }))).toBe(400);
      expect(await statusOf(updateHomepage({ ctaBanner: { enabled: true, title: "   " } }))).toBe(400);
      await updateHomepage({ ctaBanner: { enabled: false } });
      await updateHomepage({ ctaBanner: { enabled: true, title: "Nhận tư vấn ngay", ctaLink: "contact" } });
      const enSaved = await updateHomepage({ ctaBanner: { enabled: true } }, admin, "en");
      expect(enSaved.ctaBanner?.enabled).toBe(true);
    });

    it("bật ctaBanner từ bản en khi title vi rỗng → 400; có title vi thì bật được", async () => {
      await updateHomepage({ ctaBanner: { enabled: false, title: "" } });
      expect(await statusOf(updateHomepage({ ctaBanner: { enabled: true, title: "Get advice" } }, admin, "en"))).toBe(400);
      await updateHomepage({ ctaBanner: { enabled: false, title: "Nhận tư vấn ngay" } });
      const enSaved = await updateHomepage({ ctaBanner: { enabled: true, title: "Get advice" } }, admin, "en");
      expect(enSaved.ctaBanner?.enabled).toBe(true);
    });

    it("featuredProjects tối đa 6 dự án", async () => {
      const ids = (count: number) => Array.from({ length: count }, () => "00000000-0000-4000-8000-000000000000");
      expect(await statusOf(updateHomepage({ featuredProjects: { projects: ids(7) } }))).toBe(400);
    });

    it("blockOrder gồm ctaBanner, mặc định đủ 6 khối; trùng khối → 400", async () => {
      const saved = await updateHomepage({ blockOrder: [{ block: "ctaBanner" }, { block: "about" }] });
      expect(saved.blockOrder?.map((row) => row.block)).toEqual(["ctaBanner", "about"]);
      expect(await statusOf(updateHomepage({ blockOrder: [{ block: "about" }, { block: "about" }] }))).toBe(400);
      expect(await statusOf(updateHomepage({ blockOrder: [{ block: "shortcuts" }] }))).toBe(400);
    });

    it("không có dải lối tắt; có nhóm translation và seo", async () => {
      const doc = (await payload.findGlobal({ slug: "homepage", locale: "vi", depth: 0, overrideAccess: true })) as unknown as Record<string, unknown>;
      expect(doc).not.toHaveProperty("shortcuts");
      expect(doc).toHaveProperty("translation");
      expect(doc).toHaveProperty("seo");
    });

    it("chữ localized: vi và en lưu riêng, quan hệ/ảnh dùng chung", async () => {
      const vi = await updateHomepage({ hero: { slides: slides(1, { title: "Chào mừng" }) } });
      const rowId = vi.hero?.slides?.[0]?.id;
      await updateHomepage({ hero: { slides: [{ id: rowId, image: imageId, title: "Welcome" }] } }, admin, "en");
      const viDoc = await payload.findGlobal({ slug: "homepage", locale: "vi", depth: 0, overrideAccess: true });
      const enDoc = await payload.findGlobal({ slug: "homepage", locale: "en", depth: 0, overrideAccess: true });
      expect(viDoc.hero?.slides?.[0]?.title).toBe("Chào mừng");
      expect(enDoc.hero?.slides?.[0]?.title).toBe("Welcome");
      expect(enDoc.hero?.slides?.[0]?.image).toBe(imageId);
    });
  });

  describe("xoá media đang dùng", () => {
    it("media là ảnh slide → 409 và slide còn nguyên; media không dùng xoá được", async () => {
      const inUse = await insertMedia("image/jpeg");
      await updateHomepage({ hero: { slides: [{ image: inUse }] } });
      const deleteInUse = payload.delete({ collection: "media", id: inUse, user: asUser(admin), overrideAccess: false });
      expect(await statusOf(deleteInUse)).toBe(409);
      const saved = await payload.findGlobal({ slug: "homepage", locale: "vi", depth: 0 });
      expect(saved.hero?.slides?.[0]?.image).toBe(inUse);

      await updateHomepage({ hero: { slides: slides(1) } });
      const unused = await insertMedia("image/jpeg");
      expect(await statusOf(payload.delete({ collection: "media", id: unused, user: asUser(admin), overrideAccess: false }))).toBeUndefined();
      expect(await statusOf(payload.delete({ collection: "media", id: inUse, user: asUser(admin), overrideAccess: false }))).toBeUndefined();
    });
  });

  describe("xoá media đang dùng: mọi nơi dùng + bulk + request en", () => {
    const deleteMedia = (id: string, locale: "vi" | "en" = "vi") =>
      payload.delete({ collection: "media", id, locale, user: asUser(admin), overrideAccess: false });

    it("video slide, ảnh Về TAMI, nền CTA đều bị chặn 409; ảnh OG xoá được", async () => {
      const video = await insertMedia("video/mp4", MB);
      const about = await insertMedia("image/jpeg");
      const cta = await insertMedia("image/jpeg");
      const og = await insertMedia("image/jpeg");
      await updateHomepage({
        hero: { slides: [{ image: imageId, video }] },
        about: { image: about },
        ctaBanner: { enabled: false, backgroundImage: cta },
        seo: { ogImage: og },
      });
      for (const id of [video, about, cta]) expect(await statusOf(deleteMedia(id))).toBe(409);
      // Request en xoá media đang dùng: vẫn 409 (guard luôn đọc bản vi, không đổi locale của request).
      expect(await statusOf(deleteMedia(about, "en"))).toBe(409);
      expect(await statusOf(deleteMedia(og))).toBeUndefined();
      await updateHomepage({ hero: { slides: slides(1) }, about: { image: null }, ctaBanner: { enabled: false, backgroundImage: null } });
    });

    it("xoá hàng loạt: media đang dùng nằm trong errors và còn nguyên, media không dùng bị xoá", async () => {
      const used = await insertMedia("image/jpeg");
      const unused = await insertMedia("image/jpeg");
      await updateHomepage({ hero: { slides: [{ image: used }] } });
      const result = await payload.delete({
        collection: "media",
        where: { id: { in: [used, unused] } },
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(result.errors.map((error) => String(error.id))).toEqual([String(used)]);
      expect(result.docs.map((doc) => String(doc.id))).toEqual([String(unused)]);
      await updateHomepage({ hero: { slides: slides(1) } });
      expect(await statusOf(deleteMedia(used))).toBeUndefined();
    });
  });

  describe("quyền", () => {
    it("sale ghi → 403; khách đọc được", async () => {
      expect(await statusOf(updateHomepage({ hero: { slides: slides(1) } }, sale))).toBe(403);
      const asGuest = await payload.findGlobal({ slug: "homepage", locale: "vi", depth: 0, overrideAccess: false });
      expect(asGuest.hero?.slides?.length).toBeGreaterThan(0);
    });
  });

  describe("revalidate", () => {
    it("lưu homepage → làm mới tag global:homepage và /vi, /en", async () => {
      await updateHomepage({ hero: { slides: slides(1) } });
      expect(revalidatedTags.flat()).toContain("global:homepage");
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi", "/en"]));
    });

    it("lưu dịch vụ đã xuất bản → làm mới trang chủ vi/en; lưu nháp thì không", async () => {
      const draft = await createService({ title: "Nháp", status: "draft" });
      expect(revalidatedTags.flat()).not.toContain("global:homepage");
      expect(revalidatedPaths.flat()).not.toContain("/vi");

      const published = await createService({ title: "Môi giới", status: "published" });
      expect(revalidatedTags.flat()).toContain("global:homepage");
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi", "/en"]));

      // Ẩn một dịch vụ đang công khai cũng phải làm mới (thẻ biến mất khỏi trang chủ).
      revalidatedTags.length = 0;
      revalidatedPaths.length = 0;
      await payload.update({ collection: "services", id: published.id, data: { status: "draft" }, user: asUser(admin), overrideAccess: false, depth: 0 });
      expect(revalidatedTags.flat()).toContain("global:homepage");
      expect(draft.status).toBe("draft");
    });

    it("xoá hẳn dịch vụ đang công khai → làm mới trang chủ; xoá dịch vụ nháp thì không", async () => {
      const published = await createService({ title: "Cho thuê", status: "published" });
      const draft = await createService({ title: "Nháp xoá", status: "draft" });
      revalidatedTags.length = 0;
      revalidatedPaths.length = 0;
      await payload.delete({ collection: "services", id: draft.id, user: asUser(admin), overrideAccess: false });
      expect(revalidatedTags.flat()).not.toContain("global:homepage");

      await payload.delete({ collection: "services", id: published.id, user: asUser(admin), overrideAccess: false });
      expect(revalidatedTags.flat()).toContain("global:homepage");
      expect(revalidatedPaths.flat()).toEqual(expect.arrayContaining(["/vi", "/en"]));
    });
  });
});
