import { formatErrors, ValidationError } from "payload";
import type { CollectionBeforeValidateHook, PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";

import { enforcePasswordLength, Staff } from "./Staff";

const run = (password: string) =>
  enforcePasswordLength({
    data: { password },
    collection: { slug: "staff" },
    req: {},
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]);

const caught = (action: () => unknown) =>
  Promise.resolve()
    .then(action)
    .then(
      () => undefined,
      (error: unknown) => error,
    );

describe("Staff password length", () => {
  it("mật khẩu 9 ký tự -> toast tiếng Việt nêu lý do, không có chữ Anh, kể cả không có req.t", async () => {
    const error = await caught(() => run("123456789"));
    expect(error).toBeInstanceOf(ValidationError);
    const { message, data } = error as ValidationError;
    expect(message).toBe("Mật khẩu tối thiểu 10 ký tự.");
    expect(message).not.toContain("The following field");
    expect(data.errors[0]).toMatchObject({ path: "password" });
  });

  it("mật khẩu 10 ký tự hợp lệ", async () => {
    await expect(Promise.resolve(run("1234567890"))).resolves.toBeDefined();
  });

  it("body REST (formatErrors của Payload) trả errors[0].message tiếng Việt", async () => {
    const error = await caught(() => run("123456789"));
    const body = formatErrors(error as ValidationError);
    expect(body.errors[0]?.message).toBe("Mật khẩu tối thiểu 10 ký tự.");
    expect(body.errors[0]?.message).not.toContain("The following field");
  });

  it("endpoint /reset-password: mật khẩu 9 ký tự -> cùng lỗi tiếng Việt", async () => {
    const endpoint = (Array.isArray(Staff.endpoints) ? Staff.endpoints : []).find((item) => item.path === "/reset-password" && item.method === "post");
    const req = new Request("http://localhost/api/staff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "t", password: "123456789" }),
    }) as unknown as PayloadRequest;
    req.payload = {} as PayloadRequest["payload"];
    const error = await caught(() => endpoint?.handler(req));
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).message).toBe("Mật khẩu tối thiểu 10 ký tự.");
  });
});
