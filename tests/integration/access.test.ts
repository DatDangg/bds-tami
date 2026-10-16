import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ROLES } from "../../src/access/roles";
import type { Staff } from "../../src/payload-types";

const databaseUrl = process.env.DATABASE_URL_TEST;

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (giống smoke test).
describe.skipIf(!databaseUrl)("integration: staff auth + access (DB thật)", () => {
  const runId = Date.now().toString(36);
  const password = "Mat-khau-hop-le-123";
  const createdIds: string[] = [];
  let payload: Payload;

  type StaffRole = (typeof ROLES)[keyof typeof ROLES];
  type StaffCreateData = Omit<Staff, "id" | "createdAt" | "updatedAt">;

  async function createStaff(label: string, role: StaffRole, active = true) {
    const doc = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: {
        email: `${label}-${runId}@example.test`,
        password,
        fullName: `Test ${label}`,
        role,
        active,
      },
    });
    createdIds.push(doc.id);
    return doc;
  }

  // User truyền vào Local API phải mang `collection` như khi Payload xác thực thật.
  const asUser = <T extends object>(doc: T) => ({ ...doc, collection: "staff" as const });

  let admin: Awaited<ReturnType<typeof createStaff>>;
  let sale: Awaited<ReturnType<typeof createStaff>>;
  let otherSale: Awaited<ReturnType<typeof createStaff>>;
  let lockedSale: Awaited<ReturnType<typeof createStaff>>;

  beforeAll(async () => {
    // Trỏ app vào DB test trước khi nạp config (config đọc DATABASE_URL lúc import).
    process.env.DATABASE_URL = databaseUrl;
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    admin = await createStaff("admin", ROLES.admin);
    sale = await createStaff("sale", ROLES.sale);
    otherSale = await createStaff("other-sale", ROLES.sale);
    lockedSale = await createStaff("locked", ROLES.sale, false);
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await payload.delete({ collection: "staff", id, overrideAccess: true });
    }
    await payload.destroy();
  });

  it("role mặc định là sale và active mặc định true", async () => {
    const doc = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email: `default-${runId}@example.test`, password, fullName: "Mặc định" } as StaffCreateData,
    });
    createdIds.push(doc.id);
    expect(doc.role).toBe(ROLES.sale);
    expect(doc.active).toBe(true);
  });

  describe("đọc hồ sơ", () => {
    it("admin đọc được mọi hồ sơ", async () => {
      const found = await payload.findByID({
        collection: "staff",
        id: sale.id,
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(found.id).toBe(sale.id);
    });

    it("sale chỉ thấy hồ sơ của chính mình khi liệt kê", async () => {
      const list = await payload.find({
        collection: "staff",
        user: asUser(sale),
        overrideAccess: false,
        limit: 100,
      });
      expect(list.docs.map((doc) => doc.id)).toEqual([sale.id]);
    });

    it("sale không đọc được hồ sơ sale khác theo id (BOLA)", async () => {
      await expect(
        payload.findByID({
          collection: "staff",
          id: otherSale.id,
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
    });

    it("khách không đọc được hồ sơ nào", async () => {
      await expect(
        payload.find({ collection: "staff", user: null, overrideAccess: false }),
      ).rejects.toThrow();
    });

    it("tài khoản bị khoá không đọc được gì, kể cả hồ sơ của mình", async () => {
      await expect(
        payload.findByID({
          collection: "staff",
          id: lockedSale.id,
          user: asUser(lockedSale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("sửa hồ sơ", () => {
    it("sale sửa được tên và SĐT của chính mình", async () => {
      const updated = await payload.update({
        collection: "staff",
        id: sale.id,
        data: { fullName: "Tên mới", phone: "0900000000" },
        user: asUser(sale),
        overrideAccess: false,
      });
      expect(updated.fullName).toBe("Tên mới");
      expect(updated.phone).toBe("0900000000");
    });

    it("sale không tự nâng role lên admin", async () => {
      await payload.update({
        collection: "staff",
        id: sale.id,
        data: { role: ROLES.admin },
        user: asUser(sale),
        overrideAccess: false,
      });
      const after = await payload.findByID({ collection: "staff", id: sale.id, overrideAccess: true });
      expect(after.role).toBe(ROLES.sale);
    });

    it("sale không tự mở khoá/đổi active", async () => {
      await payload.update({
        collection: "staff",
        id: sale.id,
        data: { active: false },
        user: asUser(sale),
        overrideAccess: false,
      });
      const after = await payload.findByID({ collection: "staff", id: sale.id, overrideAccess: true });
      expect(after.active).toBe(true);
    });

    it("sale không sửa được hồ sơ người khác", async () => {
      await expect(
        payload.update({
          collection: "staff",
          id: otherSale.id,
          data: { fullName: "Bị sửa" },
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
    });

    it("sale không tạo, không xoá được tài khoản", async () => {
      await expect(
        payload.create({
          collection: "staff",
          data: { email: `x-${runId}@example.test`, password, fullName: "X", role: ROLES.admin, active: true },
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
      await expect(
        payload.delete({
          collection: "staff",
          id: otherSale.id,
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
    });

    it("admin đổi được role và khoá/mở tài khoản", async () => {
      const updated = await payload.update({
        collection: "staff",
        id: otherSale.id,
        data: { role: ROLES.admin, active: false },
        user: asUser(admin),
        overrideAccess: false,
      });
      expect(updated.role).toBe(ROLES.admin);
      expect(updated.active).toBe(false);
      await payload.update({
        collection: "staff",
        id: otherSale.id,
        data: { role: ROLES.sale, active: true },
        overrideAccess: true,
      });
    });
  });

  describe("đăng nhập", () => {
    it("đăng nhập đúng thì thành công", async () => {
      const result = await payload.login({
        collection: "staff",
        data: { email: sale.email, password },
      });
      expect(result.token).toBeTruthy();
    });

    it("tài khoản active = false không đăng nhập được dù đúng mật khẩu", async () => {
      await expect(
        payload.login({ collection: "staff", data: { email: lockedSale.email, password } }),
      ).rejects.toThrow();
    });

    it("sai mật khẩu 5 lần thì khoá, kể cả khi lần sau đúng mật khẩu", async () => {
      const victim = await createStaff("brute", ROLES.sale);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await expect(
          payload.login({ collection: "staff", data: { email: victim.email, password: "sai-mat-khau" } }),
        ).rejects.toThrow();
      }
      await expect(
        payload.login({ collection: "staff", data: { email: victim.email, password } }),
      ).rejects.toThrow(/khóa/i);
    });
  });

  describe("mật khẩu tối thiểu 10 ký tự", () => {
    it("từ chối khi tạo với mật khẩu 9 ký tự", async () => {
      await expect(
        payload.create({
          collection: "staff",
          overrideAccess: true,
          data: { email: `short-${runId}@example.test`, password: "123456789", fullName: "Ngắn", role: ROLES.sale, active: true },
        }),
      ).rejects.toThrow();
    });

    it("từ chối khi đổi sang mật khẩu 9 ký tự, chấp nhận 10 ký tự", async () => {
      await expect(
        payload.update({
          collection: "staff",
          id: sale.id,
          data: { password: "123456789" },
          user: asUser(sale),
          overrideAccess: false,
        }),
      ).rejects.toThrow();
      await payload.update({
        collection: "staff",
        id: sale.id,
        data: { password },
        user: asUser(sale),
        overrideAccess: false,
      });
    });
  });

  it("sale không tự đổi email đăng nhập, admin thì được", async () => {
    const victim = await createStaff("email-owner", ROLES.sale);
    await payload.update({
      collection: "staff",
      id: victim.id,
      data: { email: `hacked-${runId}@example.test` },
      user: asUser(victim),
      overrideAccess: false,
    });
    const after = await payload.findByID({ collection: "staff", id: victim.id, overrideAccess: true });
    expect(after.email).toBe(victim.email);

    const byAdmin = await payload.update({
      collection: "staff",
      id: victim.id,
      data: { email: `renamed-${runId}@example.test` },
      user: asUser(admin),
      overrideAccess: false,
    });
    expect(byAdmin.email).toBe(`renamed-${runId}@example.test`);
  });

  it("đăng nhập thành công ghi lastLoginAt", async () => {
    const user = await createStaff("last-login", ROLES.sale);
    expect(user.lastLoginAt).toBeFalsy();
    await payload.login({ collection: "staff", data: { email: user.email, password } });
    const after = await payload.findByID({ collection: "staff", id: user.id, overrideAccess: true });
    expect(after.lastLoginAt).toBeTruthy();
  });

  it("cấu hình khoá: 5 lần sai, khoá 10 phút", () => {
    const { auth } = payload.collections.staff.config;
    expect(auth.maxLoginAttempts).toBe(5);
    expect(auth.lockTime).toBe(10 * 60 * 1000);
  });

  describe("đặt lại mật khẩu qua REST (forgot -> reset)", () => {
    async function resetPassword(token: string, newPassword: string) {
      return handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/staff/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: newPassword }),
        }),
      });
    }

    it("từ chối mật khẩu 9 ký tự, nhận 10 ký tự", async () => {
      const user = await createStaff("reset", ROLES.sale);
      const token = await payload.forgotPassword({
        collection: "staff",
        data: { email: user.email },
        disableEmail: true,
      });

      const tooShort = await resetPassword(token, "123456789");
      expect(tooShort.status).toBe(400);
      await expect(
        payload.login({ collection: "staff", data: { email: user.email, password: "123456789" } }),
      ).rejects.toThrow();

      const ok = await resetPassword(token, "1234567890");
      expect(ok.status).toBe(200);
      const result = await payload.login({
        collection: "staff",
        data: { email: user.email, password: "1234567890" },
      });
      expect(result.token).toBeTruthy();
    });
  });

  describe("đặt lại mật khẩu như form admin (multipart, JSON trong _payload)", () => {
    function resetViaAdminForm(token: string, newPassword: string) {
      const form = new FormData();
      form.append("_payload", JSON.stringify({ token, password: newPassword }));
      return handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/staff/reset-password", { method: "POST", body: form }),
      });
    }

    it("9 ký tự bị từ chối (400), 10 ký tự thành công (200, có message và user)", async () => {
      const user = await createStaff("reset-form", ROLES.sale);
      const token = await payload.forgotPassword({
        collection: "staff",
        data: { email: user.email },
        disableEmail: true,
      });

      const tooShort = await resetViaAdminForm(token, "123456789");
      expect(tooShort.status).toBe(400);

      const ok = await resetViaAdminForm(token, "1234567890");
      expect(ok.status).toBe(200);
      const body = (await ok.json()) as { message?: string; user?: { id: string } };
      expect(body.message).toBeTruthy();
      expect(body.user?.id).toBe(user.id);
    });

    async function freshToken(label: string) {
      const user = await createStaff(label, ROLES.sale);
      const token = await payload.forgotPassword({
        collection: "staff",
        data: { email: user.email },
        disableEmail: true,
      });
      return { user, token };
    }

    it("multipart có _payload là file trước, text 9 ký tự sau: vẫn bị chặn (400)", async () => {
      const { user, token } = await freshToken("reset-file-first");
      const form = new FormData();
      form.append("_payload", new File([JSON.stringify({ token, password: "1234567890" })], "p.json"));
      form.append("_payload", JSON.stringify({ token, password: "123" }));
      const response = await handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/staff/reset-password", { method: "POST", body: form }),
      });
      expect(response.status).toBe(400);
      await expect(
        payload.login({ collection: "staff", data: { email: user.email, password: "123" } }),
      ).rejects.toThrow();
    });

    it("thiếu password: 400", async () => {
      const { token } = await freshToken("reset-missing");
      const response = await handleEndpoints({
        config: payload.config,
        request: new Request("http://localhost/api/staff/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }),
      });
      expect(response.status).toBe(400);
    });
  });

  it("quyền vào /admin chỉ cho tài khoản hoạt động", async () => {
    const adminAccess = payload.collections.staff.config.access.admin;
    expect(adminAccess).toBeTypeOf("function");
    const call = (user: object | null) =>
      adminAccess?.({ req: { user } } as unknown as Parameters<NonNullable<typeof adminAccess>>[0]);
    expect(await call(asUser(sale))).toBe(true);
    expect(await call(asUser(lockedSale))).toBe(false);
    expect(await call(null)).toBe(false);
  });
});
