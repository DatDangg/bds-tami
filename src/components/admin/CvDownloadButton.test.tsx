import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const formState = vi.hoisted(() => ({ cv: undefined as unknown }));

vi.mock("@payloadcms/ui", () => ({
  useFormFields: (select: (state: [Record<string, { value: unknown }>]) => unknown) => select([{ cv: { value: formState.cv } }]),
}));

import { CvDownloadButton, cvDownloadPath } from "./CvDownloadButton";

const CV_ID = "0a1b2c3d-1111-2222-3333-444455556666";

describe("cvDownloadPath", () => {
  it("UUID hợp lệ -> đường dẫn endpoint admin", () => {
    expect(cvDownloadPath(CV_ID)).toBe(`/api/admin/private-files/${CV_ID}/download`);
  });

  it("rỗng, không phải chuỗi hoặc không phải UUID -> không có nút", () => {
    expect(cvDownloadPath(null)).toBeNull();
    expect(cvDownloadPath(undefined)).toBeNull();
    expect(cvDownloadPath("../../x")).toBeNull();
    expect(cvDownloadPath({ id: "x" })).toBeNull();
  });
});

describe("CvDownloadButton", () => {
  it("có CV -> liên kết tải về trỏ đúng endpoint có kiểm quyền", () => {
    formState.cv = CV_ID;
    render(<CvDownloadButton />);
    const link = screen.getByRole("link", { name: "Tải CV" });
    expect(link.getAttribute("href")).toBe(`/api/admin/private-files/${CV_ID}/download`);
    expect(link.hasAttribute("download")).toBe(true);
  });

  it("hồ sơ đã ẩn danh (không còn CV) -> không có nút, có thông báo", () => {
    formState.cv = null;
    render(<CvDownloadButton />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(/CV đã được xoá/)).toBeTruthy();
  });
});
