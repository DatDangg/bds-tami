import { describe, expect, it, vi } from "vitest";

import { guardSendEmail } from "./transport";

const makeLog = () => ({ warn: vi.fn() });

describe("guardSendEmail: EMAIL_ALLOWLIST ở adapter", () => {
  it("staging: địa chỉ ngoài allowlist không gọi transport, chỉ log số lượng (không địa chỉ)", async () => {
    const send = vi.fn();
    const log = makeLog();
    const guarded = guardSendEmail({ send, appEnv: "staging", allowlistRaw: "noi-bo@tami.vn", log });

    await guarded({ to: "khach@gmail.com", subject: "s" });

    expect(send).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith({ dropped: 1, appEnv: "staging" }, expect.any(String));
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain("khach@gmail.com");
  });

  it("staging: địa chỉ trong allowlist (kể cả dạng 'Tên <addr>' và object) vẫn gửi, phần ngoài bị bỏ", async () => {
    const send = vi.fn().mockResolvedValue("ok");
    const guarded = guardSendEmail({ send, appEnv: "staging", allowlistRaw: "a@tami.vn,b@tami.vn", log: makeLog() });

    await guarded({ to: ["Ai <A@tami.vn>", "x@gmail.com", { address: "b@tami.vn", name: "B" }], cc: "y@gmail.com", subject: "s" });

    expect(send).toHaveBeenCalledWith({ to: ["Ai <A@tami.vn>", { address: "b@tami.vn", name: "B" }], cc: [], subject: "s" });
  });

  it("development/test cũng lọc; allowlist rỗng -> bỏ hết", async () => {
    const send = vi.fn();
    for (const appEnv of ["development", "test"] as const) {
      await guardSendEmail({ send, appEnv, allowlistRaw: undefined, log: makeLog() })({ to: "a@tami.vn" });
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("production: gửi tự do dù allowlist rỗng", async () => {
    const send = vi.fn().mockResolvedValue("ok");
    const log = makeLog();
    await guardSendEmail({ send, appEnv: "production", allowlistRaw: undefined, log })({ to: "khach@gmail.com", subject: "s" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(log.warn).not.toHaveBeenCalled();
  });

  it("lỗi transport vẫn ném (job email retry như cũ)", async () => {
    const send = vi.fn().mockRejectedValue(new Error("boom"));
    const guarded = guardSendEmail({ send, appEnv: "production", allowlistRaw: undefined, log: makeLog() });
    await expect(guarded({ to: "a@x.vn" })).rejects.toThrow("boom");
  });
});
