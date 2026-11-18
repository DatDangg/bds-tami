import { APIError, formatErrors, ValidationError } from "payload";
import type { AfterErrorHookArgs } from "payload";
import { describe, expect, it } from "vitest";

import { restorePublicErrorMessage } from "./restore-public-error-message";

const format = (error: Error) => formatErrors(error as unknown as Parameters<typeof formatErrors>[0]);

/** Mô phỏng build production: minify làm `constructor.name` rỗng nên ExtendableError gán `name = ""`. */
function minified<T extends Error>(error: T): T {
  error.name = "";
  return error;
}

/** Chạy đúng thứ tự `routeError`: `formatErrors` trước, rồi hook `afterError` nhận `result`. */
async function runAfterError(error: Error) {
  const result = format(error);
  const hookResult = await restorePublicErrorMessage({ error, result } as unknown as AfterErrorHookArgs);
  return { before: result, response: hookResult?.response ?? result, status: hookResult?.status };
}

describe("restorePublicErrorMessage (afterError toàn cục)", () => {
  it("minify làm formatErrors mất thông báo (tái hiện lỗi)", () => {
    const error = minified(new APIError("Mật khẩu tối thiểu 10 ký tự.", 400, undefined, true));
    expect(format(error).errors[0]?.message).toBe("An unknown error occurred.");
  });

  it("APIError public, không data, name rỗng: khôi phục message, không đổi status", async () => {
    const error = minified(new APIError("Thiếu mật khẩu mới.", 400, undefined, true));
    const { response, status } = await runAfterError(error);
    expect(response.errors).toEqual([{ message: "Thiếu mật khẩu mới." }]);
    expect(status).toBeUndefined();
  });

  it("giữ nguyên `stack` của response khi bật debug", async () => {
    const error = minified(new APIError("File vượt quá 10MB.", 413, undefined, true));
    const result = { ...format(error), stack: "trace" };
    const hookResult = await restorePublicErrorMessage({ error, result } as unknown as AfterErrorHookArgs);
    expect(hookResult?.response).toEqual({ errors: [{ message: "File vượt quá 10MB." }], stack: "trace" });
  });

  it("lỗi không public (500): không đụng, không lộ message nội bộ", async () => {
    const error = minified(new APIError("chi tiết nội bộ", 500, undefined, false));
    const hookResult = await restorePublicErrorMessage({ error, result: format(error) } as unknown as AfterErrorHookArgs);
    expect(hookResult).toBeUndefined();
  });

  it("APIError có data (nhánh 1 của formatErrors): không đụng", async () => {
    const error = minified(new APIError("Có data", 400, { field: "x" }, true));
    const { before, response } = await runAfterError(error);
    expect(response).toBe(before);
  });

  it("ValidationError có data: không đụng", async () => {
    const error = new ValidationError({ errors: [{ message: "Mật khẩu tối thiểu 10 ký tự.", path: "password" }] });
    const { before, response } = await runAfterError(error);
    expect(response).toBe(before);
  });

  it("name còn nguyên (dev/lớp con): không đụng", async () => {
    const error = new APIError("Bình thường", 409, undefined, true);
    error.name = "APIError";
    const { before, response } = await runAfterError(error);
    expect(response).toBe(before);
    expect(response.errors?.[0]?.message).toBe("Bình thường");
  });

  describe("khôi phục data của lỗi validate (BL-119)", () => {
    const data = { collection: undefined, global: "homepage", errors: [{ label: "Danh mục", message: "Tối đa 4 danh mục.", path: "rentals.categories" }] };
    const run = (error: unknown, result: unknown) => restorePublicErrorMessage({ error, result } as unknown as AfterErrorHookArgs);

    it("ValidationError lệch bản sao payload (formatErrors rơi nhánh { message }): trả lại data", async () => {
      // Không phải instance của lớp nào: mô phỏng bản sao khác trong bundle production.
      const error = { name: "ValidationError", status: 400, isPublic: true, message: "Trường sau chưa hợp lệ: Danh mục", data };
      const hook = await run(error, { errors: [{ message: error.message }] });
      expect(hook?.response).toEqual({ errors: [{ name: "ValidationError", data, message: error.message }] });
      expect(hook?.status).toBeUndefined();
    });

    it("giữ `stack` của response", async () => {
      const error = { status: 400, isPublic: true, message: "m", data };
      const hook = await run(error, { errors: [{ message: "m" }], stack: "trace" });
      expect(hook?.response).toMatchObject({ stack: "trace", errors: [{ name: "ValidationError", data }] });
    });

    it("không đụng: 500, không public, data sai hình dạng, result đã có data", async () => {
      const base = { status: 400, isPublic: true, message: "m", data };
      const plain = { errors: [{ message: "m" }] };
      expect(await run({ ...base, status: 500 }, plain)).toBeUndefined();
      expect(await run({ ...base, isPublic: false }, plain)).toBeUndefined();
      expect(await run({ ...base, data: { errors: [{ message: "x" }] } }, plain)).toBeUndefined();
      expect(await run({ ...base, data: { errors: [] } }, plain)).toBeUndefined();
      expect(await run({ ...base, data: undefined }, plain)).toBeUndefined();
      expect(await run(base, { errors: [{ message: "m", data }] })).toBeUndefined();
    });
  });

  it("message rỗng hoặc không phải APIError: không đụng", async () => {
    const empty = minified(new APIError("", 400, undefined, true));
    expect(await restorePublicErrorMessage({ error: empty, result: format(empty) } as unknown as AfterErrorHookArgs)).toBeUndefined();
    const plain = minified(new Error("lỗi thường"));
    expect(await restorePublicErrorMessage({ error: plain, result: format(plain) } as unknown as AfterErrorHookArgs)).toBeUndefined();
  });
});
