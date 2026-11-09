import { APIError } from "payload";
import type { CollectionAfterDeleteHook } from "payload";
import { describe, expect, it, vi } from "vitest";

import { deleteApplicationCv } from "./delete-cv-and-audit";

function run(result: { errors: unknown[] }) {
  const error = vi.fn();
  const args = {
    doc: { id: "app-1", cv: "cv-1" },
    req: { payload: { delete: vi.fn().mockResolvedValue(result), logger: { error } } },
  } as unknown as Parameters<CollectionAfterDeleteHook>[0];
  return { promise: deleteApplicationCv(args), error };
}

describe("deleteApplicationCv", () => {
  it("S3 lỗi -> APIError công khai tiếng Việt, không lộ id hồ sơ", async () => {
    const { promise, error } = run({ errors: [{}] });
    const thrown = await promise.catch((caught: unknown) => caught as APIError);
    expect(thrown).toBeInstanceOf(APIError);
    expect(thrown.isPublic).toBe(true);
    expect(thrown.message).toContain("Không xoá được CV");
    expect(thrown.message).not.toContain("app-1");
    expect(error).toHaveBeenCalled();
  });

  it("xoá CV thành công -> trả doc", async () => {
    const { promise } = run({ errors: [] });
    await expect(promise).resolves.toMatchObject({ id: "app-1" });
  });
});
