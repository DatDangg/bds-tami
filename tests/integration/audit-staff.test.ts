import type { EventEmitter } from "node:events";
import pg from "pg";
import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { AuditLog } from "../../src/payload-types";

const baseUrl = process.env.DATABASE_URL_TEST;

/**
 * Cần DB RIÊNG: luật "còn ít nhất 1 admin" chỉ kiểm được khi biết chắc số admin hiện có, mà DB test dùng chung
 * có admin do file test khác tạo song song. Nên file này tạo database tạm, chạy migration rồi xoá khi xong.
 */
describe.skipIf(!baseUrl)("integration: audit-logs + quản lý tài khoản (DB tạm)", () => {
  const runId = Date.now().toString(36);
  const dbName = `tami_audit_${runId}`;
  const password = "Mat-khau-hop-le-123";
  const clientIp = "203.0.113.9";
  let payload: Payload;
  let ipHash: (ip: string) => string;
  let adminA: Awaited<ReturnType<typeof createStaff>>;

  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  function createStaff(label: string, role: "admin" | "sale", active = true) {
    return payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `${label}-${runId}@example.test`, password, fullName: `Test ${label}`, role, active },
    });
  }

  /** Xoá thẳng DB (bỏ qua hook) để dọn fixture mà không bị luật admin cuối cùng chặn. */
  async function removeStaff(id: string) {
    await payload.db.deleteOne({ collection: "staff", where: { id: { equals: id } } });
  }

  /** ValidationError của Payload có message chung; nội dung riêng nằm ở `data.errors`. */
  async function expectLastAdminError(operation: Promise<unknown>) {
    const error = await operation.then(
      () => null,
      (thrown: unknown) => thrown as { name?: string; data?: { errors?: { message: string }[] } },
    );
    expect(error?.name).toBe("ValidationError");
    expect(error?.data?.errors?.[0]?.message).toMatch(/ít nhất một quản trị viên/);
  }

  async function auditsFor(docId: string): Promise<AuditLog[]> {
    const result = await payload.find({
      collection: "audit-logs",
      where: { docId: { equals: docId } },
      sort: "createdAt",
      overrideAccess: true,
      limit: 100,
    });
    return result.docs;
  }

  async function rest(path: string, init: { method: string; token?: string; body?: unknown; headers?: Record<string, string> }) {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...init.headers };
    if (init.token) headers.Authorization = `JWT ${init.token}`;
    return handleEndpoints({
      config: payload.config,
      request: new Request(`http://localhost/api${path}`, {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      }),
    });
  }

  async function tokenOf(email: string): Promise<string> {
    const result = await payload.login({ collection: "staff", data: { email, password } });
    return result.token as string;
  }

  beforeAll(async () => {
    const adminUrl = new URL(baseUrl!);
    const connection = new pg.Client({ connectionString: adminUrl.toString() });
    await connection.connect();
    try {
      await connection.query(`CREATE DATABASE "${dbName}"`);
    } finally {
      await connection.end();
    }
    const testUrl = new URL(baseUrl!);
    testUrl.pathname = `/${dbName}`;
    process.env.DATABASE_URL = testUrl.toString();
    process.env.TRUST_CF_CONNECTING_IP = "true";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    ({ ipHash } = await import("../../src/lib/security/ip-hash"));
    payload = await getPayload({ config });
    const { migrations } = await import("../../migrations");
    await payload.db.migrate({ migrations: migrations as NonNullable<Parameters<typeof payload.db.migrate>[0]>["migrations"] });
    adminA = await createStaff("admin-a", ROLES.admin);
  }, 120_000);

  afterAll(async () => {
    // Adapter Postgres của Payload giữ một client không bao giờ trả về pool nên `destroy()` không đóng nó; khi
    // `DROP DATABASE ... FORCE` cắt client đó, lỗi "terminating connection" sẽ thành uncaught exception.
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

  describe("audit-logs: chỉ thêm, chỉ admin đọc", () => {
    it("admin đọc được, sale không; không ai tạo/sửa/xoá được qua REST, kể cả admin (403)", async () => {
      const sale = await createStaff("sale-acl", ROLES.sale);
      const [adminToken, saleToken] = [await tokenOf(adminA.email), await tokenOf(sale.email)];
      const seed = (await auditsFor(sale.id))[0]!;

      expect((await rest("/audit-logs", { method: "GET", token: adminToken })).status).toBe(200);
      expect((await rest(`/audit-logs/${seed.id}`, { method: "GET", token: adminToken })).status).toBe(200);
      expect((await rest("/audit-logs", { method: "GET", token: saleToken })).status).toBe(403);
      expect((await rest(`/audit-logs/${seed.id}`, { method: "GET", token: saleToken })).status).toBe(403);

      for (const token of [adminToken, saleToken]) {
        const update = await rest(`/audit-logs/${seed.id}`, { method: "PATCH", token, body: { summary: "bị sửa" } });
        const remove = await rest(`/audit-logs/${seed.id}`, { method: "DELETE", token });
        const create = await rest("/audit-logs", {
          method: "POST",
          token,
          body: { action: "staff.create", summary: "giả mạo" },
        });
        expect([update.status, remove.status, create.status]).toEqual([403, 403, 403]);
      }
      const after = await payload.findByID({ collection: "audit-logs", id: seed.id, overrideAccess: true });
      expect(after.summary).toBe(seed.summary);
      await removeStaff(sale.id);
    });

    it("Local API có overrideAccess: false cũng bị chặn sửa/xoá với admin", async () => {
      const seed = (await auditsFor(adminA.id))[0]!;
      await expect(
        payload.update({ collection: "audit-logs", id: seed.id, data: { summary: "x" }, user: asUser(adminA), overrideAccess: false }),
      ).rejects.toThrow();
      await expect(
        payload.delete({ collection: "audit-logs", id: seed.id, user: asUser(adminA), overrideAccess: false }),
      ).rejects.toThrow();
    });
  });

  describe("mỗi thao tác tài khoản ghi đúng 1 bản audit, không lộ mật khẩu", () => {
    it("admin tạo sale: 1 bản staff.create, có actor và ipHash, meta sạch", async () => {
      const created = await payload.create({
        collection: "staff",
        data: { email: `created-${runId}@example.test`, password, fullName: "Mới", role: ROLES.sale, active: true },
        user: asUser(adminA),
        overrideAccess: false,
        req: { headers: new Headers({ "cf-connecting-ip": clientIp }) } as never,
      });
      const logs = await auditsFor(created.id);
      expect(logs).toHaveLength(1);
      const [log] = logs;
      expect(log).toMatchObject({ action: "staff.create", collection: "staff", docId: created.id });
      expect(typeof log!.actor === "object" ? log!.actor?.id : log!.actor).toBe(adminA.id);
      expect(log!.ipHash).toBe(ipHash(clientIp));
      expect(JSON.stringify(log)).not.toContain(password);
      await removeStaff(created.id);
    });

    it("sale không tạo được tài khoản và không để lại audit", async () => {
      const sale = await createStaff("sale-noadmin", ROLES.sale);
      const before = await payload.count({ collection: "audit-logs", overrideAccess: true });
      await expect(
        payload.create({
          collection: "staff",
          data: { email: `x-${runId}@example.test`, password, fullName: "X", role: ROLES.sale, active: true },
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
      expect((await payload.count({ collection: "audit-logs", overrideAccess: true })).totalDocs).toBe(before.totalDocs);
      await removeStaff(sale.id);
    });

    it("đổi vai trò, khoá, mở khoá: mỗi việc 1 bản; sửa hồ sơ thường không ghi", async () => {
      const target = await createStaff("target", ROLES.sale);
      const baseline = (await auditsFor(target.id)).length; // staff.create
      const update = (data: Record<string, unknown>) =>
        payload.update({ collection: "staff", id: target.id, data, user: asUser(adminA), overrideAccess: false });

      await update({ fullName: "Tên mới", phone: "0900000000" });
      expect(await auditsFor(target.id)).toHaveLength(baseline);

      await update({ role: ROLES.admin });
      await update({ active: false });
      await update({ active: true });
      await update({ role: ROLES.sale });
      const actions = (await auditsFor(target.id)).map((log) => log.action);
      expect(actions).toEqual(["staff.create", "staff.update_role", "staff.deactivate", "staff.activate", "staff.update_role"]);
      const roleLog = (await auditsFor(target.id))[1]!;
      expect(roleLog.meta).toEqual({ from: "sale", to: "admin" });
      await removeStaff(target.id);
    });

    it("đổi vai trò và khoá trong cùng một lần sửa: mỗi sự kiện một bản", async () => {
      const target = await createStaff("both", ROLES.admin);
      await payload.update({
        collection: "staff",
        id: target.id,
        data: { role: ROLES.sale, active: false },
        user: asUser(adminA),
        overrideAccess: false,
      });
      const actions = (await auditsFor(target.id)).map((log) => log.action).sort();
      expect(actions).toEqual(["staff.create", "staff.deactivate", "staff.update_role"].sort());
      await removeStaff(target.id);
    });

    it("admin đặt lại mật khẩu: 1 bản staff.reset_password, không chứa mật khẩu mới", async () => {
      const target = await createStaff("reset-target", ROLES.sale);
      const newPassword = "Mat-khau-moi-xyz-987";
      await payload.update({
        collection: "staff",
        id: target.id,
        data: { password: newPassword },
        user: asUser(adminA),
        overrideAccess: false,
      });
      const resets = (await auditsFor(target.id)).filter((log) => log.action === "staff.reset_password");
      expect(resets).toHaveLength(1);
      expect(resets[0]!.meta).toEqual({ via: "admin" });
      expect(JSON.stringify(resets[0])).not.toContain(newPassword);
      await removeStaff(target.id);
    });

    it("sale không đặt lại được mật khẩu người khác; tự đổi mật khẩu của mình thì có ghi (via self)", async () => {
      const sale = await createStaff("sale-pw", ROLES.sale);
      const other = await createStaff("sale-pw-other", ROLES.sale);
      await expect(
        payload.update({ collection: "staff", id: other.id, data: { password: "Mat-khau-lach-1234" }, user: asUser(sale), overrideAccess: false }),
      ).rejects.toThrow();
      expect((await auditsFor(other.id)).filter((log) => log.action === "staff.reset_password")).toHaveLength(0);

      await payload.update({ collection: "staff", id: sale.id, data: { password: "Mat-khau-tu-doi-1234" }, user: asUser(sale), overrideAccess: false });
      const own = (await auditsFor(sale.id)).filter((log) => log.action === "staff.reset_password");
      expect(own).toHaveLength(1);
      expect(own[0]!.meta).toEqual({ via: "self" });
      await removeStaff(sale.id);
      await removeStaff(other.id);
    });

    it("đặt lại mật khẩu bằng token (REST): 1 bản staff.reset_password, không actor", async () => {
      const target = await createStaff("token-reset", ROLES.sale);
      const token = await payload.forgotPassword({ collection: "staff", data: { email: target.email }, disableEmail: true });
      const response = await rest("/staff/reset-password", { method: "POST", body: { token, password: "Mat-khau-bang-token-1" } });
      expect(response.status).toBe(200);
      const resets = (await auditsFor(target.id)).filter((log) => log.action === "staff.reset_password");
      expect(resets).toHaveLength(1);
      expect(resets[0]!.actor).toBeFalsy();
      expect(resets[0]!.meta).toEqual({ via: "email_token" });
      expect(JSON.stringify(resets[0])).not.toContain(token);
      await removeStaff(target.id);
    });

    it("xoá tài khoản: 1 bản staff.delete", async () => {
      const target = await createStaff("to-delete", ROLES.sale);
      await payload.delete({ collection: "staff", id: target.id, user: asUser(adminA), overrideAccess: false });
      const deletes = (await auditsFor(target.id)).filter((log) => log.action === "staff.delete");
      expect(deletes).toHaveLength(1);
    });
  });

  describe("auth.login_failed", () => {
    function login(email: string, pass: string, ip = clientIp) {
      return rest("/staff/login", {
        method: "POST",
        body: { email, password: pass },
        headers: { "cf-connecting-ip": ip },
      });
    }

    it("đăng nhập sai mật khẩu: vẫn 401 cho khách, ghi 1 bản có ipHash + email, không có mật khẩu", async () => {
      const target = await createStaff("login-fail", ROLES.sale);
      const attempt = "Sai-mat-khau-dac-biet-777";
      const response = await login(target.email, attempt);
      expect(response.status).toBe(401);
      const logs = await auditsFor(target.id);
      const failed = logs.filter((log) => log.action === "auth.login_failed");
      expect(failed).toHaveLength(1);
      expect(failed[0]!.ipHash).toBe(ipHash(clientIp));
      expect(failed[0]!.meta).toEqual({ email: target.email.toLowerCase(), reason: "invalid_credentials" });
      expect(JSON.stringify(failed[0])).not.toContain(attempt);
      await removeStaff(target.id);
    });

    it("email không tồn tại: vẫn ghi (không có docId); mật khẩu gõ nhầm vào ô email không bị lưu", async () => {
      const marker = `unknown-${runId}@example.test`;
      expect((await login(marker, "x-sai-mat-khau-1")).status).toBe(401);
      const typo = "Mat-khau-go-nham-vao-o-email";
      expect((await login(typo, "x-sai-mat-khau-2")).status).toBe(401);
      const logs = await payload.find({
        collection: "audit-logs",
        where: { action: { equals: "auth.login_failed" } },
        overrideAccess: true,
        limit: 100,
      });
      const unknown = logs.docs.find((log) => (log.meta as { email?: string } | null)?.email === marker);
      expect(unknown).toBeTruthy();
      expect(unknown!.docId).toBeFalsy();
      expect(JSON.stringify(logs.docs)).not.toContain(typo);
    });

    it("đăng nhập đúng không ghi login_failed", async () => {
      const target = await createStaff("login-ok", ROLES.sale);
      expect((await login(target.email, password)).status).toBe(200);
      expect((await auditsFor(target.id)).filter((log) => log.action === "auth.login_failed")).toHaveLength(0);
      await removeStaff(target.id);
    });

    it("ghi audit hỏng không đổi phản hồi đăng nhập (vẫn 401, không 500)", async () => {
      const target = await createStaff("login-failopen", ROLES.sale);
      const original = payload.create.bind(payload);
      (payload as { create: unknown }).create = (args: { collection: string }) =>
        args.collection === "audit-logs" ? Promise.reject(new Error("audit down")) : original(args as never);
      try {
        expect((await login(target.email, "x-sai-mat-khau-3")).status).toBe(401);
      } finally {
        (payload as { create: unknown }).create = original;
      }
      await removeStaff(target.id);
    });
  });

  describe("fail-closed: audit hỏng thì thao tác chính rollback", () => {
    it("tạo tài khoản không còn khi ghi audit lỗi", async () => {
      const original = payload.create.bind(payload);
      (payload as { create: unknown }).create = (args: { collection: string }) =>
        args.collection === "audit-logs" ? Promise.reject(new Error("audit down")) : original(args as never);
      const email = `rollback-${runId}@example.test`;
      try {
        await expect(
          original({ collection: "staff", overrideAccess: true, data: { email, password, fullName: "R", role: ROLES.sale, active: true } }),
        ).rejects.toThrow("audit down");
      } finally {
        (payload as { create: unknown }).create = original;
      }
      const found = await payload.count({ collection: "staff", where: { email: { equals: email } }, overrideAccess: true });
      expect(found.totalDocs).toBe(0);
    });
  });

  // Các test dưới đây dựa vào việc `adminA` là admin đang hoạt động DUY NHẤT: mọi test trên đã dọn fixture.
  describe("luôn còn ít nhất 1 admin active", () => {
    it("tiền đề: adminA là admin active duy nhất", async () => {
      const admins = await payload.count({
        collection: "staff",
        where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
        overrideAccess: true,
      });
      expect(admins.totalDocs).toBe(1);
    });

    it("chặn khoá admin cuối cùng (ValidationError) và không để lại audit staff.deactivate", async () => {
      const inactiveAdmin = await createStaff("admin-inactive", ROLES.admin, false); // admin đã khoá không tính
      await expectLastAdminError(
        payload.update({ collection: "staff", id: adminA.id, data: { active: false }, user: asUser(adminA), overrideAccess: false }),
      );
      const after = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect(after.active).toBe(true);
      expect((await auditsFor(adminA.id)).some((log) => log.action === "staff.deactivate")).toBe(false);
      await removeStaff(inactiveAdmin.id);
    });

    it("chặn hạ quyền admin cuối cùng, kể cả khi admin tự hạ mình", async () => {
      await expectLastAdminError(
        payload.update({ collection: "staff", id: adminA.id, data: { role: ROLES.sale }, user: asUser(adminA), overrideAccess: false }),
      );
      const after = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect(after.role).toBe(ROLES.admin);
      expect((await auditsFor(adminA.id)).some((log) => log.action === "staff.update_role")).toBe(false);
    });

    it("chặn xoá admin cuối cùng, kể cả overrideAccess", async () => {
      await expectLastAdminError(payload.delete({ collection: "staff", id: adminA.id, overrideAccess: true }));
      const still = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect(still.id).toBe(adminA.id);
      expect((await auditsFor(adminA.id)).some((log) => log.action === "staff.delete")).toBe(false);
    });

    it("có admin active khác thì hạ quyền admin được", async () => {
      const adminC = await createStaff("admin-c", ROLES.admin);
      const updated = await payload.update({
        collection: "staff",
        id: adminA.id,
        data: { role: ROLES.sale },
        user: asUser(adminC),
        overrideAccess: false,
      });
      expect(updated.role).toBe(ROLES.sale);
      await payload.update({ collection: "staff", id: adminA.id, data: { role: ROLES.admin }, overrideAccess: true });
      await removeStaff(adminC.id);
    });

    it("hai admin hạ quyền nhau đồng thời: đúng một bên thành công, vẫn còn admin active", async () => {
      for (let round = 0; round < 4; round += 1) {
        const adminC = await createStaff(`admin-race-${round}`, ROLES.admin);
        const demote = (id: string) =>
          payload.update({ collection: "staff", id, data: { role: ROLES.sale }, overrideAccess: true });
        const results = await Promise.allSettled([demote(adminA.id), demote(adminC.id)]);
        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        const admins = await payload.count({
          collection: "staff",
          where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
          overrideAccess: true,
        });
        expect(admins.totalDocs).toBe(1);
        // Khôi phục: adminA là admin duy nhất cho vòng sau.
        await payload.db.updateOne({ collection: "staff", id: adminA.id, data: { role: ROLES.admin }, returning: false });
        await removeStaff(adminC.id);
      }
    });
  });

  describe("bulk update/delete (where, không id)", () => {
    const countAudits = async () => (await payload.count({ collection: "audit-logs", overrideAccess: true })).totalDocs;
    const adminTarget = () => ({ id: { equals: adminA.id } });

    it("bulk PATCH khoá / đổi vai trò admin cuối qua REST: bị chặn, admin giữ nguyên, không có audit", async () => {
      const adminToken = await tokenOf(adminA.email);
      const before = await countAudits();
      for (const body of [{ active: false }, { role: ROLES.sale }]) {
        const response = await rest(`/staff?where[id][equals]=${adminA.id}`, { method: "PATCH", token: adminToken, body });
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
      const after = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect([after.active, after.role]).toEqual([true, ROLES.admin]);
      expect(await countAudits()).toBe(before);
    });

    it("bulk DELETE admin cuối qua REST: bị chặn, admin còn nguyên, không có audit", async () => {
      const adminToken = await tokenOf(adminA.email);
      const before = await countAudits();
      const response = await rest(`/staff?where[id][equals]=${adminA.id}`, { method: "DELETE", token: adminToken });
      expect(response.status).toBeGreaterThanOrEqual(400);
      const still = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect(still.active).toBe(true);
      expect(await countAudits()).toBe(before);
    });

    it("Local API không-ID (kể cả overrideAccess) nhắm admin cuối: bị chặn", async () => {
      const before = await countAudits();
      await expectLastAdminError(
        payload.update({ collection: "staff", where: adminTarget(), data: { active: false }, overrideAccess: true }),
      );
      await expectLastAdminError(
        payload.update({ collection: "staff", where: adminTarget(), data: { role: ROLES.sale }, overrideAccess: true }),
      );
      await expectLastAdminError(payload.delete({ collection: "staff", where: adminTarget(), overrideAccess: true }));
      const still = await payload.findByID({ collection: "staff", id: adminA.id, overrideAccess: true });
      expect([still.active, still.role]).toEqual([true, ROLES.admin]);
      expect(await countAudits()).toBe(before);
    });

    it("bulk lẫn admin và sale: chặn cả lệnh; hai admin cùng hạ quyền trong một bulk cũng bị chặn", async () => {
      const adminC = await createStaff("admin-bulk", ROLES.admin);
      const sale = await createStaff("sale-bulk-mix", ROLES.sale);
      const before = await countAudits();
      await expectLastAdminError(
        payload.update({
          collection: "staff",
          where: { id: { in: [adminA.id, adminC.id, sale.id] } },
          data: { role: ROLES.sale },
          overrideAccess: true,
        }),
      );
      const admins = await payload.count({
        collection: "staff",
        where: { and: [{ role: { equals: ROLES.admin } }, { active: { equals: true } }] },
        overrideAccess: true,
      });
      expect(admins.totalDocs).toBe(2);
      expect(await countAudits()).toBe(before);
      await removeStaff(adminC.id);
      await removeStaff(sale.id);
    });

    it("bulk hợp lệ trên nhiều sale: mỗi người đúng 1 audit deactivate; bulk đổi mật khẩu: mỗi người đúng 1 reset_password", async () => {
      const prefix = `bulk-${runId}`;
      const sales = await Promise.all([1, 2, 3].map((n) => createStaff(`${prefix}-${n}`, ROLES.sale)));
      const where = { email: { contains: prefix } };

      await payload.update({ collection: "staff", where, data: { active: false }, user: asUser(adminA), overrideAccess: false });
      for (const sale of sales) {
        const deactivations = (await auditsFor(sale.id)).filter((log) => log.action === "staff.deactivate");
        expect(deactivations).toHaveLength(1);
      }

      const newPassword = "Mat-khau-bulk-moi-555";
      await payload.update({ collection: "staff", where, data: { password: newPassword }, user: asUser(adminA), overrideAccess: false });
      for (const sale of sales) {
        const resets = (await auditsFor(sale.id)).filter((log) => log.action === "staff.reset_password");
        expect(resets).toHaveLength(1);
        expect(JSON.stringify(resets)).not.toContain(newPassword);
      }
      for (const sale of sales) await removeStaff(sale.id);
    });

    it("update lỗi rồi tái dùng req: cờ đổi mật khẩu không sót sang lần sửa không đổi mật khẩu", async () => {
      const target = await createStaff("flag-stale", ROLES.sale);
      const req = { context: {}, headers: new Headers() } as never;
      await payload
        .update({ collection: "staff", id: target.id, data: { password: "ngan" }, user: asUser(adminA), overrideAccess: false, req })
        .catch(() => null);
      await payload.update({ collection: "staff", id: target.id, data: { fullName: "Chỉ đổi tên" }, user: asUser(adminA), overrideAccess: false, req });
      expect((await auditsFor(target.id)).filter((log) => log.action === "staff.reset_password")).toHaveLength(0);
      await removeStaff(target.id);
    });
  });
});
