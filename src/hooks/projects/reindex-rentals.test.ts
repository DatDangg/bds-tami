import type { CollectionAfterChangeHook, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reindexRentalsFromHook = vi.hoisted(() => vi.fn());
vi.mock("../../lib/search/reindex-in-hook", () => ({ reindexRentalsFromHook }));

import { reindexRentalsOnProjectRename } from "./reindex-rentals";

type Args = Parameters<CollectionAfterChangeHook>[0];
const reqAs = (role?: string) => ({ user: role ? { role, active: true } : undefined, payload: { collections: { rentals: {} } } }) as unknown as PayloadRequest;
const run = (req: PayloadRequest, doc: Record<string, unknown>, previousDoc: Record<string, unknown>, operation = "update") =>
  reindexRentalsOnProjectRename({ doc, previousDoc, operation, req } as unknown as Args);

const doc = { id: "pr1", title: "Vinhomes Grand Park", slug: "vinhomes-grand-park" };

beforeEach(() => {
  reindexRentalsFromHook.mockReset().mockResolvedValue({ rentals: 2, rows: 4 });
});

describe("reindexRentalsOnProjectRename", () => {
  it("đổi title → dựng lại tin của dự án (scope projectId, nguồn 'projects'); đồng bộ xong trả doc nguyên vẹn", async () => {
    const req = reqAs("admin");
    await expect(run(req, doc, { ...doc, title: "cũ" })).resolves.toBe(doc);
    expect(reindexRentalsFromHook).toHaveBeenCalledWith(req, { projectId: "pr1" }, "projects");
  });

  it("xếp job nền ('queued') + admin → doc trả về có searchReindexPending: true", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("admin"), doc, { ...doc, title: "cũ" })).resolves.toEqual({ ...doc, searchReindexPending: true });
  });

  it("xếp job nền nhưng người lưu không phải admin → không gắn cờ", async () => {
    reindexRentalsFromHook.mockResolvedValue("queued");
    await expect(run(reqAs("sale"), doc, { ...doc, title: "cũ" })).resolves.toBe(doc);
    await expect(run(reqAs(), doc, { ...doc, title: "cũ" })).resolves.toBe(doc);
  });

  it("title không đổi (chỉ sửa slug) / không phải update → không dựng lại", async () => {
    await run(reqAs("admin"), doc, { ...doc, slug: "khac" });
    await run(reqAs("admin"), doc, { ...doc, title: "cũ" }, "create");
    expect(reindexRentalsFromHook).not.toHaveBeenCalled();
  });
});
