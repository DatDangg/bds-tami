import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u-sale", role: "sale" } as { id: string; role: string } | null,
  permissions: { collections: { news: { create: true, update: true, delete: true }, pages: { create: true, update: true, delete: true } } } as Record<string, unknown>,
  disableDuplicate: false,
  drawerSlug: undefined as string | undefined,
  push: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
  confirm: undefined as undefined | (() => Promise<void> | void),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, refresh: state.refresh }) }));
vi.mock("@payloadcms/ui", () => ({
  useAuth: () => ({ user: state.user, permissions: state.permissions }),
  useConfig: () => ({ config: { routes: { admin: "/admin", api: "/api" } }, getEntityConfig: () => ({ disableDuplicate: state.disableDuplicate }) }),
  useLocale: () => ({ code: "vi" }),
  useListDrawerContext: () => ({ drawerSlug: state.drawerSlug }),
  useModal: () => ({ openModal: state.openModal, closeModal: state.closeModal }),
  toast: { error: state.toastError, success: state.toastSuccess },
  Link: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  ConfirmationModal: ({ onConfirm, body, heading }: { onConfirm: () => Promise<void> | void; body: string; heading: string }) => {
    state.confirm = onConfirm;
    return (
      <div data-testid="confirm">
        {heading}|{body}
      </div>
    );
  },
}));

import { RowActions, type RowActionsRow } from "./RowActions";

const SITE = "https://tami.test";
const row = (over: Partial<RowActionsRow> = {}): RowActionsRow => ({ id: "n1", author: "u-sale", slug: "bai-1", status: "published", title: "Bài 1", ...over });
const view = (r: RowActionsRow, props: { slug?: string; inTrash?: boolean } = {}) => render(<RowActions collectionSlug={props.slug ?? "news"} row={r} inTrash={props.inTrash ?? false} siteUrl={SITE} />);
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: "u-sale", role: "sale" };
  state.disableDuplicate = false;
  state.drawerSlug = undefined;
  state.confirm = undefined;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ doc: { id: "copy1" } }) });
});

describe("RowActions (BL-051 A12)", () => {
  it("sale, dòng của mình (author id): đủ 4 nút; Xem trên web mở tab mới", () => {
    view(row());
    expect(screen.getByRole("link", { name: /Xem trên web/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Sửa" })).toHaveAttribute("href", "/admin/collections/news/n1");
    expect(screen.getByRole("button", { name: "Nhân bản" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chuyển vào Thùng rác" })).toBeInTheDocument();
  });

  it("sale, dòng của mình (author populate): vẫn Sửa + Xoá", () => {
    view(row({ author: { id: "u-sale", fullName: "A" } }));
    expect(screen.getByRole("link", { name: "Sửa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chuyển vào Thùng rác" })).toBeInTheDocument();
  });

  it("sale, dòng của người khác: không Sửa/Xoá, còn Nhân bản + Xem web", () => {
    view(row({ author: { id: "u-other" } }));
    expect(screen.queryByRole("link", { name: "Sửa" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Chuyển vào Thùng rác" })).toBeNull();
    expect(screen.getByRole("button", { name: "Nhân bản" })).toBeInTheDocument();
  });

  it("Xem trên web chỉ khi công khai: bản nháp → không có", () => {
    view(row({ status: "draft" }));
    expect(screen.queryByRole("link", { name: /Xem trên web/ })).toBeNull();
  });

  it("Thùng rác / dòng đã xoá / trong drawer chọn quan hệ → không render", () => {
    expect(view(row(), { inTrash: true }).container).toBeEmptyDOMElement();
    expect(view(row({ deletedAt: "2026-01-01" })).container).toBeEmptyDOMElement();
    state.drawerSlug = "list-drawer";
    expect(view(row()).container).toBeEmptyDOMElement();
  });

  it("collection disableDuplicate (Trang pháp lý): admin không có Nhân bản", () => {
    state.user = { id: "u-admin", role: "admin" };
    state.disableDuplicate = true;
    view(row({ author: undefined, kind: "privacy-policy" }), { slug: "pages" });
    expect(screen.queryByRole("button", { name: "Nhân bản" })).toBeNull();
    expect(screen.getByRole("link", { name: "Sửa" })).toBeInTheDocument();
  });

  it("Nhân bản: POST duplicate rồi mở bản sao", async () => {
    view(row());
    fireEvent.click(screen.getByRole("button", { name: "Nhân bản" }));
    await waitFor(() => expect(state.push).toHaveBeenCalledWith("/admin/collections/news/copy1?locale=vi"));
    expect(fetchMock).toHaveBeenCalledWith("/api/news/n1/duplicate?locale=vi", expect.objectContaining({ method: "POST" }));
  });

  it("Xoá: mở hộp xác nhận (tên bài trong nội dung), xác nhận mới PATCH deletedAt rồi làm mới danh sách", async () => {
    view(row());
    fireEvent.click(screen.getByRole("button", { name: "Chuyển vào Thùng rác" }));
    expect(state.openModal).toHaveBeenCalledWith("row-trash-news-n1");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("confirm").textContent).toContain("Bài 1");
    await state.confirm?.();
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string }];
    expect(url).toBe("/api/news/n1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ deletedAt: expect.any(String) });
    expect(state.refresh).toHaveBeenCalled();
    expect(state.toastSuccess).toHaveBeenCalledWith("Đã chuyển vào Thùng rác.");
  });

  it("server từ chối (403) → toast tiếng Việt, không làm mới, không vỡ trang", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ errors: [{ message: "You are not allowed to perform this action." }] }) });
    view(row());
    fireEvent.click(screen.getByRole("button", { name: "Chuyển vào Thùng rác" }));
    await state.confirm?.();
    expect(state.toastError).toHaveBeenCalledWith("Bạn không có quyền thực hiện thao tác này.");
    expect(state.refresh).not.toHaveBeenCalled();
  });

  it("lỗi mạng khi nhân bản → toast tiếng Việt", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    view(row());
    fireEvent.click(screen.getByRole("button", { name: "Nhân bản" }));
    await waitFor(() => expect(state.toastError).toHaveBeenCalledWith("Không thực hiện được. Vui lòng thử lại."));
    expect(state.push).not.toHaveBeenCalled();
  });
});
