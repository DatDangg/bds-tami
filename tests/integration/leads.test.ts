import type { EventEmitter } from "node:events";
import pg from "pg";
import type { Payload, Where } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { Lead } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;
const PASSWORD = "Mat-khau-hop-le-123";

/** DB tạm riêng, chạy migration thật (kiểm luôn sequence + bảng). Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích. */
describe.skipIf(!baseUrl)("integration: leads + lead-activities (DB tạm, migration thật)", () => {
  const dbName = `tami_leads_${Date.now().toString(36)}`;
  const runId = Date.now().toString(36);
  let payload: Payload;
  let admin: Awaited<ReturnType<typeof createStaff>>;
  let saleA: Awaited<ReturnType<typeof createStaff>>;
  let saleB: Awaited<ReturnType<typeof createStaff>>;
  let lockedSale: Awaited<ReturnType<typeof createStaff>>;

  async function createStaff(label: string, role: (typeof ROLES)[keyof typeof ROLES], active = true) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password: PASSWORD, fullName: `Test ${label}`, role, active },
    });
  }
  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });
  const actingAs = (user: object) => ({ user: asUser(user), overrideAccess: false as const });

  let phoneSeed = 0;
  /** Lead như endpoint công khai tạo: Local API `overrideAccess` (create của collection là denyAll). */
  async function createLead(overrides: Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">> = {}) {
    phoneSeed += 1;
    return payload.create({
      collection: "leads",
      overrideAccess: true,
      data: {
        source: "contact",
        fullName: "Khách Hàng",
        phone: `09123${String(phoneSeed).padStart(5, "0")}`,
        locale: "vi",
        consentAt: new Date().toISOString(),
        consentVersion: "2026-10-test",
        assignedTo: saleA.id,
        ...overrides,
      } as never,
    }) as Promise<Lead>;
  }

  const activitiesOf = async (leadId: string) =>
    (await payload.find({ collection: "lead-activities", where: { lead: { equals: leadId } }, overrideAccess: true, sort: "createdAt", pagination: false })).docs;

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

  describe("trường hệ thống", () => {
    it("code LD-000001 lấy từ sequence, tăng dần; giá trị gửi lên bị bỏ qua", async () => {
      const first = await createLead({ code: "LD-999999" } as never);
      const second = await createLead();
      expect(first.code).toMatch(/^LD-\d{6}$/);
      expect(first.code).not.toBe("LD-999999");
      expect(Number(second.code.slice(3))).toBe(Number(first.code.slice(3)) + 1);
    });

    it("code chỉ đọc: admin và sale sửa đều không đổi", async () => {
      const lead = await createLead();
      for (const user of [admin, saleA]) {
        const updated = await payload.update({ collection: "leads", id: lead.id, data: { code: "LD-000000" } as never, ...actingAs(user) });
        expect(updated.code).toBe(lead.code);
      }
    });

    it("phoneNormalized suy ra từ phone (+84…); phone sai định dạng bị từ chối", async () => {
      const lead = await createLead({ phone: "0912 345 678" });
      expect(lead.phoneNormalized).toBe("+84912345678");
      await expect(createLead({ phone: "12345" })).rejects.toThrow();
      const edited = await payload.update({ collection: "leads", id: lead.id, data: { phone: "028 3822 1234" }, ...actingAs(admin) });
      expect(edited.phoneNormalized).toBe("+842838221234");
    });

    it("ẩn danh dùng giá trị thay thế cho cột NOT NULL, không NULL; số thật không còn ở phoneNormalized (G23)", async () => {
      const { ANONYMIZED_PLACEHOLDER } = await import("../../src/lib/leads/lead-values");
      const lead = await createLead({ email: "khach@example.test", message: "Cần tư vấn" });
      const anonymized = await payload.update({
        collection: "leads",
        id: lead.id,
        overrideAccess: true,
        data: { fullName: ANONYMIZED_PLACEHOLDER, phone: ANONYMIZED_PLACEHOLDER, email: null, message: null, anonymizedAt: new Date().toISOString() } as never,
      });
      expect(anonymized.phone).toBe(ANONYMIZED_PLACEHOLDER);
      expect(anonymized.phoneNormalized).toBe(ANONYMIZED_PLACEHOLDER);
      expect(anonymized.email).toBeNull();
    });

    it("lead đã ẩn danh: không sửa lại fullName/phone/email/message; ghi lại nguyên trạng vẫn được", async () => {
      const { ANONYMIZED_PLACEHOLDER } = await import("../../src/lib/leads/lead-values");
      const lead = await createLead({ email: "khach2@example.test", message: "Cần tư vấn" });
      await payload.update({
        collection: "leads",
        id: lead.id,
        overrideAccess: true,
        data: { fullName: ANONYMIZED_PLACEHOLDER, phone: ANONYMIZED_PLACEHOLDER, email: null, message: null, anonymizedAt: new Date().toISOString() } as never,
      });
      for (const data of [{ phone: "0912345678" }, { fullName: "Nguyễn Văn A" }, { email: "lai@example.test" }, { message: "Lại có" }]) {
        await expect(payload.update({ collection: "leads", id: lead.id, data, ...actingAs(admin) })).rejects.toMatchObject({ status: 400 });
      }
      const same = await payload.update({ collection: "leads", id: lead.id, data: { fullName: ANONYMIZED_PLACEHOLDER, email: null }, ...actingAs(admin) });
      expect(same.phoneNormalized).toBe(ANONYMIZED_PLACEHOLDER);
      expect(same.email ?? null).toBeNull();
    });

    it("ipHash không bao giờ trả ra qua API; userAgent chỉ admin đọc", async () => {
      const lead = await createLead({ ipHash: "abc", userAgent: "UA/1.0" } as never);
      const asAdmin = await payload.findByID({ collection: "leads", id: lead.id, ...actingAs(admin) });
      const asSale = await payload.findByID({ collection: "leads", id: lead.id, ...actingAs(saleA) });
      expect(asAdmin).not.toHaveProperty("ipHash");
      expect(asAdmin.userAgent).toBe("UA/1.0");
      expect(asSale).not.toHaveProperty("ipHash");
      expect(asSale).not.toHaveProperty("userAgent");
    });
  });

  describe("quyền theo người được giao (BR-32)", () => {
    it("không ai tạo lead qua REST/admin, kể cả admin", async () => {
      const data = { source: "contact", fullName: "X", phone: "0912345678", locale: "vi", consentAt: new Date().toISOString(), consentVersion: "v" } as never;
      await expect(payload.create({ collection: "leads", data, ...actingAs(admin) })).rejects.toMatchObject({ status: 403 });
      await expect(payload.create({ collection: "leads", data, ...actingAs(saleA) })).rejects.toMatchObject({ status: 403 });
    });

    it("sale A không thấy lead của sale B hay lead chưa giao: danh sách rỗng, findByID 404; admin thấy hết", async () => {
      const ofB = await createLead({ assignedTo: saleB.id });
      const unassigned = await createLead({ assignedTo: null });
      const own = await createLead({ assignedTo: saleA.id });
      const seenBySaleA = (await payload.find({ collection: "leads", limit: 200, ...actingAs(saleA) })).docs.map((doc) => doc.id);
      expect(seenBySaleA).toContain(own.id);
      expect(seenBySaleA).not.toContain(ofB.id);
      expect(seenBySaleA).not.toContain(unassigned.id);
      await expect(payload.findByID({ collection: "leads", id: ofB.id, ...actingAs(saleA) })).rejects.toMatchObject({ status: 404 });
      // Lọc theo SĐT của người khác cũng không dò ra được lead.
      const probe = await payload.find({ collection: "leads", where: { phoneNormalized: { equals: ofB.phoneNormalized } }, ...actingAs(saleA) });
      expect(probe.totalDocs).toBe(0);
      const seenByAdmin = (await payload.find({ collection: "leads", limit: 500, ...actingAs(admin) })).docs.map((doc) => doc.id);
      expect(seenByAdmin).toEqual(expect.arrayContaining([own.id, ofB.id, unassigned.id]));
    });

    it("sale không sửa được lead của người khác (Payload trả 403 cho update theo id; uuid không đoán được)", async () => {
      const ofB = await createLead({ assignedTo: saleB.id });
      await expect(payload.update({ collection: "leads", id: ofB.id, data: { status: "contacted" }, ...actingAs(saleA) })).rejects.toMatchObject({ status: 403 });
      expect((await payload.findByID({ collection: "leads", id: ofB.id, overrideAccess: true })).status).toBe("new");
    });

    it("sale đổi được status + lostReason; fullName/phone/email/message/locale/assignedTo/source bị chặn (giữ nguyên)", async () => {
      const lead = await createLead({ email: "goc@example.test", message: "Lời nhắn gốc", fullName: "Tên gốc" });
      const updated = await payload.update({
        collection: "leads",
        id: lead.id,
        ...actingAs(saleA),
        data: {
          status: "consulting",
          fullName: "Tên bị sửa",
          phone: "0999999999",
          email: "sua@example.test",
          message: "Bị sửa",
          locale: "en",
          assignedTo: saleB.id,
          source: "rental",
          phoneNormalized: "+84999999999",
          mergedCount: 99,
        } as never,
      });
      expect(updated.status).toBe("consulting");
      expect(updated).toMatchObject({
        fullName: "Tên gốc",
        phone: lead.phone,
        phoneNormalized: lead.phoneNormalized,
        email: "goc@example.test",
        message: "Lời nhắn gốc",
        locale: "vi",
        source: "contact",
        mergedCount: 0,
      });
      expect(typeof updated.assignedTo === "object" ? updated.assignedTo?.id : updated.assignedTo).toBe(saleA.id);
    });

    it("admin đổi được người phụ trách và dữ liệu khách", async () => {
      const lead = await createLead();
      const updated = await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: saleB.id, fullName: "Tên mới" }, depth: 0, ...actingAs(admin) });
      expect(updated.assignedTo).toBe(saleB.id);
      expect(updated.fullName).toBe("Tên mới");
    });

    it("sale không xoá (cả xoá hẳn lẫn xoá mềm); admin xoá mềm được và có audit", async () => {
      const lead = await createLead();
      await expect(payload.delete({ collection: "leads", id: lead.id, ...actingAs(saleA) })).rejects.toMatchObject({ status: 403 });
      await expect(
        payload.update({ collection: "leads", id: lead.id, data: { deletedAt: new Date().toISOString() } as never, trash: true, ...actingAs(saleA) }),
      ).rejects.toMatchObject({ status: 403 });
      await payload.update({ collection: "leads", id: lead.id, data: { deletedAt: new Date().toISOString() } as never, trash: true, ...actingAs(admin) });
      const logs = await payload.find({ collection: "audit-logs", where: { docId: { equals: lead.id }, action: { equals: "content.delete" } }, overrideAccess: true });
      expect(logs.totalDocs).toBe(1);
      expect(JSON.stringify(logs.docs)).not.toContain(lead.phone);
      // Bản đã xoá mềm: sale phụ trách không tự khôi phục được.
      await expect(
        payload.update({ collection: "leads", id: lead.id, data: { deletedAt: null } as never, trash: true, ...actingAs(saleA) }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it("admin xoá hẳn lead thì lịch sử đi theo (FK không chặn), có audit không chứa SĐT", async () => {
      const lead = await createLead();
      await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, ...actingAs(admin) });
      expect(await activitiesOf(lead.id)).toHaveLength(1);
      await payload.delete({ collection: "leads", id: lead.id, trash: true, ...actingAs(admin) });
      expect(await activitiesOf(lead.id)).toHaveLength(0);
      const logs = await payload.find({ collection: "audit-logs", where: { docId: { equals: lead.id }, action: { equals: "content.purge" } }, overrideAccess: true });
      expect(logs.totalDocs).toBe(1);
      expect(JSON.stringify(logs.docs)).not.toContain(lead.phone);
    });
  });

  describe("trạng thái (BR-11)", () => {
    it("chuyển lost thiếu lý do (hoặc chỉ khoảng trắng) bị từ chối; có lý do thì được", async () => {
      const lead = await createLead();
      await expect(payload.update({ collection: "leads", id: lead.id, data: { status: "lost" }, ...actingAs(saleA) })).rejects.toMatchObject({ status: 400 });
      await expect(payload.update({ collection: "leads", id: lead.id, data: { status: "lost", lostReason: "   " }, ...actingAs(saleA) })).rejects.toMatchObject({ status: 400 });
      expect((await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true })).status).toBe("new");
      const lost = await payload.update({ collection: "leads", id: lead.id, data: { status: "lost", lostReason: "Khách đã thuê nơi khác" }, ...actingAs(saleA) });
      expect(lost.status).toBe("lost");
    });

    it("chỉ nhận 6 trạng thái của BR-11", async () => {
      const lead = await createLead();
      await expect(payload.update({ collection: "leads", id: lead.id, data: { status: "closed" } as never, ...actingAs(saleA) })).rejects.toMatchObject({ status: 400 });
    });

    it("đổi status sinh đúng 1 activity status_change (từ/đến, người đổi); lưu lại không đổi status thì không sinh thêm", async () => {
      const lead = await createLead();
      await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, ...actingAs(saleA) });
      let activities = await activitiesOf(lead.id);
      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({ type: "status_change", fromStatus: "new", toStatus: "contacted" });
      const actor = activities[0]!.actor;
      expect(typeof actor === "object" ? actor?.id : actor).toBe(saleA.id);

      await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, ...actingAs(saleA) });
      await payload.update({ collection: "leads", id: lead.id, data: { fullName: "Đổi tên" }, ...actingAs(admin) });
      expect(await activitiesOf(lead.id)).toHaveLength(1);

      await payload.update({ collection: "leads", id: lead.id, data: { status: "lost", lostReason: "Quá giá" }, ...actingAs(saleA) });
      activities = await activitiesOf(lead.id);
      expect(activities).toHaveLength(2);
      expect(activities[1]).toMatchObject({ fromStatus: "contacted", toStatus: "lost", content: "Quá giá" });
    });

    it("firstContactedAt đặt lần đầu rời new và giữ nguyên các lần sau; lastActivityAt đặt khi tạo và khi đổi status", async () => {
      const lead = await createLead();
      expect(lead.firstContactedAt ?? null).toBeNull();
      expect(lead.lastActivityAt).toBeTruthy();
      const first = await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, ...actingAs(saleA) });
      expect(first.firstContactedAt).toBeTruthy();
      expect(new Date(first.lastActivityAt!).getTime()).toBeGreaterThanOrEqual(new Date(lead.lastActivityAt!).getTime());
      await new Promise((resolve) => setTimeout(resolve, 20));
      const back = await payload.update({ collection: "leads", id: lead.id, data: { status: "new" }, ...actingAs(saleA) });
      const again = await payload.update({ collection: "leads", id: lead.id, data: { status: "consulting" }, ...actingAs(saleA) });
      expect(back.firstContactedAt).toBe(first.firstContactedAt);
      expect(again.firstContactedAt).toBe(first.firstContactedAt);
    });

    it("sale không tự đặt firstContactedAt/lastActivityAt", async () => {
      const lead = await createLead();
      const updated = await payload.update({
        collection: "leads",
        id: lead.id,
        data: { firstContactedAt: "2000-01-01T00:00:00.000Z", lastActivityAt: "2000-01-01T00:00:00.000Z" } as never,
        ...actingAs(saleA),
      });
      expect(updated.firstContactedAt ?? null).toBeNull();
      expect(updated.lastActivityAt).toBe(lead.lastActivityAt);
    });
  });

  describe("lead-activities (chỉ thêm)", () => {
    it("sale thêm note/call trên lead được giao; actor luôn là người thao tác, createdAt do hệ thống, lead.lastActivityAt cập nhật", async () => {
      const lead = await createLead({ assignedTo: saleA.id });
      await new Promise((resolve) => setTimeout(resolve, 20));
      const note = await payload.create({
        collection: "lead-activities",
        depth: 0,
        ...actingAs(saleA),
        data: { lead: lead.id, type: "note", content: "Đã gọi, hẹn xem nhà", actor: admin.id, createdAt: "2000-01-01T00:00:00.000Z" } as never,
      });
      expect(note.actor).toBe(saleA.id);
      expect(new Date(note.createdAt).getFullYear()).toBeGreaterThan(2020);
      const call = await payload.create({
        collection: "lead-activities",
        depth: 0,
        ...actingAs(saleA),
        data: { lead: lead.id, type: "call", content: "Gọi 5 phút" },
      });
      expect(call.type).toBe("call");
      const refreshed = await payload.findByID({ collection: "leads", id: lead.id, overrideAccess: true });
      expect(new Date(refreshed.lastActivityAt!).getTime()).toBeGreaterThan(new Date(lead.lastActivityAt!).getTime());
    });

    it("sale không thêm cho lead của người khác / lead chưa giao / id không tồn tại", async () => {
      const ofB = await createLead({ assignedTo: saleB.id });
      const unassigned = await createLead({ assignedTo: null });
      for (const leadId of [ofB.id, unassigned.id, "00000000-0000-4000-8000-000000000000"]) {
        await expect(
          payload.create({ collection: "lead-activities", data: { lead: leadId, type: "note", content: "x" }, ...actingAs(saleA) }),
        ).rejects.toMatchObject({ status: 403 });
      }
      expect(await activitiesOf(ofB.id)).toHaveLength(0);
    });

    it("loại hệ thống (status_change/assignment/merged/email_sent) không ai thêm tay được; note thiếu nội dung bị từ chối", async () => {
      const lead = await createLead();
      for (const type of ["status_change", "assignment", "merged", "email_sent"]) {
        for (const user of [saleA, admin]) {
          await expect(
            payload.create({ collection: "lead-activities", data: { lead: lead.id, type, content: "giả mạo" } as never, ...actingAs(user) }),
          ).rejects.toMatchObject({ status: 403 });
        }
      }
      await expect(
        payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: " " }, ...actingAs(admin) }),
      ).rejects.toMatchObject({ status: 400 });
      const byAdmin = await payload.create({ collection: "lead-activities", depth: 0, data: { lead: lead.id, type: "note", content: "Admin ghi chú" }, ...actingAs(admin) });
      expect(byAdmin.actor).toBe(admin.id);
    });

    it("quyền tính cho admin UI (access không kèm dữ liệu form): staff active có quyền create, khách/khoá thì không", async () => {
      const { createLocalReq, getAccessResults } = await import("payload");
      const createPermission = async (user: object) => {
        const req = await createLocalReq({ user: asUser(user) as never }, payload);
        const results = await getAccessResults({ req });
        return results.collections?.["lead-activities"]?.create;
      };
      expect(await createPermission(saleA)).toBe(true);
      expect(await createPermission(admin)).toBe(true);
      expect(await createPermission(lockedSale)).toBeFalsy();
    });

    it("form admin chỉ liệt kê note/call cho trường type; hệ thống vẫn ghi được status_change", async () => {
      const { LeadActivities } = await import("../../src/collections/LeadActivities");
      const typeField = LeadActivities.fields.find((field) => "name" in field && field.name === "type") as unknown as {
        filterOptions: (args: { options: { value: string }[]; req: never }) => { value: string }[];
      };
      const all = ["note", "call", "status_change", "assignment", "merged", "email_sent"].map((value) => ({ value }));
      expect(typeField.filterOptions({ options: all, req: { context: {} } as never }).map((option) => option.value)).toEqual(["note", "call"]);
      const lead = await createLead({ assignedTo: saleA.id });
      await payload.update({ collection: "leads", id: lead.id, data: { status: "contacted" }, ...actingAs(saleA) });
      expect((await activitiesOf(lead.id)).map((activity) => activity.type)).toEqual(["status_change"]);
    });

    it("không sửa, không xoá, kể cả admin; sale xoá activity -> 403", async () => {
      const lead = await createLead();
      const note = await payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: "Bản gốc" }, ...actingAs(saleA) });
      for (const user of [saleA, admin]) {
        await expect(payload.delete({ collection: "lead-activities", id: note.id, ...actingAs(user) })).rejects.toMatchObject({ status: 403 });
        await expect(payload.update({ collection: "lead-activities", id: note.id, data: { content: "Đã sửa" }, ...actingAs(user) })).rejects.toMatchObject({ status: 403 });
      }
      expect((await payload.findByID({ collection: "lead-activities", id: note.id, overrideAccess: true })).content).toBe("Bản gốc");
    });

    it("sale chỉ đọc hoạt động của lead mình; sale khác thấy rỗng; admin thấy hết", async () => {
      const lead = await createLead({ assignedTo: saleA.id });
      await payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: "Riêng tư" }, ...actingAs(saleA) });
      const query = { collection: "lead-activities" as const, where: { lead: { equals: lead.id } } };
      expect((await payload.find({ ...query, ...actingAs(saleA) })).totalDocs).toBe(1);
      expect((await payload.find({ ...query, ...actingAs(saleB) })).totalDocs).toBe(0);
      expect((await payload.find({ ...query, ...actingAs(admin) })).totalDocs).toBe(1);
      const all = await payload.find({ collection: "lead-activities", limit: 500, ...actingAs(saleB) });
      expect(all.docs.every((doc) => doc.lead !== lead.id)).toBe(true);
    });

    it("lead đổi người phụ trách thì sale cũ mất quyền đọc lịch sử", async () => {
      const lead = await createLead({ assignedTo: saleA.id });
      await payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: "n" }, ...actingAs(saleA) });
      await payload.update({ collection: "leads", id: lead.id, data: { assignedTo: saleB.id }, ...actingAs(admin) });
      expect((await payload.find({ collection: "lead-activities", where: { lead: { equals: lead.id } }, ...actingAs(saleA) })).totalDocs).toBe(0);
      expect((await payload.find({ collection: "lead-activities", where: { lead: { equals: lead.id } }, ...actingAs(saleB) })).totalDocs).toBe(1);
    });

    it("tài khoản sale bị khoá mất mọi quyền", async () => {
      const lead = await createLead({ assignedTo: lockedSale.id });
      await expect(payload.find({ collection: "leads", ...actingAs(lockedSale) })).rejects.toMatchObject({ status: 403 });
      await expect(
        payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: "x" }, ...actingAs(lockedSale) }),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe("danh sách admin", () => {
    it("lọc theo trạng thái / nguồn / sale / thời gian", async () => {
      const marker = await createLead({ source: "project", assignedTo: saleB.id });
      await payload.update({ collection: "leads", id: marker.id, data: { status: "spam" }, ...actingAs(admin) });
      const find = (where: Where) => payload.find({ collection: "leads", where, limit: 500, depth: 0, ...actingAs(admin) });
      const byStatus = (await find({ status: { equals: "spam" } })).docs.map((doc) => doc.id);
      const bySource = (await find({ source: { equals: "project" } })).docs.map((doc) => doc.id);
      const bySale = (await find({ assignedTo: { equals: saleB.id } })).docs.map((doc) => doc.id);
      const byTime = (await find({ createdAt: { greater_than_equal: marker.createdAt, less_than_equal: marker.createdAt } })).docs.map((doc) => doc.id);
      for (const ids of [byStatus, bySource, bySale, byTime]) expect(ids).toContain(marker.id);
      expect((await find({ status: { equals: "won" } })).docs.map((doc) => doc.id)).not.toContain(marker.id);
    });

    it("lead có sale đã khoá: admin thấy cờ assigneeInactive; sale còn hoạt động / chưa giao thì không", async () => {
      const flagged = await createLead({ assignedTo: lockedSale.id });
      const healthy = await createLead({ assignedTo: saleA.id });
      const unassigned = await createLead({ assignedTo: null });
      for (const depth of [0, 1]) {
        const read = (id: string) => payload.findByID({ collection: "leads", id, depth, ...actingAs(admin) });
        expect((await read(flagged.id)).assigneeInactive).toBe(true);
        expect((await read(healthy.id)).assigneeInactive).toBe(false);
        expect((await read(unassigned.id)).assigneeInactive).toBe(false);
      }
      const asSale = await payload.findByID({ collection: "leads", id: healthy.id, ...actingAs(saleA) });
      expect(asSale).not.toHaveProperty("assigneeInactive");
    });

    it("trang lead có sẵn lịch sử (join activities), sale phụ trách thấy được", async () => {
      const lead = await createLead({ assignedTo: saleA.id });
      await payload.create({ collection: "lead-activities", data: { lead: lead.id, type: "note", content: "Có trong join" }, ...actingAs(saleA) });
      const read = await payload.findByID({ collection: "leads", id: lead.id, depth: 1, ...actingAs(saleA) });
      const joined = (read.activities as { docs?: { content?: string }[] } | undefined)?.docs ?? [];
      expect(joined.map((doc) => doc.content)).toContain("Có trong join");
    });
  });
});
