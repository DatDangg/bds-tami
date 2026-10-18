import type { CollectionAfterChangeHook, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalsFromHook = vi.hoisted(() => vi.fn());
vi.mock("../../lib/search/reindex-in-hook", () => ({ reindexRentalsFromHook }));

import { reindexRentalsOnProvinceRename } from "./reindex-rentals";

type Args = Parameters<CollectionAfterChangeHook>[0];
const reqAs = (role?: string) => ({ user: role ? { role, active: true } : undefined, payload: { collections: { rentals: {} } } }) as unknown as PayloadRequest;
const run = (req: PayloadRequest, doc: Record<string, unknown>, previousDoc: Record<string, unknown>, operation = "update") =>
  reindexRentalsOnProvinceRename({ doc, previousDoc, operation, req } as unknown as Args);

const doc = { id: "p1", name: "TP. Hồ Chí Minh", shortName: "HCM" };

beforeEach(() => {
  reindexRentalsFromHook.mockReset().mockResolvedValue({ rentals: 2, rows: 4 });
});

describe("reindexRentalsOnProvinceRename", () => {
  it("đổi name → dựng lại tin của tỉnh (scope provinceId, nguồn 'provinces'); đồng bộ xong thì trả doc nguyên vẹn", async () => {
    const req = reqAs("admin");
    await expect(run(req, doc, { ...doc, name: "Thành phố Hồ Chí Minh" })).resolves.toBe(doc);
    expect(reindexRentalsFromHook).toHaveBeenCalledWith(req, { provinceId: "p1" }, "provinces");
  });

  it("xếp job nền ('queued') + admin → doc trả về có searchReindexPending: true để form hiện cảnh báo ngay sau lưu", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("admin"), doc, { ...doc, name: "cũ" })).resolves.toEqual({ ...doc, searchReindexPending: true });
  });

  it("xếp job nền nhưng người lưu không phải admin (hoặc không đăng nhập) → không gắn cờ (cùng điều kiện access read của field)", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("sale"), doc, { ...doc, name: "cũ" })).resolves.toBe(doc);
    await expect(run(reqAs(), doc, { ...doc, name: "cũ" })).resolves.toBe(doc);
  });

  it("name không đổi / không phải update / không có collection rentals → không dựng lại", async () => {
    await run(reqAs("admin"), doc, { ...doc, shortName: "khác" });
    await run(reqAs("admin"), doc, { ...doc, name: "cũ" }, "create");
    await run({ ...reqAs("admin"), payload: { collections: {} } } as unknown as PayloadRequest, doc, { ...doc, name: "cũ" });
    expect(reindexRentalsFromHook).not.toHaveBeenCalled();
  });
});
