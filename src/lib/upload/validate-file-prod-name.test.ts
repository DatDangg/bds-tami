import { describe, expect, it, vi } from "vitest";

// Mô phỏng build production: minify làm ExtendableError gán `name = constructor.name` = "".
vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  class MinifiedAPIError extends actual.APIError {
    constructor(message: string, status?: number, data?: { [key: string]: unknown } | null, isPublic?: boolean) {
      super(message, status, data, isPublic);
      this.name = "";
    }
  }
  return { ...actual, APIError: MinifiedAPIError };
});

import { formatErrors } from "payload";
import type { AfterErrorHookArgs } from "payload";

import { restorePublicErrorMessage } from "../../hooks/restore-public-error-message";
import { inspectUpload, MEDIA_POLICY } from "./validate-file";

const MB = 1024 * 1024;

describe("reject() ở build production (name rỗng do minify)", () => {
  it("hook afterError toàn cục giữ thông báo tiếng Việt và mã 413", async () => {
    // JPEG magic bytes + đệm > 10 MB.
    const big = new Uint8Array(11 * MB);
    big.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    let caught: unknown;
    try {
      await inspectUpload(big, MEDIA_POLICY);
    } catch (error) {
      caught = error;
    }
    const error = caught as Error & { status: number };
    expect(error.status).toBe(413);
    const result = formatErrors(error as Parameters<typeof formatErrors>[0]);
    expect(result.errors[0]?.message).toBe("An unknown error occurred.");
    const hookResult = await restorePublicErrorMessage({ error, result } as unknown as AfterErrorHookArgs);
    expect(hookResult?.response?.errors?.[0]?.message).toBe("File vượt quá 10MB.");
  });
});
