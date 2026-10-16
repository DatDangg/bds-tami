import type { PayloadRequest } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ipHash } from "../security/ip-hash";
import { tryWriteAuditLog, writeAuditLog } from "./write-audit-log";

const SECRET = "unit-test-secret-unit-test-secret";

function fakeRequest(headers: Record<string, string>, create = vi.fn().mockResolvedValue({})) {
  const logger = { error: vi.fn() };
  const req = { headers: new Headers(headers), payload: { create, logger } } as unknown as PayloadRequest;
  return { req, create, logger };
}

describe("writeAuditLog", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", SECRET);
    vi.stubEnv("TRUST_CF_CONNECTING_IP", "true");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("ghi đúng trường, ipHash từ IP khách, overrideAccess và cùng req", async () => {
    const { req, create } = fakeRequest({ "cf-connecting-ip": "203.0.113.7" });
    await writeAuditLog({
      actor: { id: "u1" },
      action: "staff.create",
      collection: "staff",
      docId: "d1",
      summary: "Tạo",
      meta: { role: "sale", password: "bi-mat", nested: { hash: "h" } },
      req,
    });
    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0]![0];
    expect(args.collection).toBe("audit-logs");
    expect(args.overrideAccess).toBe(true);
    expect(args.req).toBe(req);
    expect(args.data).toMatchObject({
      actor: "u1",
      action: "staff.create",
      collection: "staff",
      docId: "d1",
      summary: "Tạo",
      meta: { role: "sale", nested: {} },
      ipHash: ipHash("203.0.113.7", SECRET),
    });
    expect(JSON.stringify(args.data)).not.toContain("bi-mat");
  });

  it("không có IP thì không ghi ipHash; không có actor thì để trống", async () => {
    vi.stubEnv("TRUST_CF_CONNECTING_IP", "false");
    const { req, create } = fakeRequest({ "cf-connecting-ip": "203.0.113.7" });
    await writeAuditLog({ action: "auth.login_failed", summary: "x", req });
    const { data } = create.mock.calls[0]![0];
    expect(data.ipHash).toBeUndefined();
    expect(data.actor).toBeUndefined();
  });

  it("writeAuditLog ném lỗi khi ghi hỏng (để rollback thao tác chính)", async () => {
    const { req } = fakeRequest({}, vi.fn().mockRejectedValue(new Error("db down")));
    await expect(writeAuditLog({ action: "staff.create", summary: "x", req })).rejects.toThrow("db down");
  });

  it("tryWriteAuditLog nuốt lỗi, log và trả false; thành công trả true", async () => {
    const failing = fakeRequest({}, vi.fn().mockRejectedValue(new Error("db down")));
    await expect(tryWriteAuditLog({ action: "auth.login_failed", summary: "x", req: failing.req })).resolves.toBe(false);
    expect(failing.logger.error).toHaveBeenCalledTimes(1);

    const ok = fakeRequest({});
    await expect(tryWriteAuditLog({ action: "auth.login_failed", summary: "x", req: ok.req })).resolves.toBe(true);
  });

  it("cắt summary quá dài", async () => {
    const { req, create } = fakeRequest({});
    await writeAuditLog({ action: "staff.create", summary: "a".repeat(2000), req });
    expect(create.mock.calls[0]![0].data.summary).toHaveLength(500);
  });
});
