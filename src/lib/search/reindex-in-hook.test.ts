import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalSearchText = vi.hoisted(() => vi.fn());
const rentalsInScope = vi.hoisted(() => vi.fn());
vi.mock("./reindex-rental-search-text", () => ({ reindexRentalSearchText, rentalsInScope }));

import { reindexRentalsFromHook, SYNC_REINDEX_LIMIT } from "./reindex-in-hook";

const error = vi.fn();
const req = { payload: { logger: { error } } } as unknown as PayloadRequest;

beforeEach(() => {
  reindexRentalSearchText.mockReset().mockResolvedValue({ rentals: 3, rows: 4 });
  rentalsInScope.mockReset();
  error.mockReset();
});

describe("reindexRentalsFromHook", () => {
  it("số tin trong ngưỡng: dựng lại đồng bộ trong transaction của lần lưu (cùng req)", async () => {
    rentalsInScope.mockResolvedValue(SYNC_REINDEX_LIMIT);
    await expect(reindexRentalsFromHook(req, { provinceId: "p1" }, "provinces")).resolves.toEqual({ rentals: 3, rows: 4 });
    expect(reindexRentalSearchText).toHaveBeenCalledWith(req.payload, { provinceId: "p1" }, req);
    expect(error).not.toHaveBeenCalled();
  });

  it("vượt ngưỡng: KHÔNG dựng lại trong transaction, log lỗi chỉ lệnh bù và trả 'deferred' (không ném, lần lưu vẫn thành công)", async () => {
    rentalsInScope.mockResolvedValue(SYNC_REINDEX_LIMIT + 1);
    await expect(reindexRentalsFromHook(req, { wardId: "w1" }, "wards")).resolves.toBe("deferred");
    expect(reindexRentalSearchText).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]![0]).toMatchObject({ source: "wards", scope: { wardId: "w1" }, rentals: SYNC_REINDEX_LIMIT + 1, limit: SYNC_REINDEX_LIMIT });
    expect(String(error.mock.calls[0]![1])).toContain("pnpm reindex:rentals-search");
  });

  it("đếm trong cùng transaction (truyền req)", async () => {
    rentalsInScope.mockResolvedValue(1);
    await reindexRentalsFromHook(req, { projectId: "pr1" }, "projects");
    expect(rentalsInScope).toHaveBeenCalledWith(req.payload, { projectId: "pr1" }, req);
  });
});
