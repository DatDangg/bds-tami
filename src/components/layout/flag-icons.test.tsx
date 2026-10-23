import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlagIcon } from "./flag-icons";

describe("FlagIcon: cờ chữ nhật SVG inline cho nút đổi ngôn ngữ", () => {
  it.each(["vi", "en"] as const)("cờ %s: svg 3:2 (30×20), trang trí (aria-hidden, không focus), có data-flag", (locale) => {
    const { container } = render(<FlagIcon locale={locale} className="h-3.5 w-[21px]" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "0 0 30 20");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-flag", locale);
    expect(svg).toHaveClass("h-3.5", "w-[21px]");
    expect(svg?.textContent?.trim()).toBe("");
  });

  it("cờ VN có nền đỏ + sao vàng; cờ UK có nền xanh + chéo/thập đỏ", () => {
    const vn = render(<FlagIcon locale="vi" />).container;
    expect(vn.querySelector('rect[fill="#DA251D"]')).not.toBeNull();
    const star = vn.querySelector('polygon[fill="#FFFF00"]');
    expect(star).not.toBeNull();
    const pts = (star?.getAttribute("points") ?? "").split(" ").map((p) => p.split(",").map(Number) as [number, number]);
    expect(pts).toHaveLength(10);
    expect(pts[0]).toEqual([15, 3.33]); // đỉnh trên, hướng lên
    const xs = pts.map(([x]) => x);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(15, 1); // cân giữa ngang
    const uk = render(<FlagIcon locale="en" />).container;
    expect(uk.querySelector('rect[fill="#012169"]')).not.toBeNull();
    expect(uk.querySelectorAll('[stroke="#C8102E"]').length).toBeGreaterThan(0);
  });
});
