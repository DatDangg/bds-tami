import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown, setValue: vi.fn() }));
vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value, setValue: field.setValue }) }));

import { PriceInWords } from "./PriceInWords";
import { SummaryCounter } from "./SummaryCounter";
import { TodayButton } from "./TodayButton";

describe("SummaryCounter", () => {
  it("đếm ký tự kèm gợi ý, ngoài khoảng thì đánh dấu", () => {
    field.value = "a".repeat(123);
    const { container } = render(<SummaryCounter path="summary" />);
    expect(screen.getByText("123 ký tự · nên 150–200 (hơi ngắn)")).toBeInTheDocument();
    expect(container.querySelector(".tami-field-hint--warn")).not.toBeNull();
  });
  it("trong khoảng thì không tô cảnh báo", () => {
    field.value = "a".repeat(180);
    const { container } = render(<SummaryCounter path="summary" />);
    expect(container.querySelector(".tami-field-hint--warn")).toBeNull();
  });
});

describe("PriceInWords", () => {
  it("hiện giá đọc bằng chữ có aria-live", () => {
    field.value = 3_500_000_000;
    render(<PriceInWords path="priceFromVnd" />);
    expect(screen.getByText("≈ 3,5 tỷ đồng")).toHaveAttribute("aria-live", "polite");
  });
  it("trống thì không có chữ", () => {
    field.value = undefined;
    const { container } = render(<PriceInWords path="priceFromVnd" />);
    expect(container.textContent).toBe("");
  });
});

describe("TodayButton", () => {
  it("bấm điền ngày hôm nay (type=button)", () => {
    field.setValue.mockClear();
    render(<TodayButton path="priceUpdatedAt" />);
    const button = screen.getByRole("button", { name: "Hôm nay" });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(field.setValue).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T12:00:00\.000Z$/));
  });
});
