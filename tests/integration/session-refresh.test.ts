import { handleEndpoints, type Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SESSION_TTL_SECONDS } from "../../src/lib/session/keepalive";

const databaseUrl = process.env.DATABASE_URL_TEST;

function decodeJwt(token: string): { exp: number; iat: number } {
  return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
}

describe.skipIf(!databaseUrl)("integration: phiên đăng nhập staff (DB thật)", () => {
  const runId = Date.now().toString(36);
  const email = `session-${runId}@example.test`;
  const password = "Mat-khau-hop-le-123";
  let payload: Payload;
  let staffId: string;

  const refresh = (token?: string) =>
    handleEndpoints({
      config: payload.config,
      request: new Request("http://localhost/api/staff/refresh-token", {
        method: "POST",
        headers: token ? { Authorization: `JWT ${token}` } : {},
      }),
    });

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const doc = await payload.create({
      collection: "staff",
      overrideAccess: true,
      data: { email, password, fullName: "Test session", role: "sale", active: true },
    });
    staffId = doc.id;
  });

  afterAll(async () => {
    await payload.delete({ collection: "staff", id: staffId, overrideAccess: true });
    await payload.destroy();
  });

  it("tokenExpiration của staff là 8 giờ", () => {
    expect(payload.collections.staff.config.auth.tokenExpiration).toBe(SESSION_TTL_SECONDS);
    expect(SESSION_TTL_SECONDS).toBe(28_800);
  });

  it("cookie payload-token: Secure chỉ bật khi NODE_ENV=production", () => {
    expect(payload.collections.staff.config.auth.cookies.secure).toBe(process.env.NODE_ENV === "production");
    expect(payload.collections.staff.config.auth.cookies.sameSite).toBe("Lax");
  });

  it("token đăng nhập có hạn 8 giờ", async () => {
    const { token } = await payload.login({ collection: "staff", data: { email, password } });
    const { exp, iat } = decodeJwt(token as string);
    expect(exp - iat).toBe(SESSION_TTL_SECONDS);
  });

  it("refresh-token với token hợp lệ cấp token mới có exp lớn hơn và cookie HttpOnly, SameSite=Lax", async () => {
    const { token } = await payload.login({ collection: "staff", data: { email, password } });
    const before = decodeJwt(token as string);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const response = await refresh(token as string);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { exp: number; refreshedToken: string };
    expect(body.exp).toBeGreaterThan(before.exp);
    expect(decodeJwt(body.refreshedToken).exp).toBe(body.exp);
    expect(body.exp - decodeJwt(body.refreshedToken).iat).toBe(SESSION_TTL_SECONDS);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^payload-token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("refresh-token không có token bị từ chối (client sẽ về màn đăng nhập)", async () => {
    const response = await refresh();
    expect([401, 403]).toContain(response.status);
  });
});
