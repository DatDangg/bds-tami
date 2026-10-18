import type { PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REINDEX_RENTALS_SEARCH_SLUG } from "../lib/search/reindex-job-input";
import { computeSearchReindexPending, markSearchReindexPending, searchReindexPendingField } from "./search-reindex-pending";

const find = vi.fn();
const makeReq = (role?: string, collections: Record<string, unknown> = { "payload-jobs": {} }) =>
  ({ user: role ? { role, active: true } : undefined, context: {}, payload: { find, collections } }) as unknown as PayloadRequest;
const hook = computeSearchReindexPending("province");
const read = (req: PayloadRequest, id: unknown) => (hook as unknown as (args: unknown) => Promise<unknown>)({ data: { id }, req });

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [{ input: { scope: "province", id: "p1" } }, { input: { scope: "province", id: "p2" } }] });
});

describe("computeSearchReindexPending", () => {
  it("không phải admin (khách công khai, sale) → undefined, không truy vấn bảng job", async () => {
    expect(await read(makeReq(), "p1")).toBeUndefined();
    expect(await read(makeReq("sale"), "p1")).toBeUndefined();
    expect(find).not.toHaveBeenCalled();
  });

  it("admin bị khoá (active=false) → undefined như access read, không truy vấn", async () => {
    const req = { user: { role: "admin", active: false }, context: {}, payload: { find, collections: { "payload-jobs": {} } } } as unknown as PayloadRequest;
    expect(await read(req, "p1")).toBeUndefined();
    expect(find).not.toHaveBeenCalled();
  });

  it("admin: true khi có job reindex đang chờ/chạy cho chính bản ghi, false khi không", async () => {
    const req = makeReq("admin");
    expect(await read(req, "p1")).toBe(true);
    expect(await read(req, "p3")).toBe(false);
    // Danh sách nhiều bản ghi: chỉ 1 truy vấn cho cả request (nhớ trong req.context).
    expect(find).toHaveBeenCalledTimes(1);
    const args = find.mock.calls[0]![0] as { collection: string; where: { and: unknown[] }; overrideAccess: boolean; req: unknown };
    expect(args.collection).toBe("payload-jobs");
    expect(args.overrideAccess).toBe(true);
    expect(args.req).toBe(req);
    expect(args.where.and).toEqual(
      expect.arrayContaining([{ taskSlug: { equals: REINDEX_RENTALS_SEARCH_SLUG } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }, { "input.scope": { equals: "province" } }]),
    );
    // Job đang chạy (processing) vẫn tính là "đang dựng lại": không lọc processing.
    expect(JSON.stringify(args.where)).not.toContain("processing");
  });

  it("bản ghi chưa có id (form tạo mới) → false, không truy vấn", async () => {
    expect(await read(makeReq("admin"), undefined)).toBe(false);
    expect(find).not.toHaveBeenCalled();
  });

  it("config không có Payload Jobs (test nạp một phần collection) → false, không truy vấn, không ném", async () => {
    expect(await read(makeReq("admin", {}), "p1")).toBe(false);
    expect(find).not.toHaveBeenCalled();
  });
});

describe("markSearchReindexPending (doc trả về của hook afterChange sau lần lưu xếp job)", () => {
  const doc = { id: "p1", name: "x" };

  it("'queued' + admin đang hoạt động → bản sao doc có searchReindexPending: true (không đổi doc gốc)", () => {
    expect(markSearchReindexPending(doc, makeReq("admin"), "queued")).toEqual({ ...doc, searchReindexPending: true });
    expect(doc).not.toHaveProperty("searchReindexPending");
  });

  it("'queued' nhưng không phải admin / admin bị khoá / không đăng nhập → trả đúng doc gốc", () => {
    expect(markSearchReindexPending(doc, makeReq("sale"), "queued")).toBe(doc);
    expect(markSearchReindexPending(doc, makeReq(), "queued")).toBe(doc);
    expect(markSearchReindexPending(doc, { user: { role: "admin", active: false } } as unknown as PayloadRequest, "queued")).toBe(doc);
  });

  it("dựng lại đồng bộ (kết quả { rentals, rows }) hoặc 'deferred' → trả đúng doc gốc", () => {
    expect(markSearchReindexPending(doc, makeReq("admin"), { rentals: 3, rows: 6 })).toBe(doc);
    expect(markSearchReindexPending(doc, makeReq("admin"), "deferred")).toBe(doc);
  });
});

describe("searchReindexPendingField", () => {
  it("field ảo checkbox, chỉ admin đọc, không ghi, hiện bằng component cảnh báo", () => {
    const field = searchReindexPendingField("ward");
    expect(field).toMatchObject({ name: "searchReindexPending", type: "checkbox", virtual: true });
    expect(field.admin?.components?.Field).toBe("/components/admin/SearchReindexPendingWarning#SearchReindexPendingWarning");
    const access = field.access as { read: (args: unknown) => boolean; create: () => boolean; update: () => boolean };
    expect(access.read({ req: { user: { role: "admin", active: true } } })).toBe(true);
    expect(access.read({ req: { user: { role: "sale", active: true } } })).toBe(false);
    expect(access.read({ req: { user: { role: "admin", active: false } } })).toBe(false);
    expect(access.read({ req: {} })).toBe(false);
    expect(access.create()).toBe(false);
    expect(access.update()).toBe(false);
  });
});
