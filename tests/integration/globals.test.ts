import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import { readPublicGlobal } from "../../src/lib/content/read-global";

const baseUrl = process.env.DATABASE_URL_TEST;

const SECRET_FIELDS = ["notificationEmails", "translationGlossary", "translationEnabled"] as const;

/** Lỗi của Payload mang `status` (Forbidden 403, ValidationError 400). */
async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return (error as { status?: number }).status;
  }
  return undefined;
}

describe.skipIf(!baseUrl)("integration: globals site-settings / header / footer (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_globals_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const revalidated: string[][] = [];
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let adminToken = "";

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale") {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
  }

  const updateSettings = (data: Record<string, unknown>, as: typeof admin, locale: "vi" | "en" = "vi") =>
    payload.updateGlobal({ slug: "site-settings", data: data as never, locale, user: asUser(as), overrideAccess: false });

  const restGet = (path: string, token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api${path}`, {
        method: "GET",
        headers: token ? { Authorization: `JWT ${token}` } : {},
      }),
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
    process.env.DATABASE_URL = url.toString();
    const { getPayload } = await import("payload");
    const { buildGlobalsTestConfig } = await import("../fixtures/globals/payload-config");
    payload = await getPayload({
      config: buildGlobalsTestConfig(url.toString(), (tags) => {
        revalidated.push(tags);
      }),
    });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    const login = await payload.login({ collection: "staff", data: { email: admin.email, password } });
    adminToken = login.token ?? "";
    await updateSettings(
      {
        siteName: "TAMI HOMES",
        hotline: "0900000000",
        notificationEmails: [{ email: "bi-mat@example.test" }],
        translationGlossary: [{ vi: "căn hộ dịch vụ", en: "serviced apartment" }],
        translationEnabled: true,
      },
      admin,
    );
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

  describe("đọc theo trường (PERMISSION §3.2)", () => {
    it("khách GET /api/globals/site-settings: có phần công khai, KHÔNG có trường nội bộ", async () => {
      const response = await restGet("/globals/site-settings?locale=vi");
      expect(response.status).toBe(200);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.siteName).toBe("TAMI HOMES");
      expect(body.hotline).toBe("0900000000");
      for (const field of SECRET_FIELDS) expect(body).not.toHaveProperty(field);
      expect(JSON.stringify(body)).not.toContain("bi-mat@example.test");
      expect(JSON.stringify(body)).not.toContain("serviced apartment");
    });

    it("admin GET: thấy đủ trường nội bộ", async () => {
      const response = await restGet("/globals/site-settings?locale=vi", adminToken);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body.notificationEmails).toHaveLength(1);
      expect(body.translationGlossary).toHaveLength(1);
      expect(body.translationEnabled).toBe(true);
    });

    it("sale đọc được phần công khai, không thấy trường nội bộ", async () => {
      const doc = await payload.findGlobal({ slug: "site-settings", user: asUser(sale), overrideAccess: false });
      expect(doc.siteName).toBe("TAMI HOMES");
      for (const field of SECRET_FIELDS) expect(doc).not.toHaveProperty(field);
    });

    it("`readPublicGlobal` (nguồn của get-globals) đọc như khách: không lộ trường nội bộ ở cả vi lẫn en", async () => {
      for (const locale of ["vi", "en"] as const) {
        const doc = await readPublicGlobal(payload, "site-settings", locale);
        for (const field of SECRET_FIELDS) expect(doc).not.toHaveProperty(field);
      }
    });

    it("đọc hệ thống (overrideAccess, không user) vẫn thấy trường nội bộ cho job dịch/email", async () => {
      const doc = await payload.findGlobal({ slug: "site-settings", overrideAccess: true });
      expect(doc.notificationEmails).toHaveLength(1);
      expect(doc.translationGlossary).toHaveLength(1);
      expect(doc.translationEnabled).toBe(true);
    });

    it("header và footer: khách đọc được", async () => {
      expect((await restGet("/globals/header")).status).toBe(200);
      expect((await restGet("/globals/footer")).status).toBe(200);
    });
  });

  describe("ghi: chỉ admin", () => {
    it("sale update site-settings / header / footer → 403", async () => {
      expect(await statusOf(updateSettings({ hotline: "111" }, sale))).toBe(403);
      for (const slug of ["header", "footer"] as const) {
        expect(
          await statusOf(payload.updateGlobal({ slug, data: {} as never, user: asUser(sale), overrideAccess: false })),
        ).toBe(403);
      }
    });

    it("khách update qua REST → 403", async () => {
      const response = await handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/globals/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotline: "222" }),
        }),
      });
      expect(response.status).toBe(403);
    });

    it("admin update được và hook làm mới tag global", async () => {
      revalidated.length = 0;
      const doc = await updateSettings({ hotline: "0911111111" }, admin);
      expect(doc.hotline).toBe("0911111111");
      expect(revalidated).toEqual([["global:site-settings"]]);
    });

    it("lưu bản en cũng làm mới cùng tag (phủ vi + en)", async () => {
      revalidated.length = 0;
      await updateSettings({ siteName: "TAMI HOMES EN", address: "Hanoi" }, admin, "en");
      expect(revalidated).toEqual([["global:site-settings"]]);
      const en = await readPublicGlobal(payload, "site-settings", "en");
      expect(en.siteName).toBe("TAMI HOMES EN");
      const vi = await readPublicGlobal(payload, "site-settings", "vi");
      expect(vi.siteName).toBe("TAMI HOMES");
    });

    it("header/footer: admin lưu → làm mới tag riêng", async () => {
      revalidated.length = 0;
      await payload.updateGlobal({
        slug: "header",
        data: { navItems: [{ label: "Dự án", link: "projects" }] },
        user: asUser(admin),
        overrideAccess: false,
      });
      await payload.updateGlobal({
        slug: "footer",
        data: { copyright: "© TAMI" },
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(revalidated).toEqual([["global:header"], ["global:footer"]]);
    });
  });

  describe("biến thể truy vấn REST của khách không lộ trường nội bộ", () => {
    for (const query of ["?locale=all", "?locale=en", "?depth=2", "?depth=0", "?select[notificationEmails]=true", "?select[translationGlossary]=true&select[siteName]=true", "?draft=true"]) {
      it(`khách GET /globals/site-settings${query}`, async () => {
        const response = await restGet(`/globals/site-settings${query}`);
        expect(response.status).toBe(200);
        const text = JSON.stringify(await response.json());
        for (const field of SECRET_FIELDS) expect(text).not.toContain(`"${field}"`);
        expect(text).not.toContain("bi-mat@example.test");
        expect(text).not.toContain("serviced apartment");
      });
    }
  });

  describe("nhóm translation (ERD §1.1, PERMISSION §4)", () => {
    const slugs = ["site-settings", "header", "footer"] as const;
    const translation = { status: "done", enSource: "ai", model: "test-model" } as const;
    const writeAs = (slug: (typeof slugs)[number], user?: typeof admin) =>
      payload.updateGlobal({
        slug,
        data: { translation } as never,
        user: user ? asUser(user) : undefined,
        overrideAccess: false,
      }) as Promise<{ translation?: { status?: string; model?: string | null } }>;

    it("admin không sửa được translation.* (bỏ qua, giá trị không đổi)", async () => {
      for (const slug of slugs) {
        const doc = await writeAs(slug, admin);
        expect(doc.translation?.status).toBe("none");
        expect(doc.translation?.model ?? null).toBeNull();
      }
    });

    it("sale không sửa được site-settings/header/footer (403)", async () => {
      for (const slug of slugs) expect(await statusOf(writeAs(slug, sale))).toBe(403);
    });

    it("khách ghi qua REST → 403", async () => {
      const response = await handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/globals/header", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translation }),
        }),
      });
      expect(response.status).toBe(403);
    });

    it("hệ thống (overrideAccess) ghi được; khách đọc thấy trạng thái (chỉ đọc với tất cả)", async () => {
      for (const slug of slugs) {
        await payload.updateGlobal({ slug, data: { translation } as never, overrideAccess: true });
        const response = await restGet(`/globals/${slug}`);
        const body = (await response.json()) as { translation?: { status?: string; model?: string } };
        expect(body.translation).toMatchObject({ status: "done", model: "test-model" });
      }
    });
  });

  describe("admin nav (PERMISSION §3.2: sale không có quyền với 3 global)", () => {
    it("hidden với sale, hiện với admin", () => {
      for (const slug of ["site-settings", "header", "footer"]) {
        const hidden = payload.config.globals.find((global) => global.slug === slug)?.admin?.hidden;
        expect(typeof hidden).toBe("function");
        const check = hidden as (args: { user: unknown }) => boolean;
        expect(check({ user: sale })).toBe(true);
        expect(check({ user: admin })).toBe(false);
      }
    });
  });

  describe("privacyPolicyVersion (BR-30)", () => {
    it("admin không sửa tay được (field access update bị từ chối: giá trị không đổi)", async () => {
      await payload.updateGlobal({
        slug: "site-settings",
        data: { privacyPolicyVersion: "9.9" } as never,
        user: asUser(admin),
        overrideAccess: false,
      });
      const doc = await payload.findGlobal({ slug: "site-settings", overrideAccess: true });
      expect(doc.privacyPolicyVersion ?? null).toBeNull();
    });

    it("hệ thống (overrideAccess) ghi được; khách đọc được để làm consentVersion", async () => {
      await payload.updateGlobal({ slug: "site-settings", data: { privacyPolicyVersion: "1.0" }, overrideAccess: true });
      const guest = await readPublicGlobal(payload, "site-settings", "vi");
      expect(guest.privacyPolicyVersion).toBe("1.0");
    });
  });

  describe("link và URL", () => {
    it("navItems.link: khoá trang và URL tuyệt đối được; javascript:/khoá lạ → 400", async () => {
      const save = (link: string) =>
        payload.updateGlobal({
          slug: "header",
          data: { navItems: [{ label: "X", link }] },
          user: asUser(admin),
          overrideAccess: false,
        });
      await save("rentals");
      await save("https://example.com/a");
      expect(await statusOf(save("javascript:alert(1)"))).toBe(400);
      expect(await statusOf(save("khong-co-trang"))).toBe(400);
    });

    it("URL và link lưu bản đã trim", async () => {
      const doc = await updateSettings(
        { zaloUrl: "  https://zalo.me/tami  ", socialLinks: [{ platform: "facebook", url: " https://fb.test/x\n" }] },
        admin,
      );
      expect(doc.zaloUrl).toBe("https://zalo.me/tami");
      expect(doc.socialLinks?.[0]?.url).toBe("https://fb.test/x");
      const header = await payload.updateGlobal({
        slug: "header",
        data: { navItems: [{ label: "X", link: "  rentals " }], ctaButton: { label: "Gọi", link: " https://example.com " } },
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(header.navItems?.[0]?.link).toBe("rentals");
      expect(header.ctaButton?.link).toBe("https://example.com");
    });

    it("zaloUrl/fanpageUrl chỉ nhận http(s)", async () => {
      expect(await statusOf(updateSettings({ zaloUrl: "javascript:alert(1)" }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ fanpageUrl: "ftp://x.test" }, admin))).toBe(400);
      const doc = await updateSettings({ zaloUrl: "https://zalo.me/tami" }, admin);
      expect(doc.zaloUrl).toBe("https://zalo.me/tami");
    });
  });

  describe("chữ hero trang con + dải ý Tuyển dụng (BL-045)", () => {
    it("admin lưu chữ hero vi + en riêng; /en không rơi về tiếng Việt; khách đọc được", async () => {
      await updateSettings({ pageHeroes: { projects: { eyebrow: "Dự án", title: "Dự án", titleAccent: "đáng sống", description: "Mô tả vi" } } }, admin);
      await updateSettings({ pageHeroes: { projects: { title: "Projects", titleAccent: "worth living" } } }, admin, "en");
      const vi = await readPublicGlobal(payload, "site-settings", "vi");
      expect(vi.pageHeroes?.projects).toMatchObject({ eyebrow: "Dự án", title: "Dự án", titleAccent: "đáng sống", description: "Mô tả vi" });
      const en = await readPublicGlobal(payload, "site-settings", "en");
      expect(en.pageHeroes?.projects?.title).toBe("Projects");
      expect(en.pageHeroes?.projects?.description).toBeFalsy();
    });

    it("cờ Điểm mạnh mặc định bật; ảnh Liên hệ/Pháp lý nhận null; careersPerks lưu 2 ngôn ngữ, tối thiểu 2 mục", async () => {
      expect((await readPublicGlobal(payload, "site-settings", "vi")).showProjectStrengths).not.toBe(false);
      const doc = await updateSettings(
        { showProjectStrengths: false, pageBanners: { contact: null, legal: null }, careersPerks: [{ icon: "star", title: "Lương thưởng" }, { icon: "users", title: "Đội ngũ", description: "Trẻ" }] },
        admin,
      );
      expect(doc.showProjectStrengths).toBe(false);
      expect(doc.careersPerks).toHaveLength(2);
      await updateSettings({ careersPerks: [{ id: doc.careersPerks?.[0]?.id, icon: "star", title: "Pay" }, { id: doc.careersPerks?.[1]?.id, icon: "users", title: "Team" }] }, admin, "en");
      expect((await readPublicGlobal(payload, "site-settings", "en")).careersPerks?.map((perk) => perk.title)).toEqual(["Pay", "Team"]);
      expect(await statusOf(updateSettings({ careersPerks: [{ icon: "star", title: "Một mục" }] }, admin))).toBe(400);
    });
  });

  describe("văn phòng, giờ làm việc, quy trình ứng tuyển (BL-054)", () => {
    it("trống là hợp lệ (dữ liệu cũ vẫn lưu); admin lưu vi + en riêng; /en không rơi về tiếng Việt; khách đọc được", async () => {
      const blank = await updateSettings({ hotline: "0900000000" }, admin);
      expect(blank.offices ?? []).toHaveLength(0);
      expect(blank.careersProcess ?? []).toHaveLength(0);

      const doc = await updateSettings(
        {
          offices: [{ name: "Trụ sở Hà Nội", address: "1 Phố Test, Hà Nội", location: [105.85, 21.03], phone: "0241234567", email: "hn@example.test" }],
          workingHours: { hours: "8:00 – 18:00", days: "Thứ 2 – Chủ nhật" },
          careersProcess: [{ icon: "file-check", title: "Nộp hồ sơ", description: "Gửi CV" }, { icon: "users", title: "Phỏng vấn" }],
        },
        admin,
      );
      expect(doc.offices?.[0]).toMatchObject({ name: "Trụ sở Hà Nội", phone: "0241234567", email: "hn@example.test" });
      expect(doc.offices?.[0]?.location).toEqual([105.85, 21.03]);
      expect(doc.careersProcess?.map((step) => step.title)).toEqual(["Nộp hồ sơ", "Phỏng vấn"]);

      const enBefore = await readPublicGlobal(payload, "site-settings", "en");
      expect(enBefore.workingHours?.hours).toBeFalsy();
      expect(enBefore.offices?.[0]?.name).toBeFalsy();

      await updateSettings(
        {
          offices: [{ id: doc.offices?.[0]?.id, name: "Hanoi Head Office", address: "1 Test Street, Hanoi" }],
          workingHours: { hours: "8:00 AM – 6:00 PM", days: "Monday – Sunday" },
          careersProcess: [{ id: doc.careersProcess?.[0]?.id, icon: "file-check", title: "Apply" }, { id: doc.careersProcess?.[1]?.id, icon: "users", title: "Interview" }],
        },
        admin,
        "en",
      );
      const en = await readPublicGlobal(payload, "site-settings", "en");
      expect(en.offices?.[0]).toMatchObject({ name: "Hanoi Head Office", address: "1 Test Street, Hanoi", phone: "0241234567" });
      expect(en.workingHours).toMatchObject({ hours: "8:00 AM – 6:00 PM", days: "Monday – Sunday" });
      expect(en.careersProcess?.map((step) => step.title)).toEqual(["Apply", "Interview"]);
      const vi = await readPublicGlobal(payload, "site-settings", "vi");
      expect(vi.offices?.[0]?.name).toBe("Trụ sở Hà Nội");
      expect(vi.workingHours?.days).toBe("Thứ 2 – Chủ nhật");
    });

    it("thiếu tên / địa chỉ văn phòng, thiếu tiêu đề bước, quá 10 văn phòng / 6 bước, email sai → 400; sale ghi → 403", async () => {
      expect(await statusOf(updateSettings({ offices: [{ address: "Chỉ có địa chỉ" }] }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ offices: [{ name: "Chỉ có tên" }] }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ offices: [{ name: "VP", address: "ĐC", email: "khong-phai-email" }] }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ offices: Array.from({ length: 11 }, (_, i) => ({ name: `VP ${i}`, address: "ĐC" })) }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ careersProcess: [{ icon: "star" }] }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ careersProcess: Array.from({ length: 7 }, (_, i) => ({ icon: "star", title: `Bước ${i}` })) }, admin))).toBe(400);
      expect(await statusOf(updateSettings({ workingHours: { hours: "9:00" } }, sale))).toBe(403);
    });
  });

  describe("nội dung trang danh sách (BL-052)", () => {
    it("admin lưu listingPages vi + en riêng; /en không rơi về tiếng Việt; cờ Điểm mạnh mặc định bật", async () => {
      const before = await readPublicGlobal(payload, "site-settings", "vi");
      expect(before.listingPages?.rentals?.showStrengths).not.toBe(false);
      const doc = await updateSettings(
        {
          listingPages: {
            rentals: {
              quickSearch: [{ label: "Căn hộ Quận 7" }, { label: "Studio" }],
              learnMore: { title: "Thuê nhà", titleAccent: "dễ dàng", ctaLabel: "Liên hệ", ctaHref: "/lien-he", videoUrl: "https://www.youtube.com/watch?v=abc" },
              faqs: [{ question: "Cọc mấy tháng?", answer: "Thường 1 đến 2 tháng." }],
              showStrengths: false,
            },
          },
        },
        admin,
      );
      const rentals = doc.listingPages?.rentals;
      expect(rentals?.quickSearch?.map((row) => row.label)).toEqual(["Căn hộ Quận 7", "Studio"]);
      expect(rentals?.showStrengths).toBe(false);
      // Chưa lưu/dịch bản en: hàng có ở en nhưng chữ trống (loader bỏ hàng), không lấy chữ Việt.
      const enBefore = (await readPublicGlobal(payload, "site-settings", "en")).listingPages?.rentals;
      expect(enBefore?.quickSearch?.map((row) => row.label ?? null)).toEqual([null, null]);
      expect(enBefore?.learnMore?.title).toBeFalsy();
      expect(enBefore?.faqs?.[0]?.question).toBeFalsy();

      // Lưu bản en: hàng bắt buộc chữ phải có chữ en (như careersPerks); chữ không nhập ở en (titleAccent) để trống.
      await updateSettings(
        {
          siteName: "TAMI",
          listingPages: {
            rentals: {
              quickSearch: [{ id: rentals?.quickSearch?.[0]?.id, label: "District 7 apartments" }, { id: rentals?.quickSearch?.[1]?.id, label: "Studio" }],
              learnMore: { title: "Renting" },
              faqs: [{ id: rentals?.faqs?.[0]?.id, question: "How many months deposit?", answer: "Usually 1 to 2 months." }],
            },
          },
        },
        admin,
        "en",
      );
      const en = (await readPublicGlobal(payload, "site-settings", "en")).listingPages?.rentals;
      expect(en?.quickSearch?.map((row) => row.label)).toEqual(["District 7 apartments", "Studio"]);
      expect(en?.learnMore?.title).toBe("Renting");
      expect(en?.learnMore?.titleAccent).toBeFalsy();
      expect(en?.learnMore?.ctaHref).toBe("/lien-he");
      expect(en?.faqs?.[0]?.question).toBe("How many months deposit?");
      const vi = (await readPublicGlobal(payload, "site-settings", "vi")).listingPages?.rentals;
      expect(vi?.learnMore?.title).toBe("Thuê nhà");
      expect(vi?.quickSearch?.map((row) => row.label)).toEqual(["Căn hộ Quận 7", "Studio"]);
    });

    it("ctaHref chỉ nhận đường dẫn nội bộ / https; video lạ, thiếu chữ hàng bắt buộc, quá số dòng → 400", async () => {
      const learnMore = (patch: Record<string, unknown>) => updateSettings({ listingPages: { projects: { learnMore: { title: "T", ...patch } } } }, admin);
      expect(await statusOf(learnMore({ ctaHref: "javascript:alert(1)" }))).toBe(400);
      expect(await statusOf(learnMore({ ctaHref: "//evil.example" }))).toBe(400);
      expect(await statusOf(learnMore({ videoUrl: "https://evil.example/v" }))).toBe(400);
      expect(await statusOf(learnMore({ ctaHref: "https://example.test/a" }))).toBeUndefined();
      expect(await statusOf(updateSettings({ listingPages: { projects: { faqs: [{ question: "Q" }] } } }, admin))).toBe(400);
      const nine = Array.from({ length: 9 }, (_, index) => ({ label: "Từ " + index }));
      expect(await statusOf(updateSettings({ listingPages: { propertyPosts: { quickSearch: nine } } }, admin))).toBe(400);
    });
  });
});
