import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import NotFoundPage from "./not-found";
import UnmatchedPage from "./[...rest]/page";

const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

describe("404 theo ngôn ngữ", () => {
  it("/en/khong-ton-tai: URL không khớp route nào thì catch-all gọi notFound() (Next trả 404 + not-found của [locale])", () => {
    expect(() => UnmatchedPage()).toThrow(
      expect.objectContaining({ digest: expect.stringContaining("NEXT_HTTP_ERROR_FALLBACK;404") }),
    );
  });

  it("EN: toàn tiếng Anh, link về /en, không còn chữ tiếng Việt", () => {
    const { container } = renderWithIntl(<NotFoundPage />, "en");
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: "Browse rentals" })).toHaveAttribute("href", "/en/for-rent");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/en/contact");
    expect(container.textContent).not.toMatch(VIETNAMESE);
  });

  it("VI: tiếng Việt, link về /", () => {
    renderWithIntl(<NotFoundPage />, "vi");
    expect(screen.getByRole("heading", { level: 1, name: "Không tìm thấy trang" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
  });
});
