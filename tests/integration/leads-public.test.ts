import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { PublicPipelineDeps } from "../../src/endpoints/_middleware/public-pipeline";
import type { Lead } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";
const RANDOM_UUID = "11111111-2222-4333-8444-555555555555";
const RAW_IP = "198.51.100.77";
const NOTIFY_TO = "thongbao-lead@tami.test";
const DAY_MS = 24 * 3600 * 1000;

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

const allowed: PublicPipelineDeps = {
  rateLimit: async () => ({ allowed: true, remaining: 4 }),
  verifyTurnstile: async () => ({ ok: true }),
};

/** DB tạm (migration thật) + config thật: endpoint công khai `POST /api/public/leads` gọi thẳng `handleLead` (rate limit/Turnstile giả). */
describe.skipIf(!baseUrl)("integration: POST /api/public/leads (tạo/gộp/tự giao/email)", () => {
  const dbName = `tami_leadpub_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let testUrl = "";
  let payload: Payload;
  let handleLead: typeof import("../../src/endpoints/public/leads").handleLead;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let saleA: Awaited<ReturnType<typeof createStaff>>;
  let lockedSale: Awaited<ReturnType<typeof createStaff>>;
  const ids: Record<string, string> = {};

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES]) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: PASSWORD, fullName: `Test ${label}`, role, active: true },
    });
  }
  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  async function withDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }

  let phoneSeed = 0;
  /** SĐT mới cho mỗi test để các test không gộp nhầm vào lead của nhau. */
  const freshPhone = () => `09888${String((phoneSeed += 1)).padStart(5, "0")}`;

  const body = (overrides: Record<string, unknown> = {}) => ({
    source: "rental",
    sourceId: ids.rentalA,
    fullName: "Nguyễn Văn Khách",
    phone: freshPhone(),
    email: "khach@example.test",
    message: "Cho tôi xem nhà",
    consent: true,
    turnstileToken: "token",
    locale: "vi",
    utm: { source: "facebook", medium: "cpc" },
    pageUrl: "https://tami.test/cho-thue/can-ho-a",
    referrer: "https://www.google.com/",
    ...overrides,
  });

  async function submit(data: unknown, options: { now?: Date; pipelineDeps?: PublicPipelineDeps } = {}) {
    const raw = typeof data === "string" ? data : JSON.stringify(data);
    const response = await handleLead(
      { headers: new Headers({ "CF-Connecting-IP": RAW_IP, "User-Agent": "Vitest-UA/1.0" }), text: async () => raw },
      { payload, pipelineDeps: options.pipelineDeps ?? allowed, now: options.now ? () => options.now! : undefined, siteUrl: "https://tami.test" },
    );
    return { status: response.status, text: await response.text() };
  }

  const leadsByPhone = async (phone: string) =>
    (await payload.find({ collection: "leads", where: { phone: { equals: phone } }, overrideAccess: true, depth: 0, pagination: false, sort: "createdAt" })).docs as Lead[];
  const normalized = (phone: string) => `+84${phone.slice(1)}`;
  const leadsOf = async (phone: string) =>
    (await payload.find({ collection: "leads", where: { phoneNormalized: { equals: normalized(phone) } }, overrideAccess: true, depth: 0, pagination: false, sort: "createdAt" })).docs as Lead[];
  const activitiesOf = async (leadId: string, type?: string) =>
    (
      await payload.find({
        collection: "lead-activities",
        where: { lead: { equals: leadId }, ...(type ? { type: { equals: type } } : {}) },
        overrideAccess: true,
        depth: 0,
        pagination: false,
        sort: "createdAt",
      })
    ).docs;
  const jobsOf = async (leadId: string, template?: string) =>
    (await payload.find({ collection: "payload-jobs", where: { taskSlug: { equals: "send-notification-email" } }, overrideAccess: true, pagination: false })).docs.filter(
      (job) => JSON.stringify(job.input).includes(leadId) && (!template || (job.input as { template?: string }).template === template),
    );

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
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    ({ handleLead } = await import("../../src/endpoints/public/leads"));

    admin = await createStaff("admin", ROLES.admin);
    saleA = await createStaff("salea", ROLES.sale);
    lockedSale = await createStaff("locked", ROLES.sale);
    await payload.updateGlobal({
      slug: "site-settings",
      data: { siteName: "TAMI HOMES", notificationEmails: [{ email: NOTIFY_TO }], privacyPolicyVersion: "2026-10-test" } as never,
      overrideAccess: true,
    });

    const imageIds: string[] = [];
    for (const mimeType of ["image/jpeg", "image/png", "image/webp"]) {
      const inserted = await withDatabase((client) => client.query(`INSERT INTO "media" (mime_type) VALUES ($1) RETURNING id`, [mimeType]));
      imageIds.push(inserted.rows[0].id as string);
    }
    const provinceId = (await payload.create({ collection: "provinces", data: { code: "79", name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh" }, overrideAccess: true })).id;
    const wardId = (
      await payload.create({ collection: "wards", data: { province: provinceId, code: "70101063", name: "Phường Sài Gòn", type: "phuong", slug: "sai-gon" }, overrideAccess: true })
    ).id;
    const category = async (scope: string) =>
      (await payload.create({ collection: "categories", data: { name: `Danh mục ${scope}`, scope } as never, locale: "vi", overrideAccess: true, depth: 0 })).id;
    const rentalCategory = await category("rental");
    const postCategory = await category("property_post");
    const projectCategory = await category("project");

    const createRental = async (key: string, author: { id: string }, data: Record<string, unknown> = {}) => {
      const doc = await payload.create({
        collection: "rentals",
        data: {
          title: `Tin ${key}`,
          description: lexical("Mô tả"),
          category: rentalCategory,
          province: provinceId,
          ward: wardId,
          address: "12 Đường Test",
          priceMonthlyVnd: 10_000_000,
          areaM2: 40,
          status: "published",
          gallery: imageIds,
          author: author.id,
          ...data,
        } as never,
        locale: "vi",
        user: asUser(admin),
        overrideAccess: false,
        depth: 0,
      });
      ids[key] = doc.id;
      return doc;
    };
    await createRental("rentalA", saleA);
    await createRental("rentalB", saleA);
    await createRental("rentalLocked", lockedSale);
    await createRental("rentalDraft", saleA, { status: "draft", gallery: [] });
    const rented = await createRental("rentalRented", saleA);
    await payload.update({ collection: "rentals", id: rented.id, data: { status: "rented" }, locale: "vi", user: asUser(admin), overrideAccess: false, depth: 0 });
    const trashed = await createRental("rentalTrashed", saleA);
    await payload.update({ collection: "rentals", id: trashed.id, data: { deletedAt: new Date().toISOString() }, locale: "vi", user: asUser(admin), overrideAccess: false, depth: 0 });

    ids.post = (
      await payload.create({
        collection: "property-posts",
        data: { title: "Bài đăng tin", excerpt: "Tóm tắt", content: lexical("Nội dung"), category: postCategory, status: "published", cover: imageIds[0], author: saleA.id } as never,
        locale: "vi",
        user: asUser(admin),
        overrideAccess: false,
        depth: 0,
      })
    ).id;
    ids.project = (
      await payload.create({
        collection: "projects",
        data: {
          title: "Dự án Alpha",
          summary: "Tóm tắt",
          overview: lexical("Tổng quan"),
          category: projectCategory,
          province: provinceId,
          salesStatus: "selling",
          status: "published",
          gallery: imageIds,
          author: saleA.id,
        } as never,
        locale: "vi",
        user: asUser(admin),
        overrideAccess: false,
        depth: 0,
      })
    ).id;
    // Khoá sale sau khi đã đăng tin: tin vẫn công khai nhưng không còn người nhận lead (SPEC § Quy tắc biên).
    await payload.update({ collection: "staff", id: lockedSale.id, data: { active: false }, overrideAccess: true });
  }, 240_000);

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

  describe("tạo lead mới", () => {
    it("200 { received: true }; lưu đủ dấu vết (consent, locale, utm, pageUrl, referrer, ipHash băm, userAgent), status new", async () => {
      const data = body({ locale: "en" });
      const response = await submit(data);
      expect(response).toEqual({ status: 200, text: JSON.stringify({ success: true, data: { received: true } }) });
      const [lead, ...rest] = await leadsByPhone(normalized(data.phone as string));
      expect(rest).toHaveLength(0);
      expect(lead).toMatchObject({
        source: "rental",
        rental: ids.rentalA,
        status: "new",
        fullName: "Nguyễn Văn Khách",
        email: "khach@example.test",
        message: "Cho tôi xem nhà",
        locale: "en",
        consentVersion: "2026-10-test",
        mergedCount: 0,
        utm: { source: "facebook", medium: "cpc" },
        pageUrl: "https://tami.test/cho-thue/can-ho-a",
        referrer: "https://www.google.com/",
        phoneNormalized: normalized(data.phone as string),
      });
      expect(new Date(lead!.consentAt).getTime()).toBeGreaterThan(Date.now() - 60_000);
      const stored = (await payload.findByID({ collection: "leads", id: lead!.id, overrideAccess: true, showHiddenFields: true, depth: 0 })) as Lead & { ipHash?: string };
      expect(stored.ipHash).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(stored)).not.toContain(RAW_IP);
      expect((stored as { userAgent?: string }).userAgent).toBe("Vitest-UA/1.0");
    });

    it("tin của sale đang hoạt động (rental, property_post, tin đã thuê) -> tự giao cho author: activity assignment không actor + email cho sale", async () => {
      for (const [source, sourceId] of [
        ["rental", ids.rentalA],
        ["property_post", ids.post],
        ["rental", ids.rentalRented],
      ] as const) {
        const data = body({ source, sourceId });
        expect((await submit(data)).status).toBe(200);
        const [lead] = await leadsOf(data.phone as string);
        expect(lead!.assignedTo, source).toBe(saleA.id);
        expect(lead!.assignedAt).toBeTruthy();
        const [assignment, ...more] = await activitiesOf(lead!.id, "assignment");
        expect(more).toHaveLength(0);
        expect(assignment).toMatchObject({ fromAssignee: null, toAssignee: saleA.id });
        expect(assignment!.actor ?? null).toBeNull();
        expect((await jobsOf(lead!.id, "lead-assigned")).map((job) => (job.input as { to: string[] }).to)).toEqual([[saleA.email]]);
      }
    });

    it("tin của sale đã khoá, dự án, liên hệ -> để trống (chờ admin), không activity phân công, không email giao", async () => {
      const cases = [
        body({ sourceId: ids.rentalLocked }),
        body({ source: "project", sourceId: ids.project }),
        body({ source: "contact", sourceId: undefined }),
      ];
      for (const data of cases) {
        expect((await submit(data)).status).toBe(200);
        const [lead] = await leadsOf(data.phone as string);
        expect(lead!.assignedTo ?? null, String(data.source)).toBeNull();
        expect(lead!.assignedAt ?? null).toBeNull();
        expect(await activitiesOf(lead!.id, "assignment")).toHaveLength(0);
        expect(await jobsOf(lead!.id, "lead-assigned")).toHaveLength(0);
        expect(await jobsOf(lead!.id, "new-lead")).toHaveLength(1);
      }
    });

    it("email lead mới (BR-13): 1 job template new-lead tới notificationEmails, kèm ngôn ngữ khách và link admin", async () => {
      const data = body({ locale: "en" });
      await submit(data);
      const [lead] = await leadsOf(data.phone as string);
      const [job, ...more] = await jobsOf(lead!.id, "new-lead");
      expect(more).toHaveLength(0);
      expect(job!.input).toMatchObject({
        template: "new-lead",
        to: [NOTIFY_TO],
        data: { leadName: "Nguyễn Văn Khách", language: "en", need: "Cho tôi xem nhà", leadUrl: `https://tami.test/admin/collections/leads/${lead!.id}` },
      });
    });

    // `ids` chỉ có sau beforeAll nên bảng chỉ giữ tên nguồn, dựng body trong test.
    it.each([
      ["rental (lỗi rơi ở job lead-assigned, trước email)", "rental"],
      ["project (không tự giao, lỗi rơi đúng queueNewLeadEmail)", "project"],
    ])("lỗi xếp email -> rollback cả lead (không mất lead âm thầm, khách nộp lại được), trả 500 chung: %s", async (_label, source) => {
      const data = source === "project" ? body({ source: "project", sourceId: ids.project }) : body();
      const queue = vi.spyOn(payload.jobs, "queue").mockRejectedValueOnce(new Error("queue down"));
      try {
        const response = await submit(data);
        expect(response.status).toBe(500);
        expect(response.text).not.toContain(data.phone as string);
      } finally {
        queue.mockRestore();
      }
      expect(await leadsOf(data.phone as string)).toHaveLength(0);
      expect((await submit(data)).status).toBe(200);
      expect(await leadsOf(data.phone as string)).toHaveLength(1);
    });
  });

  describe("form liên hệ (LeadForm source=contact)", () => {
    it("body đúng như client gửi (không sourceId, không email, UTM + pageUrl) tạo lead source=contact kèm UTM/pageUrl/ngôn ngữ", async () => {
      const phone = freshPhone();
      const clientBody = {
        source: "contact",
        fullName: "Khách Liên Hệ",
        phone,
        consent: true,
        turnstileToken: "token",
        locale: "en",
        utm: { source: "facebook", campaign: "t10" },
        pageUrl: "https://tami.test/en/contact",
      };
      expect((await submit(clientBody)).status).toBe(200);
      const [lead, ...more] = await leadsOf(phone);
      expect(more).toHaveLength(0);
      expect(lead).toMatchObject({ source: "contact", locale: "en", pageUrl: "https://tami.test/en/contact", utm: { source: "facebook", campaign: "t10" } });
      expect(lead!.consentAt).toBeTruthy();
    });
  });

  describe("chống trùng 7 ngày (BR-15)", () => {
    it("gửi 2 lần cùng SĐT + nguồn: 1 lead, mergedCount=1, activity merged (nội dung = lời nhắn lần 2), lastActivityAt đẩy lên, không email lead mới thứ hai; response y hệt lần đầu", async () => {
      const first = body({ message: "Lần đầu" });
      const created = await submit(first);
      const [lead] = await leadsOf(first.phone as string);
      const before = new Date(lead!.lastActivityAt!).getTime();
      const jobsBefore = (await jobsOf(lead!.id)).length;
      await new Promise((resolve) => setTimeout(resolve, 15));
      const merged = await submit({ ...first, message: "Lần hai", fullName: "Tên Khác" });
      expect(merged).toEqual(created);

      const leads = await leadsOf(first.phone as string);
      expect(leads).toHaveLength(1);
      expect(leads[0]).toMatchObject({ mergedCount: 1, fullName: "Nguyễn Văn Khách", message: "Lần đầu" });
      expect(new Date(leads[0]!.lastActivityAt!).getTime()).toBeGreaterThan(before);
      const [activity, ...more] = await activitiesOf(lead!.id, "merged");
      expect(more).toHaveLength(0);
      expect(activity).toMatchObject({ type: "merged", content: "Lần hai" });
      expect(activity!.actor ?? null).toBeNull();
      expect((await jobsOf(lead!.id)).length).toBe(jobsBefore);

      await submit({ ...first, message: undefined });
      expect((await leadsOf(first.phone as string))[0]!.mergedCount).toBe(2);
    });

    it("SĐT viết khác nhau (09…, +84 9…) vẫn là một khách", async () => {
      const first = body();
      await submit(first);
      await submit({ ...first, phone: `+84 ${(first.phone as string).slice(1, 4)} ${(first.phone as string).slice(4)}` });
      const leads = await leadsOf(first.phone as string);
      expect(leads).toHaveLength(1);
      expect(leads[0]!.mergedCount).toBe(1);
    });

    it("khác bản ghi nguồn hoặc khác loại nguồn -> lead riêng", async () => {
      const first = body();
      await submit(first);
      await submit({ ...first, sourceId: ids.rentalB });
      await submit({ ...first, source: "contact", sourceId: undefined });
      await submit({ ...first, source: "property_post", sourceId: ids.post });
      expect(await leadsOf(first.phone as string)).toHaveLength(4);
    });

    it("ngày thứ 8 -> lead mới; trong ngày thứ 6 vẫn gộp", async () => {
      const first = body();
      await submit(first);
      await submit(first, { now: new Date(Date.now() + 6 * DAY_MS) });
      expect(await leadsOf(first.phone as string)).toHaveLength(1);
      await submit(first, { now: new Date(Date.now() + 8 * DAY_MS) });
      const leads = await leadsOf(first.phone as string);
      expect(leads).toHaveLength(2);
      expect(leads.map((lead) => lead.mergedCount)).toEqual([1, 0]);
    });

    it("lead đã chốt/không thành/spam hoặc đã xoá mềm -> khách gửi lại tạo lead mới", async () => {
      for (const status of ["won", "lost", "spam", "trashed"] as const) {
        const first = body();
        await submit(first);
        const [lead] = await leadsOf(first.phone as string);
        const data =
          status === "trashed" ? { deletedAt: new Date().toISOString() } : status === "lost" ? { status, lostReason: "Khách đổi ý" } : { status };
        await payload.update({ collection: "leads", id: lead!.id, data: data as never, overrideAccess: true, trash: true, depth: 0 });
        await submit(first);
        const live = (await leadsOf(first.phone as string)).filter((candidate) => candidate.id !== lead!.id);
        expect(live, status).toHaveLength(1);
        expect(live[0]!.mergedCount).toBe(0);
      }
    });

    it("lead đang chăm sóc (contacted/consulting) vẫn gộp", async () => {
      const first = body();
      await submit(first);
      const [lead] = await leadsOf(first.phone as string);
      await payload.update({ collection: "leads", id: lead!.id, data: { status: "consulting" }, overrideAccess: true, depth: 0 });
      await submit(first);
      expect(await leadsOf(first.phone as string)).toHaveLength(1);
    });

    it("5 request đồng thời cùng SĐT + nguồn -> đúng 1 lead, mergedCount=4, 4 activity merged, 1 email lead mới", async () => {
      const first = body();
      const results = await Promise.all(Array.from({ length: 5 }, () => submit(first)));
      expect(new Set(results.map((result) => result.text)).size).toBe(1);
      expect(results.every((result) => result.status === 200)).toBe(true);
      const leads = await leadsOf(first.phone as string);
      expect(leads).toHaveLength(1);
      expect(leads[0]!.mergedCount).toBe(4);
      expect(await activitiesOf(leads[0]!.id, "merged")).toHaveLength(4);
      expect(await jobsOf(leads[0]!.id, "new-lead")).toHaveLength(1);
    });
  });

  describe("kiểm tra đầu vào + nguồn", () => {
    it("thiếu consent / Turnstile sai / vượt rate limit -> 400 / 400 / 429, không tạo lead", async () => {
      const data = body();
      expect((await submit({ ...data, consent: false })).status).toBe(400);
      const captcha = await submit(data, { pipelineDeps: { rateLimit: allowed.rateLimit, verifyTurnstile: async () => ({ ok: false, reason: "invalid" }) as never } });
      expect(captcha.status).toBe(400);
      expect(captcha.text).toMatch(/captcha/i);
      const limited = await submit(data, { pipelineDeps: { rateLimit: async () => ({ allowed: false, retryAfterSeconds: 60 }), verifyTurnstile: allowed.verifyTurnstile } });
      expect(limited.status).toBe(429);
      expect(await leadsOf(data.phone as string)).toHaveLength(0);
    });

    it("nguồn nháp / đã xoá mềm / không tồn tại / sai collection -> 400, không tạo lead, không lộ lý do khác nhau", async () => {
      const data = body();
      const results = await Promise.all(
        [ids.rentalDraft, ids.rentalTrashed, RANDOM_UUID, ids.post].map((sourceId) => submit({ ...data, sourceId })),
      );
      expect(results.map((result) => result.status)).toEqual([400, 400, 400, 400]);
      expect(new Set(results.map((result) => result.text)).size).toBe(1);
      expect(await leadsOf(data.phone as string)).toHaveLength(0);
    });
  });
});
