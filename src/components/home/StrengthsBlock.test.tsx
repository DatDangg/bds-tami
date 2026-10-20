import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { StrengthsView } from "@/lib/home/home-view";
import { StrengthsBlock } from "./StrengthsBlock";

describe("StrengthsBlock (BL-044)", () => {
  it("hai mục giống hệt nhau vẫn dựng đủ, không cảnh báo trùng key", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const same = { icon: "map-pin" as const, title: "Vị trí đắc địa", description: "Kết nối thuận tiện" };
    const block: StrengthsView = { kind: "strengths", items: [same, { ...same }] };
    renderWithIntl(<StrengthsBlock block={block} />);
    expect(screen.getAllByRole("heading", { level: 3, name: "Vị trí đắc địa" })).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
