import { createLocalReq, getAccessResults, type Payload, type Where } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { DashboardContext, DashboardUser } from "../../src/components/admin/dashboard/dashboard-data";

const databaseUrl = process.env.DATABASE_URL_TEST;

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

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (giống các integration test khác).
describe.skipIf(!databaseUrl)("integration: dashboard admin theo quyền (BL-015 T04, DB thật)", () => {
  const runId = Date.now().toString(36);
  const password = "Mat-khau-hop-le-123";
  const staffIds: string[] = [];
  const leadIds: string[] = [];
  const newsIds: string[] = [];
  let categoryId = "";
  let coverMediaId = "";
  let payload: Payload;
  let dashboard: typeof import("../../src/components/admin/dashboard/dashboard-data");

  type Actor = Awaited<ReturnType<typeof createStaff>>;
  let admin: Actor;
  let sale: Actor;
  let otherSale: Actor;

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES]) {
    const doc = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active: true },
    });
    staffIds.push(doc.id);
    return doc;
  }

  let phoneSeed = 0;
  async function createLead(status: string, assignedTo?: string) {
    phoneSeed += 1;
    const doc = await payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: `Khách ${runId} ${phoneSeed}`,
        phone: `09666${String(phoneSeed).padStart(5, "0")}`,
        locale: "vi",
        consentAt: new Date().toISOString(),
        consentVersion: "2026-10-test",
        status,
        assignedTo,
      } as never,
    });
    leadIds.push(doc.id);
    return doc;
  }

  async function createNews(author: Actor, status: "draft" | "published", title: string) {
    const doc = await payload.create({
      collection: "news",
      overrideAccess: true,
      locale: "vi",
      data: { title, excerpt: "Tóm tắt", content: lexical("Nội dung"), category: categoryId, cover: coverMediaId, status, author: author.id } as never,
    });
    newsIds.push(doc.id);
    return doc;
  }

  async function contextFor(actor: Actor): Promise<DashboardContext> {
    const user = { ...actor, collection: "staff" as const } as DashboardUser;
    const req = await createLocalReq({ user: user as never }, payload);
    const { getVisibleEntities } = await import("@payloadcms/ui/shared");
    return { payload, user, permissions: await getAccessResults({ req }), visibleEntities: getVisibleEntities({ req }) };
  }

  const cardCount = (cards: Array<{ id: string; count: number }>, id: string) => cards.find((card) => card.id === id)?.count;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    dashboard = await import("../../src/components/admin/dashboard/dashboard-data");
    admin = await createStaff("dash-admin", ROLES.admin);
    sale = await createStaff("dash-sale", ROLES.sale);
    otherSale = await createStaff("dash-other", ROLES.sale);
    categoryId = (await payload.create({ collection: "categories", overrideAccess: true, locale: "vi", data: { name: `Tin ${runId}`, scope: "news" } as never })).id;

    // Trường `cover` chỉ cần `media` tồn tại (bắt buộc khi xuất bản): chèn thẳng dòng để khỏi ghi file ra đĩa.
    const { pool } = payload.db as unknown as { pool: { query: (sql: string, params: unknown[]) => Promise<{ rows: Array<{ id: string }> }> } };
    coverMediaId = (await pool.query("INSERT INTO media (mime_type) VALUES ($1) RETURNING id", ["image/jpeg"])).rows[0]?.id ?? "";

    // Lead: 2 mới + 1 đang tư vấn giao cho sale, 1 mới giao người khác, 1 mới chưa giao.
    await createLead("new", sale.id);
    await createLead("new", sale.id);
    await createLead("consulting", sale.id);
    await createLead("new", otherSale.id);
    await createLead("new");

    // Bài: sale 2 nháp + 1 đang đăng (+ 1 nháp đã xoá mềm); người khác 1 nháp + 1 đang đăng.
    await createNews(sale, "draft", `Nháp A ${runId}`);
    await createNews(sale, "draft", `Nháp B ${runId}`);
    await createNews(sale, "published", `Đăng A ${runId}`);
    const trashed = await createNews(sale, "draft", `Nháp đã xoá ${runId}`);
    await payload.update({ collection: "news", id: trashed.id, overrideAccess: true, data: { deletedAt: new Date().toISOString() } as never });
    await createNews(otherSale, "draft", `Nháp người khác ${runId}`);
    await createNews(otherSale, "published", `Đăng người khác ${runId}`);
  }, 120_000);

  afterAll(async () => {
    if (!payload) return;
    const { pool } = payload.db as unknown as { pool: { query: (sql: string, params: unknown[]) => Promise<unknown> } };
    await pool.query("DELETE FROM lead_activities WHERE lead_id = ANY($1::uuid[])", [leadIds]);
    await pool.query("DELETE FROM leads WHERE id = ANY($1::uuid[])", [leadIds]);
    await pool.query("DELETE FROM _news_v WHERE parent_id = ANY($1::uuid[])", [newsIds]);
    await pool.query("DELETE FROM news WHERE id = ANY($1::uuid[])", [newsIds]);
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
    await pool.query("DELETE FROM media WHERE id = $1", [coverMediaId]);
    await pool.query("DELETE FROM staff WHERE id = ANY($1::uuid[])", [staffIds]);
  });

  describe("thẻ số liệu", () => {
    it("sale: chỉ đếm lead giao cho mình + bài của mình (nháp xoá mềm không tính); không có thẻ hồ sơ ứng tuyển / chưa phân công", async () => {
      const cards = await dashboard.loadStatCards(await contextFor(sale));
      expect(cards.map((card) => card.id).sort()).toEqual(["content-visible", "drafts-mine", "leads-new", "leads-processing"]);
      expect(cardCount(cards, "leads-new")).toBe(2);
      expect(cardCount(cards, "leads-processing")).toBe(1);
      expect(cardCount(cards, "drafts-mine")).toBe(2);
      expect(cardCount(cards, "content-visible")).toBe(1);
    });

    it("count mặc định bỏ bản xoá mềm (collection có trash) — thẻ không cần tự thêm điều kiện deletedAt", async () => {
      const user = { ...sale, collection: "staff" as const } as never;
      const where: Where = { and: [{ author: { equals: sale.id } }, { status: { equals: "draft" } }] };
      const visible = await payload.count({ collection: "news", where, user, overrideAccess: false });
      const withTrash = await payload.count({ collection: "news", where, user, overrideAccess: false, trash: true });
      expect(visible.totalDocs).toBe(2);
      expect(withTrash.totalDocs).toBe(3);
    });

    it("admin: có thẻ hồ sơ ứng tuyển + lead chưa phân công; số đếm khớp truy vấn thủ công", async () => {
      const countNew = async () => (await payload.count({ collection: "leads", overrideAccess: true, where: { status: { equals: "new" } } })).totalDocs;
      const countUnassigned = async () =>
        (
          await payload.count({
            collection: "leads",
            overrideAccess: true,
            where: { and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] },
          })
        ).totalDocs;
      // DB có thể dùng chung với test file chạy song song: đếm thủ công trước + sau, số thẻ phải nằm giữa (không flaky).
      const newBefore = await countNew();
      const unassignedBefore = await countUnassigned();
      const cards = await dashboard.loadStatCards(await contextFor(admin));
      const newAfter = await countNew();
      const unassignedAfter = await countUnassigned();
      expect(cards.map((card) => card.id)).toEqual(["leads-new", "leads-unassigned", "applications-new", "content-visible"]);
      expect(cardCount(cards, "leads-new")).toBeGreaterThanOrEqual(4);
      expect(cardCount(cards, "leads-new")).toBeGreaterThanOrEqual(Math.min(newBefore, newAfter));
      expect(cardCount(cards, "leads-new")).toBeLessThanOrEqual(Math.max(newBefore, newAfter));
      expect(cardCount(cards, "leads-unassigned")).toBeGreaterThanOrEqual(1);
      expect(cardCount(cards, "leads-unassigned")).toBeGreaterThanOrEqual(Math.min(unassignedBefore, unassignedAfter));
      expect(cardCount(cards, "leads-unassigned")).toBeLessThanOrEqual(Math.max(unassignedBefore, unassignedAfter));
      expect(cardCount(cards, "content-visible")).toBeGreaterThanOrEqual(2);
    });

    it("sale gọi thẳng count cho job-applications bị từ chối -> dashboard không dựa vào đó (thẻ bị loại từ permissions)", async () => {
      const context = await contextFor(sale);
      expect(context.permissions.collections?.["job-applications"]?.read).toBeUndefined();
      expect(context.permissions.collections?.leads?.read).toBeTruthy();
    });
  });

  describe("lối tắt, danh sách gần đây, card nhóm", () => {
    it("lối tắt chỉ gồm collection có quyền create: sale không có Dịch vụ / Trang pháp lý / Lịch sử chăm sóc; admin có đủ", async () => {
      const saleSlugs = dashboard.buildShortcuts(await contextFor(sale)).map((shortcut) => shortcut.slug);
      expect(saleSlugs).toEqual(["projects", "rentals", "property-posts", "news", "job-postings"]);
      const adminSlugs = dashboard.buildShortcuts(await contextFor(admin)).map((shortcut) => shortcut.slug);
      expect(adminSlugs).toEqual(["projects", "rentals", "property-posts", "news", "job-postings", "services", "pages"]);
    });

    it("lead mới nhất của sale chỉ có lead giao cho mình và không mang SĐT/email/lời nhắn", async () => {
      const leads = await dashboard.loadRecentLeads(await contextFor(sale));
      expect(leads).not.toBeNull();
      expect(leads!.length).toBeLessThanOrEqual(5);
      expect(leads!.every((lead) => lead.fullName.startsWith("Khách"))).toBe(true);
      expect(leads!.map((lead) => lead.id).every((id) => leadIds.includes(id))).toBe(true);
      for (const lead of leads!) {
        expect(Object.keys(lead).sort()).toEqual(["assigneeName", "code", "createdAt", "fullName", "id", "isAssigned", "source", "status"]);
      }
      // Lead giao cho sale khác không xuất hiện.
      const otherLead = await payload.find({ collection: "leads", overrideAccess: true, where: { assignedTo: { equals: otherSale.id } }, limit: 5 });
      for (const doc of otherLead.docs) expect(leads!.map((lead) => lead.id)).not.toContain(doc.id);
    });

    it("'Bài của bạn cập nhật gần đây' chỉ gồm bài mình là tác giả, bỏ bài xoá mềm", async () => {
      const docs = await dashboard.loadRecentOwnDocs(await contextFor(sale));
      const titles = docs!.map((doc) => doc.title);
      expect(titles).toEqual(expect.arrayContaining([`Đăng A ${runId}`, `Nháp A ${runId}`, `Nháp B ${runId}`]));
      expect(titles.some((title) => title.includes("người khác") || title.includes("đã xoá"))).toBe(false);
    });

    it("card nhóm: sale không thấy Hồ sơ ứng tuyển / Tệp CV / globals ẩn / Nhật ký; admin thấy cả globals", async () => {
      const saleItems = dashboard.buildNavGroupCards(await contextFor(sale)).flatMap((group) => group.items.map((item) => item.href));
      expect(saleItems).toContain("/admin/collections/leads");
      for (const hidden of ["job-applications", "private-files", "audit-logs", "click-events", "translation-usage"]) {
        expect(saleItems.some((href) => href.endsWith(`/${hidden}`))).toBe(false);
      }
      expect(saleItems.some((href) => href.startsWith("/admin/globals/"))).toBe(false);
      const adminGroups = dashboard.buildNavGroupCards(await contextFor(admin));
      expect(adminGroups.map((group) => group.label)).toEqual(["Khách hàng", "Nội dung", "Tuyển dụng", "Thư viện", "Dữ liệu nền", "Website", "Hệ thống"]);
      expect(adminGroups.flatMap((group) => group.items.map((item) => item.href))).toContain("/admin/globals/site-settings");
    });
  });
});
