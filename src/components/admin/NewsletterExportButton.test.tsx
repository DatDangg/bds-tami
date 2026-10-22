import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { role: "admin" } as { role: string } | null,
  where: undefined as unknown,
  search: undefined as string | undefined,
  drawer: {} as { isInDrawer?: boolean },
}));

vi.mock("@payloadcms/ui", () => ({
  useAuth: () => ({ user: state.user }),
  useListQuery: () => ({ query: { where: state.where, search: state.search } }),
  useListDrawerContext: () => state.drawer,
}));

import { NewsletterExportButton, newsletterExportErrorMessage, newsletterExportQueryFromWhere, UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE } from "./NewsletterExportButton";

afterEach(() => {
  state.user = { role: "admin" };
  state.where = undefined;
  state.search = undefined;
  state.drawer = {};
  vi.unstubAllGlobals();
});

describe("newsletterExportQueryFromWhere", () => {
  it("không lọc -> query rỗng; Trạng thái là … (dạng or[0].and[] của Payload) -> ?status=", () => {
    expect(newsletterExportQueryFromWhere(undefined)).toEqual({ ok: true, query: "" });
    expect(newsletterExportQueryFromWhere({})).toEqual({ ok: true, query: "" });
    expect(newsletterExportQueryFromWhere({ or: [{ and: [{ status: { equals: "active" } }] }] })).toEqual({ ok: true, query: "status=active" });
  });

  it.each([
    ["ô tìm kiếm", { or: [] }, "khach"],
    ["field khác", { or: [{ and: [{ locale: { equals: "vi" } }] }] }, undefined],
    ["toán tử khác", { or: [{ and: [{ status: { in: ["active"] } }] }] }, undefined],
    ["giá trị lạ", { or: [{ and: [{ status: { equals: "spam" } }] }] }, undefined],
    ["hai điều kiện", { or: [{ and: [{ status: { equals: "active" } }, { status: { equals: "unsubscribed" } }] }] }, undefined],
    ["nhiều nhánh or", { or: [{ status: { equals: "active" } }, { status: { equals: "unsubscribed" } }] }, undefined],
  ])("%s -> khoá nút (không xuất rộng hơn danh sách)", (_label, where, search) => {
    expect(newsletterExportQueryFromWhere(where, search)).toEqual({ ok: false, reason: UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE });
  });
});

describe("newsletterExportErrorMessage", () => {
  it("theo mã lỗi", () => {
    expect(newsletterExportErrorMessage(429, "120")).toContain("2 phút");
    expect(newsletterExportErrorMessage(422, null)).toContain("Quá nhiều email");
    expect(newsletterExportErrorMessage(403, null)).toContain("không có quyền");
    expect(newsletterExportErrorMessage(500, null)).toContain("Thử lại sau");
  });
});

describe("NewsletterExportButton", () => {
  it("sale / list drawer -> không hiện nút", () => {
    state.user = { role: "sale" };
    const { container, rerender } = render(<NewsletterExportButton />);
    expect(container.innerHTML).toBe("");
    state.user = { role: "admin" };
    state.drawer = { isInDrawer: true };
    rerender(<NewsletterExportButton />);
    expect(container.innerHTML).toBe("");
  });

  it("admin + lọc trạng thái -> gọi endpoint với ?status=; lỗi 429 hiện role=alert", async () => {
    state.where = { or: [{ and: [{ status: { equals: "unsubscribed" } }] }] };
    const fetchMock = vi.fn(async () => new Response("{}", { status: 429, headers: { "Retry-After": "60" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<NewsletterExportButton />);
    fireEvent.click(screen.getByRole("button", { name: /Xuất Excel/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("1 phút"));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/newsletter-subscribers/export?status=unsubscribed", { credentials: "same-origin" });
  });

  it("có ô tìm kiếm -> nút khoá kèm lý do", () => {
    state.search = "khach";
    render(<NewsletterExportButton />);
    expect((screen.getByRole("button", { name: /Xuất Excel/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toBe(UNSUPPORTED_NEWSLETTER_FILTER_MESSAGE);
  });
});
