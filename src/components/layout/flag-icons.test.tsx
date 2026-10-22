import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlagIcon } from "./flag-icons";

describe("FlagIcon: cờ vuông SVG inline cho nút đổi ngôn ngữ", () => {
  it.each(["vi", "en"] as const)("cờ %s: svg vuông 24×24, trang trí (aria-hidden, không focus), có data-flag", (locale) => {
    const { container } = render(<FlagIcon locale={locale} className="size-6" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-flag", locale);
    expect(svg).toHaveClass("size-6");
    expect(svg?.textContent?.trim()).toBe("");
  });

  it("cờ VN có nền đỏ + sao vàng; cờ UK có nền xanh + chéo/thập đỏ", () => {
    const vn = render(<FlagIcon locale="vi" />).container;
    expect(vn.querySelector('rect[fill="#DA251D"]')).not.toBeNull();
    expect(vn.querySelector('polygon[fill="#FFFF00"]')).not.toBeNull();
    const uk = render(<FlagIcon locale="en" />).container;
    expect(uk.querySelector('rect[fill="#012169"]')).not.toBeNull();
    expect(uk.querySelectorAll('[stroke="#C8102E"]').length).toBeGreaterThan(0);
  });
});
