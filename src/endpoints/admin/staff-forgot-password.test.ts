import { APIError } from "payload";
import { describe, expect, it, vi } from "vitest";

import { forgotPasswordUniformResponse } from "./staff-forgot-password";
import { logger } from "../../lib/logger";

function makeReq(defaultHandler: (req: unknown) => Promise<Response>, data: unknown = { email: "victim@x.vn" }) {
  const defaultEndpoint = { path: "/forgot-password", method: "post", handler: defaultHandler };
  // Request thật: endpoint phải tự parse body trên bản sao (Payload không parse cho endpoint tuỳ biến).
  const request = new Request("http://localhost/api/staff/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return Object.assign(request, {
    payload: { config: {}, collections: { staff: { config: { endpoints: [forgotPasswordUniformResponse, defaultEndpoint] } } } },
    t: () => "Thành công",
    routeParams: {},
  });
}
const okResponse = () => Response.json({ message: "Thành công" }, { status: 200 });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("forgotPasswordUniformResponse", () => {
  it("email tồn tại + SMTP lỗi trả cùng status/body với email không tồn tại; lỗi chỉ ở log (field whitelist)", async () => {
    const errorLog = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const smtpError = Object.assign(new Error("getaddrinfo ENOTFOUND smtp.invalid victim@x.vn token=TOKEN123"), { code: "EDNS" });

    const exists = await forgotPasswordUniformResponse.handler(makeReq(() => Promise.reject(smtpError)) as never);
    const missing = await forgotPasswordUniformResponse.handler(makeReq(() => Promise.resolve(okResponse())) as never);
    await flush();
    await flush();
    process.off("unhandledRejection", unhandled);

    expect(exists.status).toBe(200);
    expect(exists.status).toBe(missing.status);
    expect(await exists.json()).toEqual(await missing.json());
    expect(unhandled).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(errorLog.mock.calls);
    expect(serialized).toContain("EDNS");
    for (const leak of ["victim@x.vn", "smtp.invalid", "TOKEN123", "stack"]) expect(serialized).not.toContain(leak);
    errorLog.mockRestore();
  });

  it("không chờ handler mặc định (DB/SMTP chậm không làm chậm phản hồi)", async () => {
    let finish: () => void = () => undefined;
    const slow = () => new Promise<Response>((resolve) => { finish = () => resolve(okResponse()); });
    const response = await forgotPasswordUniformResponse.handler(makeReq(slow) as never);
    expect(response.status).toBe(200);
    finish();
  });

  it.each([{}, { email: "" }, { email: 5 }, null])("thiếu/sai email %j: giữ nguyên lỗi 400 của handler mặc định", async (data) => {
    const missingEmail = new APIError("Missing email.", 400);
    const req = makeReq(() => Promise.reject(missingEmail), data);
    await expect(forgotPasswordUniformResponse.handler(req as never)).rejects.toBe(missingEmail);
  });

  it("không tìm thấy handler mặc định -> ném lỗi cấu hình (không nuốt)", async () => {
    const req = makeReq(() => Promise.resolve(okResponse()));
    req.payload.collections.staff.config.endpoints = [forgotPasswordUniformResponse];
    await expect(forgotPasswordUniformResponse.handler(req as never)).rejects.toThrow(/forgot-password/);
  });
});
