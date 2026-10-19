import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Field, Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { flattenLayoutFields } from "../../src/lib/admin/form-layout";

const baseUrl = process.env.DATABASE_URL_TEST;

/** Collection/global đã bọc field vào tab không tên / row (BL-015 T06). */
const LAYOUT_COLLECTIONS = ["projects", "rentals", "property-posts", "news", "job-postings", "services", "leads"] as const;
const LAYOUT_GLOBALS = ["homepage", "site-settings"] as const;

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

/** Mọi tab trong cây field phải KHÔNG có `name` (tab có tên = thêm một cấp dữ liệu = đổi đường dẫn = migration). */
function namedTabs(fields: readonly Field[]): string[] {
  return fields.flatMap((field): string[] => {
    if (field.type === "tabs") {
      return field.tabs.flatMap((tab) => ("name" in tab && tab.name ? [String(tab.name)] : namedTabs(tab.fields)));
    }
    return "fields" in field ? namedTabs(field.fields) : [];
  });
}

/** Kiểm trên DB tạm có migration THẬT (đã commit từ trước BL-015): nếu bố cục form đổi đường dẫn dữ liệu thì lưu/đọc dưới đây vỡ vì thiếu cột. */
describe.skipIf(!baseUrl)("integration: bố cục form admin không đổi dữ liệu (BL-015 T06)", () => {
  const dbName = `tami_formlayout_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let payload: Payload;
  let testUrl = "";
  let adminUser: { id: string };

  const columnsOf = async (table: string) => {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      const { rows } = await client.query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
      return rows.map((row) => row.column_name);
    } finally {
      await client.end();
    }
  };

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
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    adminUser = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `admin-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
  }, 180_000);

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

  it("không tab nào có `name`; field có tên vẫn ở cấp dữ liệu gốc (trải phẳng vỏ bố cục thấy đủ)", () => {
    for (const slug of LAYOUT_COLLECTIONS) {
      const fields = payload.collections[slug].config.fields;
      expect(namedTabs(fields), slug).toEqual([]);
      expect(flattenLayoutFields(fields).length, slug).toBeGreaterThan(5);
    }
    for (const slug of LAYOUT_GLOBALS) {
      const fields = payload.globals.config.find((global) => global.slug === slug)!.fields;
      expect(namedTabs(fields), slug).toEqual([]);
    }
  });

  it("cột DB giữ đường dẫn cũ (không tiền tố theo tab)", async () => {
    const projects = await columnsOf("projects");
    expect(projects).toEqual(expect.arrayContaining(["price_from_vnd", "area_to_m2", "scale_total_units", "scale_floors", "sales_status", "province_id"]));
    expect(await columnsOf("projects_locales")).toEqual(expect.arrayContaining(["seo_meta_title", "seo_noindex", "title", "summary", "slug"]));
    expect(await columnsOf("leads")).toEqual(expect.arrayContaining(["utm_source", "utm_campaign", "full_name", "phone_normalized", "assigned_to_id", "status", "lost_reason"]));
    expect(await columnsOf("site_settings")).toEqual(expect.arrayContaining(["hotline", "zalo_url", "ga_measurement_id", "translation_enabled", "translation_status"]));
    expect(await columnsOf("homepage")).toEqual(expect.arrayContaining(["cta_banner_enabled", "about_enabled", "translation_status"]));
    expect(await columnsOf("rentals")).toEqual(expect.arrayContaining(["rental_terms_min_lease_months", "area_m2", "code"]));
  });

  it("projects: tạo → đọc lại giữ nguyên shape (group scale/seo, array amenities, field trong row)", async () => {
    const province = await payload.create({ collection: "provinces", data: { code: "01", name: "Hà Nội", slug: `ha-noi-${runId}` }, overrideAccess: true });
    const category = await payload.create({ collection: "categories", data: { name: "Căn hộ", scope: "project" } as never, locale: "vi", overrideAccess: true });
    const created = await payload.create({
      collection: "projects",
      locale: "vi",
      overrideAccess: true,
      depth: 0,
      data: {
        title: "Dự án bố cục",
        category: category.id,
        province: province.id,
        salesStatus: "selling",
        priceFromVnd: 1_000_000_000,
        priceToVnd: 2_000_000_000,
        areaFromM2: 40,
        areaToM2: 90,
        scale: { totalUnits: 120, floors: 25 },
        summary: "Mô tả ngắn",
        overview: lexical("Tổng quan"),
        amenities: [{ name: "Hồ bơi" }],
        seo: { metaTitle: "SEO title", noindex: true },
        author: adminUser.id,
      } as never,
    });
    const read = await payload.findByID({ collection: "projects", id: created.id, locale: "vi", depth: 0, overrideAccess: true });
    expect(read).toMatchObject({
      salesStatus: "selling",
      priceFromVnd: 1_000_000_000,
      priceToVnd: 2_000_000_000,
      areaFromM2: 40,
      areaToM2: 90,
      scale: { totalUnits: 120, floors: 25 },
      seo: { metaTitle: "SEO title", noindex: true },
      amenities: [{ name: "Hồ bơi" }],
      title: "Dự án bố cục",
      status: "draft",
    });
    expect(read.translation?.status).toBe("none");
    expect(Object.keys(read)).not.toEqual(expect.arrayContaining(["tabs", "content", "info"]));
  });

  it("leads: lưu/đọc giữ path (customer, utm, status + lostReason); validate lostReason vẫn chạy", async () => {
    const lead = await payload.create({
      collection: "leads",
      overrideAccess: true,
      depth: 0,
      data: {
        fullName: "Khách bố cục",
        phone: "0912345678",
        email: "khach@example.test",
        message: "Cần tư vấn",
        locale: "vi",
        source: "contact",
        consentAt: new Date().toISOString(),
        consentVersion: "v1",
        utm: { source: "fb", campaign: "thu" },
        pageUrl: "https://example.test/lien-he",
      } as never,
    });
    await expect(payload.update({ collection: "leads", id: lead.id, overrideAccess: true, data: { status: "lost" } as never })).rejects.toThrow();
    const updated = await payload.update({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0, data: { status: "lost", lostReason: "Giá cao" } as never });
    expect(updated).toMatchObject({
      fullName: "Khách bố cục",
      phoneNormalized: "+84912345678",
      email: "khach@example.test",
      source: "contact",
      status: "lost",
      lostReason: "Giá cao",
      utm: { source: "fb", campaign: "thu" },
      pageUrl: "https://example.test/lien-he",
    });
  });

  it("site-settings + homepage: lưu/đọc giữ path; validate dùng siblingData (ctaBanner.enabled + title) vẫn chạy", async () => {
    await payload.updateGlobal({
      slug: "site-settings",
      locale: "vi",
      overrideAccess: true,
      data: {
        siteName: "TAMI",
        hotline: "0900000000",
        zaloUrl: "https://zalo.me/tami",
        socialLinks: [{ platform: "facebook", url: "https://facebook.com/tami" }],
        notificationEmails: [{ email: "noi-bo@example.test" }],
        translationEnabled: false,
        translationGlossary: [{ vi: "Căn hộ", en: "Apartment" }],
        gaMeasurementId: "G-ABCD1234",
      } as never,
    });
    const settings = await payload.findGlobal({ slug: "site-settings", locale: "vi", overrideAccess: true, depth: 0 });
    expect(settings).toMatchObject({
      siteName: "TAMI",
      hotline: "0900000000",
      zaloUrl: "https://zalo.me/tami",
      socialLinks: [{ platform: "facebook", url: "https://facebook.com/tami" }],
      notificationEmails: [{ email: "noi-bo@example.test" }],
      translationEnabled: false,
      translationGlossary: [{ vi: "Căn hộ", en: "Apartment" }],
      gaMeasurementId: "G-ABCD1234",
    });
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    const mediaId = (await client.query(`INSERT INTO "media" (mime_type) VALUES ('image/jpeg') RETURNING id`)).rows[0].id as string;
    await client.end();
    const hero = { slides: [{ image: mediaId, title: "Chào mừng" }] };
    // ctaBanner bật mà thiếu tiêu đề vi → validator đọc `siblingData.enabled` phải còn chạy.
    await expect(payload.updateGlobal({ slug: "homepage", locale: "vi", overrideAccess: true, data: { hero, ctaBanner: { enabled: true } } as never })).rejects.toThrow();
    await payload.updateGlobal({
      slug: "homepage",
      locale: "vi",
      overrideAccess: true,
      data: { hero, ctaBanner: { enabled: true, title: "Nhận tư vấn ngay" }, about: { enabled: true, title: "Về TAMI" }, seo: { metaTitle: "Trang chủ" } } as never,
    });
    const homepage = await payload.findGlobal({ slug: "homepage", locale: "vi", overrideAccess: true, depth: 0 });
    expect(homepage).toMatchObject({ ctaBanner: { enabled: true, title: "Nhận tư vấn ngay" }, about: { enabled: true, title: "Về TAMI" }, seo: { metaTitle: "Trang chủ" } });
  });
});
