import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeaderFrame } from "./HeaderFrame";

describe("HeaderFrame", () => {
  it("là landmark banner, dính đầu trang, nằm trong luồng (không fixed → không che nội dung, không CLS)", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("site-header", "sticky", "top-0");
    expect(header).not.toHaveClass("fixed");
    expect(header).not.toHaveClass("absolute");
    expect(header).not.toHaveAttribute("data-solid");
  });

  it("thanh nổi bo viên thuốc, kính mờ do lớp .site-header-bar; vùng lề không chặn chuột", () => {
    render(<HeaderFrame>nội dung header</HeaderFrame>);
    const bar = screen.getByText("nội dung header");
    expect(bar).toHaveClass("site-header-bar", "rounded-pill", "pointer-events-auto");
    expect(screen.getByRole("banner")).toHaveClass("pointer-events-none", "px-2", "py-2", "lg:px-4", "lg:py-4");
  });
});
