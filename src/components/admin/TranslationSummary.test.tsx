import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const form = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));

vi.mock("@payloadcms/ui", () => ({
  useFormFields: (select: (state: [Record<string, { value: unknown }>]) => unknown) =>
    select([Object.fromEntries(Object.entries(form.values).map(([key, value]) => [key, { value }]))]),
}));

import { TranslationSummary } from "./TranslationSummary";

const show = (values: Record<string, unknown>) => {
  form.values = Object.fromEntries(Object.entries(values).map(([key, value]) => [`translation.${key}`, value]));
  return render(<TranslationSummary />);
};

describe("TranslationSummary", () => {
  it("chưa có dữ liệu -> chưa dịch", () => {
    show({});
    expect(screen.getByText("Bản tiếng Anh: chưa dịch")).toBeInTheDocument();
  });

  it("đã dịch tự động -> kèm giờ Việt Nam", () => {
    show({ status: "done", enSource: "ai", translatedAt: "2026-10-20T08:30:00.000Z" });
    expect(screen.getByText("Bản tiếng Anh: đã dịch tự động lúc 20/10/2026 15:30")).toBeInTheDocument();
  });

  it("đã sửa tay + tiếng Việt đổi sau đó -> có cảnh báo", () => {
    show({ status: "done", enSource: "manual", viChangedAfterManual: true });
    expect(screen.getByText("Bản tiếng Anh: đã sửa tay")).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toContain("nên kiểm tra lại");
  });

  it("dịch lỗi -> đổi mã lỗi sang câu tiếng Việt", () => {
    show({ status: "failed", lastError: "provider_unavailable" });
    expect(screen.getByText("Bản tiếng Anh: dịch lỗi — Dịch vụ dịch tạm thời không khả dụng")).toBeInTheDocument();
  });

  it("dịch lỗi với mã lạ -> câu chung, không lộ mã thô", () => {
    show({ status: "failed", lastError: "weird_code_xyz" });
    expect(screen.getByText("Bản tiếng Anh: dịch lỗi — không dịch được, thử dịch lại sau")).toBeInTheDocument();
  });

  it.each([
    ["queued", "Bản tiếng Anh: đang chờ dịch"],
    ["pending_review", "Bản tiếng Anh: chờ duyệt"],
    ["failed", "Bản tiếng Anh: dịch lỗi"],
  ])("trạng thái %s", (status, text) => {
    show({ status });
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
