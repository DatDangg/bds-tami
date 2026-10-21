import { act, fireEvent, render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown }));
vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value }) }));

import { JobDeadlineCell, JobDeadlineNotice } from "./JobDeadlineDisplay";
import { RentalCodeBanner, RentalCodeHiddenField } from "./RentalCodeDisplay";
import { PrivacyPolicyVersionField } from "./SiteSettingsDisplay";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RentalCodeBanner", () => {
  it("tạo mới (chưa có mã) → nhắc mã tự tạo khi lưu, không nút", () => {
    field.value = undefined;
    render(<RentalCodeBanner />);
    expect(screen.getByText("Mã tin tự tạo khi lưu")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("có mã → hiện mã to + Sao chép qua Clipboard API, báo Đã sao chép", async () => {
    field.value = "CT-000123";
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<RentalCodeBanner />);
    expect(screen.getByText("CT-000123")).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sao chép" })));
    expect(writeText).toHaveBeenCalledWith("CT-000123");
    expect(screen.getByText("Đã sao chép")).toBeInTheDocument();
  });
  it("clipboard lỗi + execCommand lỗi → chọn sẵn chữ và báo", async () => {
    field.value = "CT-000123";
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) } });
    document.execCommand = vi.fn(() => false);
    render(<RentalCodeBanner />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Sao chép" })));
    expect(screen.getByText(/mã đã được chọn sẵn/)).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toBe("CT-000123");
  });
  it("field code gốc không vẽ ô nhập", () => {
    expect(render(<RentalCodeHiddenField />).container.textContent).toBe("");
  });
});

describe("Hạn tuyển dụng quá hạn", () => {
  const OVERDUE = "2026-10-19T12:00:00.000Z";
  const FUTURE = "2026-10-25T12:00:00.000Z";
  const setNow = () => vi.useFakeTimers({ now: new Date("2026-10-20T17:00:00.000Z"), toFake: ["Date"] });

  it("form: quá hạn → badge + câu tin đã tự ẩn", () => {
    setNow();
    field.value = OVERDUE;
    render(<JobDeadlineNotice path="deadline" />);
    expect(screen.getByText("Đã quá hạn")).toBeInTheDocument();
    expect(screen.getByText(/Tin đã tự ẩn khỏi website/)).toBeInTheDocument();
  });
  it("form: còn hạn / chưa có hạn → không hiện", () => {
    setNow();
    field.value = FUTURE;
    expect(render(<JobDeadlineNotice path="deadline" />).container.textContent).toBe("");
    field.value = undefined;
    expect(render(<JobDeadlineNotice path="deadline" />).container.textContent).toBe("");
  });
  it("danh sách: dd/MM/yyyy, quá hạn kèm badge", () => {
    setNow();
    const cell = (cellData: unknown) => <JobDeadlineCell {...({ cellData } as DefaultCellComponentProps)} />;
    const overdue = render(cell(OVERDUE));
    expect(overdue.container.textContent).toContain("19/10/2026");
    expect(screen.getByText("Đã quá hạn")).toBeInTheDocument();
    overdue.unmount();
    const open = render(cell(FUTURE));
    expect(open.container.textContent).toBe("25/10/2026");
  });
});

describe("PrivacyPolicyVersionField", () => {
  it("chữ nhỏ có phiên bản hiện tại", () => {
    field.value = "2026-09-01";
    render(<PrivacyPolicyVersionField path="privacyPolicyVersion" />);
    expect(screen.getByText("Phiên bản chính sách bảo mật hiện tại: 2026-09-01 (tự cập nhật khi xuất bản trang chính sách)")).toBeInTheDocument();
  });
  it("chưa có → câu thay thế", () => {
    field.value = undefined;
    render(<PrivacyPolicyVersionField path="privacyPolicyVersion" />);
    expect(screen.getByText(/Chưa có phiên bản chính sách bảo mật/)).toBeInTheDocument();
  });
});
