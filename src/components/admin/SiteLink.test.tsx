import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/env", () => ({ getEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://tami.example" }) }));

import { SiteLink } from "./SiteLink";

describe("SiteLink (nút Xem website)", () => {
  it("trỏ tới NEXT_PUBLIC_SITE_URL, mở tab mới an toàn, có chữ và aria-label", () => {
    render(<SiteLink />);
    const link = screen.getByRole("link", { name: /Xem website/ });
    expect(link.getAttribute("href")).toBe("https://tami.example");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain("Xem website");
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
