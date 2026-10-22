import type { PayloadRequest } from "payload";
import { describe, expect, it, vi } from "vitest";

import { LOCALE_LABELS } from "@/collections/NewsletterSubscribers";
import { handleNewsletterExport, NEWSLETTER_EXPORT_COLUMNS, toNewsletterExportRow } from "./newsletter-export";

const allowed = vi.fn(async () => ({ allowed: true as const, remaining: 9 }));

function fakeRequest(user: Record<string, unknown> | null, count = 0, query = "") {
  const create = vi.fn(async () => ({}));
  const countFn = vi.fn(async () => ({ totalDocs: count }));
  const find = vi.fn(async () => ({ docs: [] }));
  const req = {
    url: `http://localhost/api/admin/newsletter-subscribers/export${query}`,
    user: user ? { collection: "staff", ...user } : null,
    headers: new Headers(),
    payload: { create, count: countFn, find },
  } as unknown as PayloadRequest;
  return { req, create, countFn, find };
}

const admin = { id: "a1", role: "admin", active: true };

describe("handleNewsletterExport", () => {
  it("chưa đăng nhập / tài khoản khoá -> 401; sale -> 403; không truy vấn gì", async () => {
    for (const [user, status] of [
      [null, 401],
      [{ ...admin, active: false }, 401],
      [{ id: "s1", role: "sale", active: true }, 403],
    ] as const) {
      const { req, countFn, find } = fakeRequest(user);
      expect((await handleNewsletterExport(req, allowed)).status).toBe(status);
      expect(countFn).not.toHaveBeenCalled();
      expect(find).not.toHaveBeenCalled();
    }
  });

  it("status lạ -> 400; status hợp lệ lọc đúng + audit `newsletter.export` chỉ có bộ lọc + số dòng", async () => {
    expect((await handleNewsletterExport(fakeRequest(admin, 0, "?status=spam").req, allowed)).status).toBe(400);
    const { req, countFn, create } = fakeRequest(admin, 2, "?status=unsubscribed");
    const response = await handleNewsletterExport(req, allowed);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml");
    expect(response.headers.get("Content-Disposition")).toMatch(/attachment; filename="tami-ban-tin-\d{12}\.xlsx"/);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(countFn).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { equals: "unsubscribed" } }, overrideAccess: false }));
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "audit-logs", data: expect.objectContaining({ action: "newsletter.export", meta: { filters: { status: "unsubscribed" }, rowCount: 2 } }) }),
    );
    await response.arrayBuffer();
  });

  it("rate limit (chung `admin-export-excel`) chặn -> 429 trước khi đếm; quá trần -> 422 không audit", async () => {
    const limiter = vi.fn(async () => ({ allowed: false as const, retryAfterSeconds: 60 }));
    const limited = fakeRequest(admin);
    expect((await handleNewsletterExport(limited.req, limiter)).status).toBe(429);
    expect(limiter).toHaveBeenCalledWith("admin-export-excel", "a1");
    expect(limited.countFn).not.toHaveBeenCalled();

    const big = fakeRequest(admin, 11);
    expect((await handleNewsletterExport(big.req, allowed, 10)).status).toBe(422);
    expect(big.create).not.toHaveBeenCalled();
  });

  it("audit ghi lỗi -> 500, không có file (fail-closed)", async () => {
    const { req, create } = fakeRequest(admin, 1);
    create.mockRejectedValueOnce(new Error("db"));
    expect((await handleNewsletterExport(req, allowed)).status).toBe(500);
  });

  it("cột + dòng: email, ngôn ngữ, trạng thái tiếng Việt, ngày giờ VN, phiên bản, trang", () => {
    expect(NEWSLETTER_EXPORT_COLUMNS).toEqual(["Email", "Ngôn ngữ", "Trạng thái", "Ngày đăng ký", "Ngày đồng ý", "Phiên bản chính sách", "Trang đăng ký"]);
    const row = toNewsletterExportRow({
      id: "x",
      email: "khach@example.test",
      locale: "en",
      status: "unsubscribed",
      createdAt: "2026-10-22T03:00:00.000Z",
      consentAt: "2026-10-22T03:05:00.000Z",
      privacyPolicyVersion: "2026-10",
      sourcePath: "/en/news",
    });
    expect(row).toEqual(["khach@example.test", "Tiếng Anh", "Đã huỷ", "10:00 22/10/26", "10:05 22/10/26", "2026-10", "/en/news"]);
    // C8: cột "Ngôn ngữ" dùng chung nhãn với ô chọn của collection (không còn bản sao riêng).
    expect(row[1]).toBe(LOCALE_LABELS.en);
    expect(toNewsletterExportRow({ id: "y", email: "a@b.test", locale: "vi", status: "active", createdAt: "2026-10-22T03:00:00.000Z", consentAt: "2026-10-22T03:00:00.000Z", privacyPolicyVersion: "v", sourcePath: "/" })[1]).toBe(LOCALE_LABELS.vi);
  });
});
