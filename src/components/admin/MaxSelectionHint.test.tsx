import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown, showError: false }));
vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value, showError: field.showError }) }));

import { MaxSelectionHint } from "./MaxSelectionHint";

const hint = () => render(<MaxSelectionHint path="rentals.categories" max={4} unit="danh mục" />);

describe("MaxSelectionHint", () => {
  it("chưa đủ giới hạn / chưa có giá trị → không hiện", () => {
    field.showError = false;
    field.value = ["a", "b", "c"];
    expect(hint().container.textContent).toBe("");
    field.value = undefined;
    expect(hint().container.textContent).toBe("");
  });

  it("đủ giới hạn → nhắc, không kiểu lỗi", () => {
    field.value = ["a", "b", "c", "d"];
    hint();
    const note = screen.getByRole("status");
    expect(note).toHaveTextContent("Tối đa 4 danh mục.");
    expect(note).not.toHaveAttribute("data-over-max");
  });

  it("vượt giới hạn → kiểu lỗi (data-over-max)", () => {
    field.value = ["a", "b", "c", "d", "e"];
    hint();
    expect(screen.getByRole("status")).toHaveAttribute("data-over-max", "true");
  });

  it("ô đang hiện lỗi server → ẩn để khỏi lặp chữ", () => {
    field.value = ["a", "b", "c", "d", "e"];
    field.showError = true;
    expect(hint().container.textContent).toBe("");
  });
});
