import type { CollectionAfterChangeHook, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalsFromHook = vi.hoisted(() => vi.fn());
vi.mock("../../lib/search/reindex-in-hook", () => ({ reindexRentalsFromHook }));

import { reindexRentalsOnWardChange } from "./reindex-rentals";

type Args = Parameters<CollectionAfterChangeHook>[0];
const reqAs = (role?: string) => ({ user: role ? { role, active: true } : undefined, payload: { collections: { rentals: {} } } }) as unknown as PayloadRequest;
const run = (req: PayloadRequest, doc: Record<string, unknown>, previousDoc: Record<string, unknown>, operation = "update") =>
  reindexRentalsOnWardChange({ doc, previousDoc, operation, req } as unknown as Args);

const doc = { id: "w1", name: "Phường Sài Gòn", legacyNames: [{ name: "Phường Bến Nghé" }], code: "70101063" };

beforeEach(() => {
  reindexRentalsFromHook.mockReset().mockResolvedValue({ rentals: 2, rows: 4 });
});

describe("reindexRentalsOnWardChange", () => {
  it("đổi tên → dựng lại tin của phường (scope wardId, nguồn 'wards'); đồng bộ xong trả doc nguyên vẹn", async () => {
    const req = reqAs("admin");
    await expect(run(req, doc, { ...doc, name: "cũ" })).resolves.toBe(doc);
    expect(reindexRentalsFromHook).toHaveBeenCalledTimes(1);
    expect(reindexRentalsFromHook).toHaveBeenCalledWith(req, { wardId: "w1" }, "wards");
  });

  it("chỉ đổi tên cũ (legacyNames) → KHÔNG dựng lại: tên cũ không còn là nguồn tìm kiếm (BL-110)", async () => {
    await run(reqAs("admin"), doc, { ...doc, legacyNames: [] });
    await run(reqAs("admin"), doc, { ...doc, legacyNames: [{ name: "Phường khác, Quận Ba Đình" }] });
    expect(reindexRentalsFromHook).not.toHaveBeenCalled();
  });

  it("xếp job nền ('queued') + admin → doc trả về có searchReindexPending: true", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("admin"), doc, { ...doc, name: "cũ" })).resolves.toEqual({ ...doc, searchReindexPending: true });
  });

  it("xếp job nền nhưng người lưu không phải admin → không gắn cờ", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("sale"), doc, { ...doc, name: "cũ" })).resolves.toBe(doc);
    await expect(run(reqAs(), doc, { ...doc, name: "cũ" })).resolves.toBe(doc);
  });

  it("nguồn tìm kiếm không đổi (chỉ sửa code) / không phải update → không dựng lại", async () => {
    await run(reqAs("admin"), doc, { ...doc, code: "khác" });
    await run(reqAs("admin"), doc, { ...doc, name: "cũ" }, "create");
    expect(reindexRentalsFromHook).not.toHaveBeenCalled();
  });
});
