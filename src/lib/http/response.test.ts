import { describe, expect, it } from "vitest";
import { fail, ok } from "./response";

describe("ok", () => {
  it("trả 200 với { success: true, data }", async () => {
    const res = ok({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ success: true, data: { id: 1 } });
  });

  it("giữ nguyên data null/mảng rỗng và cho đổi status (201)", async () => {
    expect(await ok(null).json()).toEqual({ success: true, data: null });
    const created = ok([], 201);
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ success: true, data: [] });
  });
});

describe("ok: status", () => {
  it("từ chối status ngoài 2xx", () => {
    expect(() => ok({}, 400)).toThrow(RangeError);
    expect(() => ok({}, 302)).toThrow(RangeError);
  });
});

describe("fail", () => {
  it("trả status + { success: false, error, details }", async () => {
    const res = fail(400, "Dữ liệu không hợp lệ", [{ field: "phone", message: "Sai định dạng" }]);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: "Dữ liệu không hợp lệ",
      details: [{ field: "phone", message: "Sai định dạng" }],
    });
  });

  it("code máy đọc được chỉ có khi truyền", async () => {
    expect(await fail(400, "x", [], "postingClosed").json()).toEqual({ success: false, error: "x", details: [], code: "postingClosed" });
    expect(await fail(400, "x").json()).not.toHaveProperty("code");
  });

  it("details mặc định là mảng rỗng", async () => {
    const res = fail(404, "Không tìm thấy");
    expect(await res.json()).toEqual({ success: false, error: "Không tìm thấy", details: [] });
  });

  it("từ chối status ngoài 4xx/5xx để không vô tình trả lỗi với mã thành công", () => {
    expect(() => fail(200, "x")).toThrow(RangeError);
    expect(() => fail(302, "x")).toThrow(RangeError);
    expect(() => fail(99, "x")).toThrow(RangeError);
  });
});
