import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiErrorSchema, apiResponseSchema } from "./api";

describe("api schemas", () => {
  const schema = apiResponseSchema(z.object({ id: z.number() }));

  it("nhận thành công và lỗi theo response contract", () => {
    expect(schema.safeParse({ success: true, data: { id: 1 } }).success).toBe(true);
    expect(schema.safeParse({ success: false, error: "x", details: [] }).success).toBe(true);
    expect(apiErrorSchema.safeParse({ success: false, error: "x", details: [{ a: 1 }] }).success).toBe(true);
  });

  it("từ chối data sai kiểu hoặc thiếu error", () => {
    expect(schema.safeParse({ success: true, data: { id: "1" } }).success).toBe(false);
    expect(schema.safeParse({ success: false }).success).toBe(false);
  });
});
