import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { role: "admin" } as { role: string } | null,
  where: undefined as unknown,
  search: undefined as string | undefined,
  // Ngoài drawer Payload trả context mặc định `{}` (không có `isInDrawer`).
  drawer: {} as { isInDrawer?: boolean },
}));

vi.mock("@payloadcms/ui", () => ({
  useAuth: () => ({ user: state.user }),
  useListQuery: () => ({ query: { where: state.where, search: state.search } }),
  useListDrawerContext: () => state.drawer,
}));

import { exportErrorMessage, LeadExportButton } from "./LeadExportButton";

const SALE_ID = "0a1b2c3d-1111-4222-8333-444455556666";

afterEach(() => {
  vi.unstubAllGlobals();
  state.user = { role: "admin" };
  state.where = undefined;
  state.search = undefined;
  state.drawer = {};
});

describe("exportErrorMessage", () => {
  it("429 nói rõ số phút còn phải chờ, làm tròn lên", () => {
    expect(exportErrorMessage(429, "1800")).toContain("30 phút");
    expect(exportErrorMessage(429, "61")).toContain("2 phút");
    expect(exportErrorMessage(429, null)).toContain("1 phút");
  });
  it("các mã khác có thông báo riêng, mã lạ thì thông báo chung", () => {
    expect(exportErrorMessage(422, null)).toContain("Quá nhiều lead");
    expect(exportErrorMessage(403, null)).toContain("không có quyền");
    expect(exportErrorMessage(500, null)).toContain("Không thể xuất");
  });
});

describe("LeadExportButton", () => {
  it("sale và khách không thấy nút", () => {
    state.user = { role: "sale" };
    const { container, rerender } = render(<LeadExportButton />);
    expect(container.innerHTML).toBe("");
    state.user = null;
    rerender(<LeadExportButton />);
    expect(container.innerHTML).toBe("");
  });

  it("trong list drawer (chọn lead từ collection khác) không hiện nút: bộ lọc của drawer không nằm trong where", () => {
    state.drawer = { isInDrawer: true };
    const { container } = render(<LeadExportButton />);
    expect(container.innerHTML).toBe("");
  });

  it("khoảng ngày: chuyển nguyên giá trị DatePicker (T12:00:00.000Z) sang endpoint", async () => {
    state.where = {
      or: [{ and: [{ createdAt: { greater_than_equal: "2026-10-01T12:00:00.000Z" } }, { createdAt: { less_than_equal: "2026-10-05T12:00:00.000Z" } }] }],
    };
    const fetchMock = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/leads/export?createdFrom=2026-10-01T12%3A00%3A00.000Z&createdTo=2026-10-05T12%3A00%3A00.000Z",
      { credentials: "same-origin" },
    );
  });

  it("admin bấm: gọi endpoint với đúng bộ lọc của danh sách, tải file về", async () => {
    state.where = { or: [{ and: [{ status: { equals: "new" } }, { assignedTo: { equals: SALE_ID } }] }] };
    const fetchMock = vi.fn(async () => new Response("xlsx", { status: 200, headers: { "Content-Disposition": 'attachment; filename="tami-leads-20261018.xlsx"' } }));
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const clicked: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.download);
    });
    render(<LeadExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    await waitFor(() => expect(clicked).toEqual(["tami-leads-20261018.xlsx"]));
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/leads/export?status=new&assignedTo=${SALE_ID}`, { credentials: "same-origin" });
  });

  it.each([
    ["nhiều nhánh or", { or: [{ and: [{ status: { equals: "new" } }] }, { and: [{ status: { equals: "won" } }] }] }, undefined],
    ["toán tử in", { or: [{ and: [{ status: { in: ["new"] } }] }] }, undefined],
  ])("%s: khoá nút, báo rõ, không gọi endpoint (không xuất toàn bộ)", (_name, where, search) => {
    state.where = where;
    state.search = search;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    const button = screen.getByRole("button", { name: "Xuất Excel" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain('"lớn hơn hoặc bằng"');
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("có ô tìm kiếm: nút mở, gửi search kèm bộ lọc (SĐT có dấu cách giữ nguyên)", async () => {
    state.where = { or: [{ and: [{ status: { equals: "new" } }] }] };
    state.search = "0956 789 012";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    const button = screen.getByRole("button", { name: "Xuất Excel" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/leads/export?status=new&search=0956+789+012", { credentials: "same-origin" });
  });

  it("chỉ có ô tìm kiếm (không bộ lọc): vẫn xuất đúng tập đang tìm", async () => {
    state.search = "abc";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/leads/export?search=abc", { credentials: "same-origin" }));
  });

  it("search nguyên văn (NBSP cuối) được gửi đi, không bị trim", async () => {
    state.search = "an\u00a0";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/leads/export?search=an%C2%A0", { credentials: "same-origin" }));
  });

  it("search dài quá 100 ký tự: khoá nút, báo rõ, không gọi endpoint", () => {
    state.search = "a".repeat(101);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LeadExportButton />);
    const button = screen.getByRole("button", { name: "Xuất Excel" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Từ khoá tìm kiếm tối đa 100 ký tự");
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("search + bộ lọc không ánh xạ được: vẫn khoá nút", () => {
    state.where = { or: [{ and: [{ status: { in: ["new"] } }] }] };
    state.search = "abc";
    vi.stubGlobal("fetch", vi.fn());
    render(<LeadExportButton />);
    expect((screen.getByRole("button", { name: "Xuất Excel" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("server trả 429: hiện thông báo, không tải file", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429, headers: { "Retry-After": "600" } })));
    URL.createObjectURL = vi.fn(() => "blob:x");
    render(<LeadExportButton />);
    fireEvent.click(screen.getByRole("button", { name: "Xuất Excel" }));
    expect((await screen.findByRole("alert")).textContent).toContain("10 phút");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });
});
