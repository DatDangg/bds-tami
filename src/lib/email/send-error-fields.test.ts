import { describe, expect, it } from "vitest";

import { pickSendErrorFields } from "./send-error-fields";

describe("pickSendErrorFields", () => {
  it("chỉ giữ trường định danh, không message/stack/response (không SMTP_PASS/token/email)", () => {
    const err = Object.assign(new Error("535 auth failed pass=SECRET-PASS to=victim@x.vn token=TOKEN123"), {
      code: "EAUTH",
      responseCode: 535,
      command: "AUTH PLAIN",
      response: "535 SECRET-PASS",
    });
    const fields = pickSendErrorFields(err);
    expect(fields).toEqual({ errorName: "Error", code: "EAUTH", responseCode: 535, command: "AUTH PLAIN" });
    const serialized = JSON.stringify(fields);
    for (const leak of ["SECRET-PASS", "TOKEN123", "victim@x.vn", "stack"]) expect(serialized).not.toContain(leak);
  });

  it("giá trị không phải object -> UnknownError", () => {
    expect(pickSendErrorFields("boom victim@x.vn")).toEqual({ errorName: "UnknownError" });
  });
});
