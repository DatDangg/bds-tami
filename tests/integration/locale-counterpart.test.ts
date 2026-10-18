import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ROLES } from "../../src/access/roles";

const baseUrl = process.env.DATABASE_URL_TEST;

// `resolveCounterpartPath` tự gọi `getPayload({ config })` với `@payload-config`: trả về chính instance của test (DB tạm).
const holder = vi.hoisted(() => ({ payload: undefined as unknown, marker: { __localeCounterpartTest: true } }));
vi.mock("@payload-config", () => ({ default: holder.marker }));
vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return { ...actual, getPayload: (args: { config: unknown }) => (args.config === holder.marker ? Promise.resolve(holder.payload) : actual.getPayload(args as never)) };
});

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

describe.skipIf(!baseUrl)("integration: chuyển ngôn ngữ sang trang tương ứng (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_locale_cp_${runId}`;
  let payload: Payload;
  let testUrl: string;
  let resolve: typeof import("../../src/lib/i18n/resolve-counterpart").resolveCounterpartPath;
  let saleId = "";
  let provinceId = "";
  let wardId = "";
  let rentalCategoryId = "";
  const imageIds: string[] = [];

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  const createRental = (data: Record<string, unknown>) =>
    payload.create({
      collection: "rentals",
      data: {
        description: lexical("Mô tả"),
        category: rentalCategoryId,
        province: provinceId,
        ward: wardId,
        address: "12 Đường Test",
        priceMonthlyVnd: 10_000_000,
        areaM2: 40,
        author: saleId,
        status: "published",
        gallery: imageIds,
        ...data,
      } as never,
      locale: "vi",
      overrideAccess: true,
      depth: 0,
    });

  const addEnglish = (collection: "rentals" | "categories" | "pages", id: string, data: Record<string, unknown>) =>
    payload.update({ collection, id, data: data as never, locale: "en", overrideAccess: true, depth: 0 });

  const createRentalCategory = (name: string) =>
    payload.create({ collection: "categories", data: { name, scope: "rental" } as never, locale: "vi", overrideAccess: true, depth: 0 });

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
    const { buildLocaleCounterpartTestConfig } = await import("../fixtures/locale-counterpart/payload-config");
    payload = await getPayload({ config: buildLocaleCounterpartTestConfig(testUrl) });
    holder.payload = payload;
    await withDatabase((client) => client.query(`CREATE SEQUENCE IF NOT EXISTS rentals_code_seq START 1`));
    resolve = (await import("../../src/lib/i18n/resolve-counterpart")).resolveCounterpartPath;

    await payload.updateGlobal({ slug: "site-settings", data: { siteName: "TAMI" }, locale: "vi", overrideAccess: true });
    saleId = (
      await payload.create({
        collection: "staff",
        overrideAccess: true,
        data: { email: `sale-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Sale", phone: "0901 111 222", role: ROLES.sale, active: true },
      })
    ).id;
    rentalCategoryId = (await createRentalCategory("Căn hộ")).id;
    provinceId = (await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })).id;
    wardId = (
      await payload.create({ collection: "wards", data: { province: provinceId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon" }, overrideAccess: true })
    ).id;
    // Xuất bản cần >= 3 ảnh: chỉ cần dòng `media` tồn tại.
    for (let index = 0; index < 3; index += 1) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, ["image/jpeg"]));
      imageIds.push(inserted.rows[0].id as string);
    }
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

  describe("tin cho thuê", () => {
    it("có bản EN (slug mỗi ngôn ngữ khác nhau): chuyển đúng hai chiều", async () => {
      const rental = await createRental({ title: "Căn hộ hai chiều", slug: "can-ho-hai-chieu" });
      await addEnglish("rentals", rental.id, { title: "Two-way apartment", slug: "two-way-apartment", description: lexical("en"), hasEnglish: true });
      await expect(resolve("/cho-thue/can-ho-hai-chieu", "en")).resolves.toBe("/en/for-rent/two-way-apartment");
      await expect(resolve("/en/for-rent/two-way-apartment", "vi")).resolves.toBe("/cho-thue/can-ho-hai-chieu");
    });

    it("chưa có bản EN → danh sách EN; đang xem EN của tin lạ → danh sách VI", async () => {
      await createRental({ title: "Chỉ tiếng Việt", slug: "chi-tieng-viet" });
      await expect(resolve("/cho-thue/chi-tieng-viet", "en")).resolves.toBe("/en/for-rent");
      await expect(resolve("/en/for-rent/khong-ton-tai", "vi")).resolves.toBe("/cho-thue");
    });

    it("hasEnglish tắt dù đã có slug EN → danh sách EN (không trỏ tới trang EN 404)", async () => {
      const rental = await createRental({ title: "Tạm gỡ EN", slug: "tam-go-en" });
      await addEnglish("rentals", rental.id, { title: "Temporarily off", slug: "temporarily-off", description: lexical("en"), hasEnglish: true });
      await expect(resolve("/cho-thue/tam-go-en", "en")).resolves.toBe("/en/for-rent/temporarily-off");
      await addEnglish("rentals", rental.id, { hasEnglish: false });
      await expect(resolve("/cho-thue/tam-go-en", "en")).resolves.toBe("/en/for-rent");
      await expect(resolve("/en/for-rent/temporarily-off", "vi")).resolves.toBe("/cho-thue");
    });

    it("bản nháp hoặc đã xoá mềm không lộ slug → danh sách", async () => {
      await createRental({ title: "Bản nháp", slug: "ban-nhap", status: "draft" });
      await expect(resolve("/cho-thue/ban-nhap", "en")).resolves.toBe("/en/for-rent");
      const removed = await createRental({ title: "Sẽ xoá", slug: "se-xoa" });
      await addEnglish("rentals", removed.id, { title: "To delete", slug: "to-delete", description: lexical("en"), hasEnglish: true });
      await expect(resolve("/cho-thue/se-xoa", "en")).resolves.toBe("/en/for-rent/to-delete");
      await payload.delete({ collection: "rentals", id: removed.id, overrideAccess: true, trash: true });
      await expect(resolve("/cho-thue/se-xoa", "en")).resolves.toBe("/en/for-rent");
      await expect(resolve("/en/for-rent/to-delete", "vi")).resolves.toBe("/cho-thue");
    });
  });

  describe("danh mục", () => {
    it("slug EN riêng theo scope: /cho-thue/danh-muc/<vi> và /en/for-rent/category/<en>", async () => {
      const category = await createRentalCategory("Nhà phố");
      await addEnglish("categories", category.id, { name: "Townhouse", slug: "townhouse", hasEnglish: true });
      const viSlug = (await payload.findByID({ collection: "categories", id: category.id, locale: "vi", depth: 0 })).slug as string;
      expect(viSlug).not.toBe("townhouse");
      await expect(resolve(`/cho-thue/danh-muc/${viSlug}`, "en")).resolves.toBe("/en/for-rent/category/townhouse");
      await expect(resolve("/en/for-rent/category/townhouse", "vi")).resolves.toBe(`/cho-thue/danh-muc/${viSlug}`);
      // Cùng slug nhưng sai scope (tin tức) không khớp danh mục cho thuê.
      await expect(resolve(`/tin-tuc/danh-muc/${viSlug}`, "en")).resolves.toBe("/en/news");
    });

    it("danh mục chưa có bản EN → danh sách EN", async () => {
      const category = await createRentalCategory("Văn phòng");
      const viSlug = (await payload.findByID({ collection: "categories", id: category.id, locale: "vi", depth: 0 })).slug as string;
      await expect(resolve(`/cho-thue/danh-muc/${viSlug}`, "en")).resolves.toBe("/en/for-rent");
    });
  });

  describe("trang pháp lý", () => {
    const createPage = (kind: "privacy" | "terms") =>
      payload.create({
        collection: "pages",
        data: {
          kind,
          title: kind === "privacy" ? "Chính sách bảo mật" : "Điều khoản sử dụng",
          content: lexical("Nội dung"),
          version: "1.0",
          effectiveDate: new Date().toISOString(),
          status: "published",
        } as never,
        locale: "vi",
        overrideAccess: true,
        depth: 0,
      });

    it("chưa có trang hoặc chưa hasEnglish → trang chủ EN; bật hasEnglish → trang EN; hạ hasEnglish → lại về trang chủ EN", async () => {
      await expect(resolve("/chinh-sach-bao-mat", "en")).resolves.toBe("/en");
      const page = await createPage("privacy");
      await expect(resolve("/chinh-sach-bao-mat", "en")).resolves.toBe("/en");
      await addEnglish("pages", page.id, { title: "Privacy Policy", content: lexical("Content"), hasEnglish: true });
      await expect(resolve("/chinh-sach-bao-mat", "en")).resolves.toBe("/en/privacy-policy");
      await expect(resolve("/en/privacy-policy", "vi")).resolves.toBe("/chinh-sach-bao-mat");
      // Admin hạ hasEnglish (bản dịch chờ duyệt lại): nút không được dẫn tới trang EN 404.
      await addEnglish("pages", page.id, { hasEnglish: false });
      await expect(resolve("/chinh-sach-bao-mat", "en")).resolves.toBe("/en");
    });

    it("điều khoản độc lập với chính sách: chưa có EN thì về trang chủ EN", async () => {
      await createPage("terms");
      await expect(resolve("/dieu-khoan-su-dung", "en")).resolves.toBe("/en");
    });
  });
});
