import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "./Icon";
import { Logo } from "./Logo";

function sourcePaths(images: HTMLElement[]) {
  return images.map((img) => decodeURIComponent(img.getAttribute("src") ?? ""));
}

describe("Logo admin", () => {
  it("hiện logo TAMI HOMES bản vàng (nền sáng) và trắng (nền tối), alt đúng", () => {
    render(<Logo />);
    const images = screen.getAllByAltText("TAMI HOMES");
    expect(images).toHaveLength(2);
    const paths = sourcePaths(images).join(" ");
    expect(paths).toContain("/brand/tami-logo-gold.png");
    expect(paths).toContain("/brand/tami-logo-white.png");
  });
});

describe("Icon admin", () => {
  it("hiện biểu tượng mái nhà bản vàng và trắng, alt đúng", () => {
    render(<Icon />);
    const images = screen.getAllByAltText("TAMI HOMES");
    expect(images).toHaveLength(2);
    const paths = sourcePaths(images).join(" ");
    expect(paths).toContain("/brand/tami-icon-gold.png");
    expect(paths).toContain("/brand/tami-icon-white.png");
  });
});
