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

import { inspectUpload, MEDIA_POLICY } from "./validate-file";

const MB = 1024 * 1024;

describe("reject() ở build production (name rỗng do minify)", () => {
  it("gán name = 'APIError' để formatErrors giữ thông báo tiếng Việt", async () => {
    // JPEG magic bytes + đệm > 10 MB.
    const big = new Uint8Array(11 * MB);
    big.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    let caught: unknown;
    try {
      await inspectUpload(big, MEDIA_POLICY);
    } catch (error) {
      caught = error;
    }
    expect((caught as Error).name).toBe("APIError");
    expect(formatErrors(caught as Parameters<typeof formatErrors>[0]).errors[0]?.message).toBe("File vượt quá 10MB.");
  });
});
