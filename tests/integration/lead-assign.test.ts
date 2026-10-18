import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { Lead } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";
const RANDOM_UUID = "11111111-2222-4333-8444-555555555555";

/** DB tạm (migration thật): phân công lead = hook `leads.afterChange` (nơi duy nhất) + endpoint admin. */
describe.skipIf(!baseUrl)("integration: phân công lead (hook + POST /api/admin/leads/:id/assign)", () => {
  const dbName = `tami_assign_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let saleA: Awaited<ReturnType<typeof createStaff>>;
  let saleB: Awaited<ReturnType<typeof createStaff>>;
  let lockedSale: Awaited<ReturnType<typeof createStaff>>;
  let tokens: { admin: string; saleA: string };

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES], active = true) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: PASSWORD, fullName: `Test ${label}`, role, active },
    });
  }
  const login = async (label: string) =>
    (await payload.login({ collection: "staff", data: { email: `${label}-${runId}@example.test`, password: PASSWORD } })).token!;
  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });
  const actingAs = (user: object) => ({ user: asUser(user), overrideAccess: false as const });

  let phoneSeed = 0;
  /** Như endpoint công khai tạo lead: Local API `overrideAccess`, không có user (hệ thống). */
  async function createLead(assignedTo?: string) {
    phoneSeed += 1;
    return payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: "Khách Hàng",
        phone: `09777${String(phoneSeed).padStart(5, "0")}`,
        locale: "en",
        consentAt: new Date().toISOString(),
        consentVersion: "2026-10-test",
        assignedTo,
      } as never,
    }) as Promise<Lead>;
  }

  const assign = (leadId: string, body: unknown, token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api/admin/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    });

  const assignments = async (leadId: string) =>
    (await payload.find({ collection: "lead-activities", where: { lead: { equals: leadId }, type: { equals: "assignment" } }, overrideAccess: true, depth: 0, sort: "createdAt", pagination: false })).docs;
  const audits = async (leadId: string) =>
    (await payload.find({ collection: "audit-logs", where: { action: { equals: "lead.assign" }, docId: { equals: leadId } }, overrideAccess: true, depth: 0, pagination: false })).docs;
  const emailJobs = async (leadId: string) =>
    (await payload.find({ collection: "payload-jobs", where: { taskSlug: { equals: "send-notification-email" } }, overrideAccess: true, pagination: false })).docs.filter((job) =>
      JSON.stringify(job.input).includes(leadId),
    );
  const snapshot = async (leadId: string) => ({ activities: (await assignments(leadId)).length, audits: (await audits(leadId)).length, jobs: (await emailJobs(leadId)).length });

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
    admin = await createStaff("admin", ROLES.admin);
    saleA = await createStaff("salea", ROLES.sale);
    saleB = await createStaff("saleb", ROLES.sale);
    lockedSale = await createStaff("locked", ROLES.sale, false);
    tokens = { admin: await login("admin"), saleA: await login("salea") };
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

  describe("endpoint", () => {
    it("admin giao lead chưa có người phụ trách: 200, đúng 1 activity + 1 job email + 1 audit, có assignedAt", async () => {
      const lead = await createLead();
      expect(await snapshot(lead.id)).toEqual({ activities: 0, audits: 0, jobs: 0 });
      const response = await assign(lead.id, { staffId: saleA.id }, tokens.admin);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({ success: true, data: { id: lead.id, assignedTo: saleA.id, changed: true } });
      expect(body.data.assignedAt).toBeTruthy();

      const [activity, ...rest] = await assignments(lead.id);
      expect(rest).toHaveLength(0);
      expect(activity).toMatchObject({ type: "assignment", fromAssignee: null, toAssignee: saleA.id, actor: admin.id });
      const [audit, ...moreAudits] = await audits(lead.id);
      expect(moreAudits).toHaveLength(0);
      expect(audit).toMatchObject({ action: "lead.assign", collection: "leads", actor: admin.id, meta: { fromAssignee: null, toAssignee: saleA.id } });
      expect(JSON.stringify(audit)).not.toContain(lead.phone);
      const jobs = await emailJobs(lead.id);
      expect(jobs).toHaveLength(1);
      expect(jobs[0]!.input).toMatchObject({
        template: "lead-assigned",
        to: [saleA.email],
        data: { leadName: "Khách Hàng", phone: lead.phone, assignedToName: saleA.fullName, language: "en" },
      });
      const saved = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0 });
      expect(saved.assignedAt).toBe(body.data.assignedAt);
      expect(saved.lastActivityAt).toBeTruthy();
    });

    it("giao lại sang sale khác: activity from/to, thêm 1 job + 1 audit; giao cho đúng người đang phụ trách thì không sinh gì", async () => {
      const lead = await createLead();
      await assign(lead.id, { staffId: saleA.id }, tokens.admin);
      const reassigned = await assign(lead.id, { staffId: saleB.id }, tokens.admin);
      expect((await reassigned.json()).data).toMatchObject({ assignedTo: saleB.id, changed: true });
      expect((await assignments(lead.id))[1]).toMatchObject({ fromAssignee: saleA.id, toAssignee: saleB.id });
      expect(await snapshot(lead.id)).toEqual({ activities: 2, audits: 2, jobs: 2 });

      const same = await assign(lead.id, { staffId: saleB.id }, tokens.admin);
      expect(same.status).toBe(200);
      expect((await same.json()).data).toMatchObject({ assignedTo: saleB.id, changed: false });
      expect(await snapshot(lead.id)).toEqual({ activities: 2, audits: 2, jobs: 2 });
    });

    it("thứ tự lỗi: không token 401, sale 403 (kể cả id lạ), id sai dạng 400, không có lead 404, staffId sai/không phải sale/bị khoá 400", async () => {
      const lead = await createLead(saleB.id);
      const before = await snapshot(lead.id);
      expect((await assign(lead.id, { staffId: saleA.id })).status).toBe(401);
      expect((await assign(lead.id, { staffId: saleA.id }, tokens.saleA)).status).toBe(403);
      expect((await assign(RANDOM_UUID, { staffId: saleA.id }, tokens.saleA)).status).toBe(403);
      expect((await assign("khong-phai-uuid", { staffId: saleA.id }, tokens.admin)).status).toBe(400);
      expect((await assign(RANDOM_UUID, { staffId: saleA.id }, tokens.admin)).status).toBe(404);
      const badBodies = [{ staffId: admin.id }, { staffId: lockedSale.id }, { staffId: RANDOM_UUID }, { staffId: "abc" }, {}, "khong phai JSON"];
      for (const body of badBodies) {
        expect((await assign(lead.id, body, tokens.admin)).status, JSON.stringify(body)).toBe(400);
      }
      const saved = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0 });
      expect(saved.assignedTo).toBe(saleB.id);
      expect(await snapshot(lead.id)).toEqual(before);
    });

    it("lead đã xoá mềm: 404, không giao được", async () => {
      const lead = await createLead();
      await payload.update({ collection: "leads", id: lead.id, data: { deletedAt: new Date().toISOString() }, overrideAccess: true, trash: true });
      expect((await assign(lead.id, { staffId: saleA.id }, tokens.admin)).status).toBe(404);
    });
  });

  describe("hook (nơi duy nhất)", () => {
    it("admin đổi assignedTo qua REST/form cho kết quả y hệt endpoint; lưu lại không đổi assignedTo thì không sinh gì", async () => {
      const lead = await createLead();
      const patch = (data: object) =>
        handleEndpoints({
          config: payload.config,
          request: new Request(`http://localhost/api/leads/${lead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `JWT ${tokens.admin}` },
            body: JSON.stringify(data),
          }),
        });
      const first = await patch({ assignedTo: saleA.id });
      expect(first.status).toBe(200);
      const [activity] = await assignments(lead.id);
      expect(activity).toMatchObject({ type: "assignment", fromAssignee: null, toAssignee: saleA.id, actor: admin.id });
      expect(await snapshot(lead.id)).toEqual({ activities: 1, audits: 1, jobs: 1 });
      expect((await emailJobs(lead.id))[0]!.input).toMatchObject({ template: "lead-assigned", to: [saleA.email] });

      expect((await patch({ assignedTo: saleA.id, fullName: "Tên mới" })).status).toBe(200);
      expect((await patch({ status: "contacted" })).status).toBe(200);
      expect(await snapshot(lead.id)).toEqual({ activities: 1, audits: 1, jobs: 1 });
    });

    it("assignedAt do hệ thống đặt: giá trị admin gửi kèm bị bỏ; không đổi người thì giữ nguyên", async () => {
      const lead = await createLead();
      const forged = "2001-01-01T00:00:00.000Z";
      const first = await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: saleA.id, assignedAt: forged }, depth: 0, ...actingAs(admin) });
      expect(first.assignedAt).toBeTruthy();
      expect(first.assignedAt).not.toBe(forged);
      const second = await payload.update({ collection: "leads", id: lead.id, data: { assignedAt: forged }, depth: 0, ...actingAs(admin) });
      expect(second.assignedAt).toBe(first.assignedAt);
    });

    it("sale không đổi được assignedTo (bị bỏ qua), không sinh activity/email/audit", async () => {
      const lead = await createLead(saleA.id);
      const before = await snapshot(lead.id);
      const updated = await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: saleB.id, status: "contacted" }, depth: 0, ...actingAs(saleA) });
      expect(updated.assignedTo).toBe(saleA.id);
      expect(await snapshot(lead.id)).toEqual(before);
    });

    it("bỏ giao (assignedTo = null): activity to=null + audit, không gửi email, xoá assignedAt", async () => {
      const lead = await createLead();
      await assign(lead.id, { staffId: saleA.id }, tokens.admin);
      await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: null }, depth: 0, ...actingAs(admin) });
      expect((await assignments(lead.id))[1]).toMatchObject({ fromAssignee: saleA.id, toAssignee: null, actor: admin.id });
      expect(await snapshot(lead.id)).toEqual({ activities: 2, audits: 2, jobs: 1 });
      const saved = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0 });
      expect(saved.assignedAt ?? null).toBeNull();
    });

    it("tự giao khi tạo (hệ thống, không có user): activity không actor + email + assignedAt, KHÔNG audit", async () => {
      const lead = await createLead(saleA.id);
      const [activity, ...rest] = await assignments(lead.id);
      expect(rest).toHaveLength(0);
      expect(activity).toMatchObject({ type: "assignment", fromAssignee: null, toAssignee: saleA.id });
      expect(activity!.actor ?? null).toBeNull();
      expect(await snapshot(lead.id)).toEqual({ activities: 1, audits: 0, jobs: 1 });
      const saved = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0 });
      expect(saved.assignedAt).toBeTruthy();
    });

    it("đổi assignedTo sang sale bị khoá hoặc admin (REST và Local API): 400, không sinh activity/email/audit, giữ người cũ", async () => {
      const lead = await createLead(saleA.id);
      const before = await snapshot(lead.id);
      for (const target of [lockedSale, admin]) {
        const response = await handleEndpoints({
          config: payload.config,
          request: new Request(`http://localhost/api/leads/${lead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `JWT ${tokens.admin}` },
            body: JSON.stringify({ assignedTo: target.id }),
          }),
        });
        expect(response.status).toBe(400);
        await expect(payload.update({ collection: "leads", id: lead.id, data: { assignedTo: target.id }, depth: 0, ...actingAs(admin) })).rejects.toMatchObject({ status: 400 });
      }
      await expect(createLead(lockedSale.id)).rejects.toMatchObject({ status: 400 });
      const saved = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true, depth: 0 });
      expect(saved.assignedTo).toBe(saleA.id);
      expect(await snapshot(lead.id)).toEqual(before);
    });

    it("lead đang gán sale đã khoá vẫn đổi status được (giá trị assignedTo không đổi); bỏ giao vẫn cho", async () => {
      const lead = await createLead();
      await payload.db.updateOne({ collection: "leads", id: lead.id, data: { assignedTo: lockedSale.id } });
      const before = await snapshot(lead.id);
      const updated = await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, depth: 0, ...actingAs(admin) });
      expect(updated.status).toBe("contacted");
      expect(updated.assignedTo).toBe(lockedSale.id);
      expect(await snapshot(lead.id)).toEqual(before);
      const released = await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: null }, depth: 0, ...actingAs(admin) });
      expect(released.assignedTo ?? null).toBeNull();
    });

    it("lead trong thùng rác: admin đổi assignedTo vẫn ghi activity nhưng không gửi email", async () => {
      const lead = await createLead();
      await payload.update({ collection: "leads", id: lead.id, data: { deletedAt: new Date().toISOString() }, overrideAccess: true, trash: true });
      await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: saleA.id }, depth: 0, trash: true, ...actingAs(admin) });
      expect((await snapshot(lead.id)).jobs).toBe(0);
    });

    it("tạo không có người phụ trách thì không sinh gì", async () => {
      const lead = await createLead();
      expect(await snapshot(lead.id)).toEqual({ activities: 0, audits: 0, jobs: 0 });
    });
  });

  describe("asSystemActivity an toàn khi chạy song song", () => {
    it("sửa status hàng loạt (nhiều lead cùng req): lead nào cũng có activity status_change", async () => {
      const leads = await Promise.all([createLead(), createLead(), createLead()]);
      const result = await payload.update({
        collection: "leads",
        where: { id: { in: leads.map((lead) => lead.id) } },
        data: { status: "contacted" },
        depth: 0,
        ...actingAs(admin),
      });
      expect(result.errors).toHaveLength(0);
      for (const lead of leads) {
        const found = await payload.find({
          collection: "lead-activities",
          where: { lead: { equals: lead.id }, type: { equals: "status_change" } },
          overrideAccess: true,
          depth: 0,
        });
        expect(found.totalDocs).toBe(1);
      }
    });
  });
});
