import { JobCancelledError } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalSearchText = vi.hoisted(() => vi.fn());
vi.mock("../lib/search/reindex-rental-search-text", () => ({ reindexRentalSearchText }));

import { REINDEX_RENTALS_SEARCH_SLUG, toReindexJobInput, toReindexScope } from "../lib/search/reindex-job-input";
import { reindexRentalsSearchTask } from "./reindex-rentals-search";

type Handler = (args: { input: unknown; job: { id: string; totalTried?: number }; req: unknown }) => Promise<unknown>;

const logger = { info: vi.fn(), error: vi.fn() };
const req = { payload: { logger } };
const run = (input: unknown) => (reindexRentalsSearchTask.handler as unknown as Handler)({ input, job: { id: "job-1" }, req });

beforeEach(() => {
  reindexRentalSearchText.mockReset().mockResolvedValue({ rentals: 600, rows: 900 });
  logger.info.mockReset();
  logger.error.mockReset();
});

describe("job input ↔ phạm vi reindex", () => {
  it("đổi qua lại không mất thông tin cho cả ba loại phạm vi", () => {
    for (const scope of [{ provinceId: "p1" }, { wardId: "w1" }, { projectId: "pr1" }] as const) {
      expect(toReindexScope(toReindexJobInput(scope))).toEqual(scope);
    }
    expect(toReindexJobInput({ wardId: "w1" })).toEqual({ scope: "ward", id: "w1" });
  });
});

describe("task reindex-rentals-search", () => {
  it("slug, retry (3 lần, backoff mũ) và schema input/output", () => {
    expect(reindexRentalsSearchTask.slug).toBe(REINDEX_RENTALS_SEARCH_SLUG);
    expect(reindexRentalsSearchTask.retries).toEqual({ attempts: 3, backoff: { type: "exponential", delay: 60_000 } });
    expect(reindexRentalsSearchTask.inputSchema?.map((field) => ("name" in field ? field.name : ""))).toEqual(["scope", "id"]);
    expect(reindexRentalsSearchTask.outputSchema?.map((field) => ("name" in field ? field.name : ""))).toEqual(["rentals", "rows"]);
  });

  it("gọi reindex theo đúng phạm vi với req của job (không transaction của lần lưu), trả output và log định danh", async () => {
    await expect(run({ scope: "province", id: "p1" })).resolves.toEqual({ output: { rentals: 600, rows: 900 } });
    expect(reindexRentalSearchText).toHaveBeenCalledWith(req.payload, { provinceId: "p1" }, req);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info.mock.calls[0]![0]).toEqual({ jobId: "job-1", scope: "province", id: "p1", rentals: 600, rows: 900 });
  });

  it.each([{ scope: "city", id: "x" }, { scope: "ward" }, { scope: "ward", id: "" }, null])("input sai %j → JobCancelledError (không thử lại), không reindex", async (input) => {
    await expect(run(input)).rejects.toBeInstanceOf(JobCancelledError);
    expect(reindexRentalSearchText).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("lỗi DB khi reindex: ném lại nguyên lỗi để Payload thử lại, log chỉ tên lỗi", async () => {
    const dbError = new Error("connection reset");
    reindexRentalSearchText.mockRejectedValue(dbError);
    await expect(run({ scope: "ward", id: "w1" })).rejects.toBe(dbError);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]![0]).toMatchObject({ jobId: "job-1", scope: "ward", id: "w1", errorName: "Error" });
    expect(JSON.stringify(logger.error.mock.calls[0])).not.toContain("connection reset");
  });
});
