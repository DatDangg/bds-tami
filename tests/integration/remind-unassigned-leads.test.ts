import type { EventEmitter } from "node:events";
import pg from "pg";
import { sql } from "@payloadcms/db-postgres";
import { createLocalReq, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { Lead } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;

/** Giờ VN (UTC+7) -> Date. 2026-10-19 thứ 2, 24 thứ 7, 25 Chủ nhật. */
const vn = (day: number, hhmm: string) => new Date(`2026-10-${String(day).padStart(2, "0")}T${hhmm}:00+07:00`);

/** DB tạm (migration thật): job `remind-unassigned-leads` (BR-14) — đếm theo giờ hành chính, nhắc đúng một lần, một email gộp. */
describe.skipIf(!baseUrl)("integration: job remind-unassigned-leads", () => {
  const dbName = `tami_remind_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let payload: Payload;
  let adminEmail: string;
  let adminId: string;
  let sale: { id: string };
  let phoneSeed = 0;

  async function createLead(createdAt: Date, extra: Record<string, unknown> = {}) {
    phoneSeed += 1;
    return payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: `Khach Rieng ${phoneSeed}`,
        phone: `09666${String(phoneSeed).padStart(5, "0")}`,
        locale: "vi",
        consentAt: createdAt.toISOString(),
        consentVersion: "2026-10-test",
        createdAt: createdAt.toISOString(),
        ...extra,
      } as never,
    }) as Promise<Lead>;
  }

  async function runJob(now: Date) {
    const { remindUnassignedLeads } = await import("../../src/jobs/remind-unassigned-leads");
    const req = await createLocalReq({}, payload);
    return remindUnassignedLeads({ req, now });
  }
  const reload = (id: string) => payload.findByID({ collection: "leads", id, overrideAccess: true, depth: 0 }) as Promise<Lead>;
  const reminderJobs = async () =>
    (await payload.find({ collection: "payload-jobs", where: { taskSlug: { equals: "send-notification-email" } }, overrideAccess: true, pagination: false })).docs.filter(
      (job) => (job.input as { template?: string } | null)?.template === "unassigned-reminder",
    );
  const reminderJobsMentioning = async (lead: Lead) => (await reminderJobs()).filter((job) => JSON.stringify(job.input).includes(lead.code));
  const emailSentActivities = async (leadId: string) =>
    (await payload.find({ collection: "lead-activities", where: { lead: { equals: leadId }, type: { equals: "email_sent" } }, overrideAccess: true, depth: 0, pagination: false })).docs;

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
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    adminEmail = `admin-${runId}@example.test`;
    const admin = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: adminEmail, password: "Mat-khau-hop-le-123", fullName: "Test admin", role: ROLES.admin, active: true },
    });
    adminId = admin.id;
    sale = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `sale-${runId}@example.test`, password: "Mat-khau-hop-le-123", fullName: "Test sale", role: ROLES.sale, active: true },
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

  it("lead chưa giao đủ 30 phút làm việc: nhắc admin bằng MỘT email gộp (mã + link, không PII); chạy lại không nhắc thêm", async () => {
    const lead = await createLead(vn(19, "09:00"));
    const second = await createLead(vn(19, "09:02"));
    expect(await runJob(vn(19, "09:31"))).toEqual({ reminded: 1 });
    expect((await reload(lead.id)).remindedAt).toBeTruthy();
    expect((await reload(second.id)).remindedAt).toBeFalsy();

    const [job, ...rest] = await reminderJobsMentioning(lead);
    expect(rest).toHaveLength(0);
    const input = job!.input as { to: string[]; data: { leads: { code: string; leadUrl: string }[]; waitMinutes: number } };
    expect(input.to).toEqual([adminEmail]);
    expect(input.data.leads).toEqual([{ code: lead.code, leadUrl: expect.stringContaining(`/admin/collections/leads/${lead.id}`) }]);
    expect(JSON.stringify(input)).not.toContain(lead.phone);
    expect(JSON.stringify(input)).not.toContain(lead.fullName);
    expect(await emailSentActivities(lead.id)).toHaveLength(1);

    expect(await runJob(vn(19, "09:41"))).toEqual({ reminded: 1 }); // `second` tới mốc; `lead` không bị nhắc lại
    expect(await reminderJobsMentioning(lead)).toHaveLength(1);
    expect(await emailSentActivities(lead.id)).toHaveLength(1);
    expect(await runJob(vn(19, "09:51"))).toEqual({ reminded: 0 });
    expect(await reminderJobs()).toHaveLength(2);
  });

  it("gộp nhiều lead cùng lần chạy vào MỘT email", async () => {
    const [a, b] = [await createLead(vn(20, "09:00")), await createLead(vn(20, "09:05"))];
    const before = (await reminderJobs()).length;
    expect(await runJob(vn(20, "10:00"))).toEqual({ reminded: 2 });
    expect(await reminderJobs()).toHaveLength(before + 1);
    const [job] = await reminderJobsMentioning(a);
    expect(JSON.stringify(job!.input)).toContain(b.code);
  });

  it("ngoài giờ hành chính (Chủ nhật, đêm) không nhắc; tới giờ làm kế tiếp mới đếm 30 phút", async () => {
    const lead = await createLead(vn(24, "20:00")); // tối thứ 7
    expect(await runJob(vn(25, "10:00"))).toEqual({ reminded: 0 }); // Chủ nhật
    expect(await runJob(vn(26, "07:00"))).toEqual({ reminded: 0 }); // trước giờ làm
    expect(await runJob(vn(26, "08:20"))).toEqual({ reminded: 0 }); // mới 20 phút làm việc
    expect((await reload(lead.id)).remindedAt).toBeFalsy();
    expect(await runJob(vn(26, "08:30"))).toEqual({ reminded: 1 });
    expect((await reload(lead.id)).remindedAt).toBeTruthy();
  });

  it("không nhắc lead đã giao, đã rời trạng thái new, hoặc đã ẩn danh", async () => {
    const assigned = await createLead(vn(21, "08:00"), { assignedTo: sale.id });
    const contacted = await createLead(vn(21, "08:00"));
    await payload.update({ collection: "leads", id: contacted.id, data: { status: "contacted" }, overrideAccess: true });
    const anonymized = await createLead(vn(21, "08:00"));
    await payload.update({ collection: "leads", id: anonymized.id, data: { anonymizedAt: vn(21, "08:10").toISOString() } as never, overrideAccess: true });
    expect(await runJob(vn(21, "12:00"))).toEqual({ reminded: 0 });
    for (const lead of [assigned, contacted, anonymized]) expect((await reload(lead.id)).remindedAt).toBeFalsy();
  });

  it("không có admin hoạt động: không đánh dấu (lần sau vẫn nhắc)", async () => {
    const lead = await createLead(vn(22, "08:00"));
    // Qua SQL: hook last-admin-guard chặn tắt admin cuối cùng qua API.
    const setAdminActive = (active: boolean) =>
      (payload.db.drizzle as unknown as { execute: (query: unknown) => Promise<unknown> }).execute(sql`UPDATE "staff" SET "active" = ${active} WHERE "id" = ${adminId}`);
    await setAdminActive(false);
    try {
      expect(await runJob(vn(22, "09:00"))).toEqual({ reminded: 0 });
      expect((await reload(lead.id)).remindedAt).toBeFalsy();
    } finally {
      await setAdminActive(true);
    }
    expect(await runJob(vn(22, "09:10"))).toEqual({ reminded: 1 });
  });

  it("hai lần chạy chồng nhau (khoá advisory + đọc lại trong transaction): mỗi lead chỉ nhắc MỘT lần, một email, một activity", async () => {
    const lead = await createLead(vn(27, "09:00"));
    const outcomes = await Promise.all([runJob(vn(27, "10:00")), runJob(vn(27, "10:00")), runJob(vn(27, "10:00"))]);
    expect(outcomes.reduce((total, outcome) => total + outcome.reminded, 0)).toBe(1);
    expect(await reminderJobsMentioning(lead)).toHaveLength(1);
    expect(await emailSentActivities(lead.id)).toHaveLength(1);
  });

  it("lỗi khi xếp email: rollback cả dấu remindedAt và activity", async () => {
    const lead = await createLead(vn(23, "08:00"));
    const original = payload.jobs.queue;
    payload.jobs.queue = (() => Promise.reject(new Error("queue down"))) as never;
    try {
      await expect(runJob(vn(23, "09:00"))).rejects.toThrow("queue down");
    } finally {
      payload.jobs.queue = original;
    }
    expect((await reload(lead.id)).remindedAt).toBeFalsy();
    expect(await emailSentActivities(lead.id)).toHaveLength(0);
    expect(await runJob(vn(23, "09:10"))).toEqual({ reminded: 1 });
  });
});
