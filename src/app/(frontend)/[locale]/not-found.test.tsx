import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import NotFoundPage from "./not-found";

const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

describe("nội dung 404 theo ngôn ngữ", () => {
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
