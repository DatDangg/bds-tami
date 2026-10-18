import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalSearchText = vi.hoisted(() => vi.fn());
const rentalsInScope = vi.hoisted(() => vi.fn());
vi.mock("./reindex-rental-search-text", () => ({ reindexRentalSearchText, rentalsInScope }));

import { REINDEX_RENTALS_SEARCH_SLUG } from "./reindex-job-input";
import { reindexRentalsFromHook, SYNC_REINDEX_LIMIT } from "./reindex-in-hook";

const error = vi.fn();
const info = vi.fn();
const find = vi.fn();
const queue = vi.fn();
const req = { payload: { logger: { error, info }, find, jobs: { queue } }, transactionID: "tx-1" } as unknown as PayloadRequest;

beforeEach(() => {
  reindexRentalSearchText.mockReset().mockResolvedValue({ rentals: 3, rows: 4 });
  rentalsInScope.mockReset();
  error.mockReset();
  info.mockReset();
  find.mockReset().mockResolvedValue({ docs: [] });
  queue.mockReset().mockResolvedValue({ id: "job-1" });
});

describe("reindexRentalsFromHook", () => {
  it("số tin trong ngưỡng: dựng lại đồng bộ trong transaction của lần lưu (cùng req), không xếp job", async () => {
    rentalsInScope.mockResolvedValue(SYNC_REINDEX_LIMIT);
    await expect(reindexRentalsFromHook(req, { provinceId: "p1" }, "provinces")).resolves.toEqual({ rentals: 3, rows: 4 });
    expect(reindexRentalSearchText).toHaveBeenCalledWith(req.payload, { provinceId: "p1" }, req);
    expect(queue).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("vượt ngưỡng: KHÔNG dựng lại trong transaction mà xếp 1 job `reindex-rentals-search` bằng req gốc (cùng transaction), trả 'queued'", async () => {
    rentalsInScope.mockResolvedValue(SYNC_REINDEX_LIMIT + 1);
    await expect(reindexRentalsFromHook(req, { wardId: "w1" }, "wards")).resolves.toBe("queued");
    expect(reindexRentalSearchText).not.toHaveBeenCalled();
    expect(queue).toHaveBeenCalledTimes(1);
    expect(queue).toHaveBeenCalledWith({ task: REINDEX_RENTALS_SEARCH_SLUG, input: { scope: "ward", id: "w1" }, req });
    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]![0]).toMatchObject({ source: "wards", scope: "ward", id: "w1", rentals: SYNC_REINDEX_LIMIT + 1, limit: SYNC_REINDEX_LIMIT, jobId: "job-1" });
  });

  it("vượt ngưỡng nhưng đã có job đang chờ cho cùng phạm vi: không xếp trùng, vẫn trả 'queued'", async () => {
    rentalsInScope.mockResolvedValue(SYNC_REINDEX_LIMIT + 1);
    find.mockResolvedValue({ docs: [{ id: "job-cu" }] });
    await expect(reindexRentalsFromHook(req, { projectId: "pr1" }, "projects")).resolves.toBe("queued");
    expect(queue).not.toHaveBeenCalled();
    // Tìm job chờ: đúng task, chưa xong, chưa chạy, chưa lỗi, đúng phạm vi; trong cùng transaction (req) và không bị access chặn.
    expect(find).toHaveBeenCalledTimes(1);
    const args = find.mock.calls[0]![0] as { collection: string; where: { and: unknown[] }; req: unknown; overrideAccess: boolean };
    expect(args.collection).toBe("payload-jobs");
    expect(args.req).toBe(req);
    expect(args.overrideAccess).toBe(true);
    expect(args.where.and).toEqual(
      expect.arrayContaining([
        { taskSlug: { equals: REINDEX_RENTALS_SEARCH_SLUG } },
        { completedAt: { exists: false } },
        { processing: { not_equals: true } },
        { hasError: { not_equals: true } },
        { "input.scope": { equals: "project" } },
        { "input.id": { equals: "pr1" } },
      ]),
    );
    expect(info.mock.calls[0]![0]).toMatchObject({ jobId: "job-cu" });
  });

  it("đếm trong cùng transaction (truyền req)", async () => {
    rentalsInScope.mockResolvedValue(1);
    await reindexRentalsFromHook(req, { projectId: "pr1" }, "projects");
    expect(rentalsInScope).toHaveBeenCalledWith(req.payload, { projectId: "pr1" }, req);
  });
});
