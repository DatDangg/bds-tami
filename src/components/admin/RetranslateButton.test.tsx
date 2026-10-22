import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u1", role: "admin" } as { id: string; role: string } | null,
  doc: { id: "n1", collectionSlug: "news", globalSlug: undefined } as { id?: string; collectionSlug?: string; globalSlug?: string },
  openModal: vi.fn(),
  closeModal: vi.fn(),
  confirm: undefined as undefined | (() => Promise<void> | void),
}));

vi.mock("@payloadcms/ui", () => ({
  useAuth: () => ({ user: state.user }),
  useDocumentInfo: () => state.doc,
  useFormFields: (select: (arg: [Record<string, { value?: unknown }>]) => unknown) => select([{ author: { value: "u1" } }]),
  useModal: () => ({ openModal: state.openModal, closeModal: state.closeModal }),
  ConfirmationModal: ({ onConfirm, heading, body, confirmLabel, cancelLabel, modalSlug }: Record<string, unknown> & { onConfirm: () => Promise<void> | void }) => {
    state.confirm = onConfirm;
    return (
      <div data-testid="confirm" data-slug={String(modalSlug)}>
        {String(heading)}|{String(body)}|{String(confirmLabel)}|{String(cancelLabel)}
      </div>
    );
  },
}));

import { RetranslateButton } from "./RetranslateButton";

const fetchMock = vi.fn();
const confirmSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: "u1", role: "admin" };
  state.doc = { id: "n1", collectionSlug: "news" };
  state.confirm = undefined;
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("confirm", confirmSpy);
  fetchMock.mockResolvedValue({ status: 202, headers: new Headers() });
});

describe("RetranslateButton (BL-058)", () => {
  it("bấm nút mở modal admin, không gọi window.confirm và chưa gọi fetch", () => {
    render(<RetranslateButton />);
    fireEvent.click(screen.getByRole("button", { name: "Dịch lại bằng AI" }));
    expect(state.openModal).toHaveBeenCalledWith("retranslate-news-n1");
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("confirm")).toHaveTextContent("Dịch lại bằng AI|Dịch lại toàn bộ bản tiếng Anh bằng AI? Bản đã sửa tay sẽ bị ghi đè.|Dịch lại|Huỷ");
  });

  it("Huỷ (không gọi onConfirm) thì không có request nào", () => {
    render(<RetranslateButton />);
    fireEvent.click(screen.getByRole("button", { name: "Dịch lại bằng AI" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("Xác nhận gửi POST đúng URL một lần và hiện thông báo 202", async () => {
    render(<RetranslateButton />);
    await state.confirm?.();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Đã gửi yêu cầu dịch lại"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/translations/news/n1", { method: "POST", credentials: "same-origin" });
    expect(state.closeModal).toHaveBeenCalledWith("retranslate-news-n1");
  });

  it("lỗi 403 và lỗi mạng hiện role=alert", async () => {
    fetchMock.mockResolvedValueOnce({ status: 403, headers: new Headers() });
    render(<RetranslateButton />);
    await state.confirm?.();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Bạn không có quyền dịch lại"));
    fetchMock.mockRejectedValueOnce(new Error("net"));
    await state.confirm?.();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Không thể dịch lại lúc này"));
  });

  it("global: URL globals/<slug>, modal slug theo global", async () => {
    state.doc = { globalSlug: "home" };
    render(<RetranslateButton />);
    fireEvent.click(screen.getByRole("button", { name: "Dịch lại bằng AI" }));
    expect(state.openModal).toHaveBeenCalledWith("retranslate-global-home");
    await state.confirm?.();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/translations/globals/home", expect.objectContaining({ method: "POST" }));
  });

  it("chưa lưu bản ghi hoặc không đủ quyền thì ẩn", () => {
    state.doc = { collectionSlug: "news" };
    const { container } = render(<RetranslateButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
