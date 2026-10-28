import type { Access, Where } from "payload";
import { describe, expect, it } from "vitest";

import { buildPublicWhere, makePublishedOnly, PUBLIC_STATUSES } from "./publishedOnly";

const NOW = new Date("2026-10-28T03:00:00.000Z");
const argsFor = (user: object | null) => ({ req: { user } }) as unknown as Parameters<Access>[0];

describe("buildPublicWhere", () => {
  it("không option: where y hệt cũ (Dự án / Cho thuê / Tin BĐS / Tuyển dụng không có điều kiện hẹn giờ)", () => {
    const legacy: Where = { and: [{ status: { in: ["published"] } }, { deletedAt: { exists: false } }] };
    expect(buildPublicWhere(PUBLIC_STATUSES.default)).toEqual(legacy);
    expect(buildPublicWhere(PUBLIC_STATUSES.default, {})).toEqual(legacy);
    expect(buildPublicWhere(PUBLIC_STATUSES.default, { now: NOW })).toEqual(legacy);
    expect(buildPublicWhere(PUBLIC_STATUSES.rentals)).toEqual({ and: [{ status: { in: ["published", "rented"] } }, { deletedAt: { exists: false } }] });
  });

  it("scheduled: thêm publishedAt trống hoặc ≤ now", () => {
    expect(buildPublicWhere(PUBLIC_STATUSES.default, { scheduled: true, now: NOW })).toEqual({
      and: [
        { status: { in: ["published"] } },
        { deletedAt: { exists: false } },
        { or: [{ publishedAt: { exists: false } }, { publishedAt: { less_than_equal: "2026-10-28T03:00:00.000Z" } }] },
      ],
    });
  });

  it("scheduled không có now: lấy giờ hiện tại lúc gọi (mỗi request)", () => {
    const before = Date.now();
    const where = buildPublicWhere(PUBLIC_STATUSES.default, { scheduled: true }) as { and: Array<{ or?: Array<{ publishedAt?: { less_than_equal?: string } }> }> };
    const bound = new Date(where.and[2]?.or?.[1]?.publishedAt?.less_than_equal ?? "").getTime();
    expect(bound).toBeGreaterThanOrEqual(before);
    expect(bound).toBeLessThanOrEqual(Date.now());
  });
});

describe("makePublishedOnly", () => {
  it("khách: where (có hẹn giờ khi bật); staff active: true; tài khoản khoá: false", () => {
    const plain = makePublishedOnly(PUBLIC_STATUSES.default);
    const scheduled = makePublishedOnly(PUBLIC_STATUSES.default, { scheduled: true, now: NOW });
    expect(plain(argsFor(null))).toEqual(buildPublicWhere(PUBLIC_STATUSES.default));
    expect(scheduled(argsFor(null))).toEqual(buildPublicWhere(PUBLIC_STATUSES.default, { scheduled: true, now: NOW }));
    expect(scheduled(argsFor({ active: true }))).toBe(true);
    expect(scheduled(argsFor({ active: false }))).toBe(false);
  });
});
