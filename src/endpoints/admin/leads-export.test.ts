import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { RateLimitUnavailableError } from "../../lib/security/rate-limit";
import type { Lead } from "../../payload-types";
import { handleLeadsExport, toExportRow } from "./leads-export";

const allowed = vi.fn(async () => ({ allowed: true as const, remaining: 9 }));

function fakeRequest(role: string, count = 0) {
  const create = vi.fn(async () => ({}));
  const countFn = vi.fn(async () => ({ totalDocs: count }));
  const find = vi.fn(async () => ({ docs: [], hasNextPage: false }));
  const req = {
    url: "http://localhost/api/admin/leads/export",
    user: { id: "u1", role, active: true, collection: "staff" },
    headers: new Headers(),
    payload: { create, count: countFn, find },
  } as unknown as PayloadRequest;
  return { req, create, countFn, find };
}

const lead = (overrides: Partial<Lead> = {}) =>
  ({
    id: "l1",
    code: "L-1",
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    email: "a@example.test",
    message: "xin chào",
    source: "rental",
    status: "new",
    locale: "vi",
    createdAt: "2026-10-18T03:00:00.000Z",
    ...overrides,
  }) as Lead;

describe("handleLeadsExport", () => {
  it("quá trần số dòng -> 422, không ghi audit, không đọc dòng nào", async () => {
    const { req, create, find } = fakeRequest("admin", 11);
    const response = await handleLeadsExport(req, allowed, 10);
    expect(response.status).toBe(422);
    expect(create).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("Redis lỗi -> 503 (fail-closed), không đếm, không audit", async () => {
    const { req, create, countFn } = fakeRequest("admin");
    const response = await handleLeadsExport(req, async () => {
      throw new RateLimitUnavailableError(new Error("down"));
    });
    expect(response.status).toBe(503);
    expect(countFn).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("rate limit chặn -> 429 trước khi truy vấn lead", async () => {
    const { req, countFn } = fakeRequest("admin");
    const response = await handleLeadsExport(req, async () => ({ allowed: false as const, retryAfterSeconds: 90 }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(countFn).not.toHaveBeenCalled();
  });

  it("keyset: trang sau lọc theo (createdAt, id) của bản ghi cuối trang trước, không offset, dừng đúng total", async () => {
    const { req, find } = fakeRequest("admin", 3);
    const pages = [[lead({ id: "a", code: "L-a" }), lead({ id: "b", code: "L-b" })], [lead({ id: "c", code: "L-c", createdAt: "2026-10-18T04:00:00.000Z" })]];
    find.mockImplementation((async () => ({ docs: pages.shift() ?? [] })) as never);
    const response = await handleLeadsExport(req, allowed, 10, 2);
    expect(response.status).toBe(200);
    await response.arrayBuffer();
    const calls = find.mock.calls as unknown as [{ where: unknown; page?: number; pagination?: boolean; limit: number }][];
    expect(calls).toHaveLength(2);
    expect(calls[0]![0]).toMatchObject({ where: {}, pagination: false, limit: 2 });
    expect(calls[0]![0].page).toBeUndefined();
    expect(calls[1]![0].where).toEqual({
      and: [
        {},
        {
          or: [
            { createdAt: { greater_than: "2026-10-18T03:00:00.000Z" } },
            { and: [{ createdAt: { equals: "2026-10-18T03:00:00.000Z" } }, { id: { greater_than: "b" } }] },
          ],
        },
      ],
    });
  });

  it("sale -> 403 trước rate limit", async () => {
    const { req } = fakeRequest("sale");
    const limiter = vi.fn(allowed);
    expect((await handleLeadsExport(req, limiter)).status).toBe(403);
    expect(limiter).not.toHaveBeenCalled();
  });
});

describe("toExportRow", () => {
  it("lead thường: đủ cột, nhãn tiếng Việt, giờ Việt Nam", () => {
    const row = toExportRow(lead(), "Sale A");
    expect(row.slice(0, 3)).toEqual(["L-1", "Nguyễn Văn A", "0901234567"]);
    expect(row[5]).toBe("Tin cho thuê");
    expect(row[6]).toBe("Mới");
    expect(row[8]).toBe("Sale A");
    expect(String(row[9])).toContain("10:00");
  });

  it("lead đã ẩn danh: placeholder, email/lời nhắn trống dù còn dữ liệu", () => {
    const row = toExportRow(lead({ anonymizedAt: "2026-10-18T00:00:00.000Z" }), undefined);
    expect(row.slice(1, 5)).toEqual(["Đã ẩn danh", "Đã ẩn danh", "", ""]);
    expect(JSON.stringify(row)).not.toContain("0901234567");
  });
});
