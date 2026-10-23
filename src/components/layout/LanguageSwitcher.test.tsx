import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { LanguageSwitcher } from "./LanguageSwitcher";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function renderSwitcher(locale: "vi" | "en", path: string, tone?: "on-light" | "on-dark") {
  pathname.current = path;
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi_ : en}>
      <LanguageSwitcher tone={tone} />
    </NextIntlClientProvider>,
  );
}

const otherHref = (name: string) => screen.getByRole("link", { name }).getAttribute("href");

describe("LanguageSwitcher: trang tương ứng", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("trang cố định: link thẳng tới đường dẫn dịch của ngôn ngữ kia (vi → en và en → vi)", () => {
    const first = renderSwitcher("vi", "/cho-thue");
    expect(otherHref("English")).toBe("/en/for-rent");
    first.unmount();
    renderSwitcher("en", "/en/careers");
    expect(otherHref("Tiếng Việt")).toBe("/tuyen-dung");
  });

  it("trang chi tiết: link đi qua endpoint tra bản ghi, mang đường dẫn hiện tại; ngôn ngữ đang xem vẫn về chính trang", () => {
    renderSwitcher("en", "/en/for-rent/apartment-a");
    const url = new URL(otherHref("Tiếng Việt") ?? "", "http://localhost");
    expect(url.pathname).toBe("/api/locale-counterpart");
    expect(url.searchParams.get("to")).toBe("vi");
    expect(url.searchParams.get("path")).toBe("/en/for-rent/apartment-a");
    expect(otherHref("English")).toBe("/en/for-rent/apartment-a");
  });
});

describe("LanguageSwitcher: cờ vuông thay chữ VI | EN (BL-063)", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("mỗi link chứa đúng 1 cờ SVG khớp ngôn ngữ, không còn chữ VI/EN hay ngăn |", () => {
    renderSwitcher("vi", "/");
    const viLink = screen.getByRole("link", { name: "Tiếng Việt" });
    const enLink = screen.getByRole("link", { name: "English" });
    expect(viLink.querySelectorAll("svg[data-flag]")).toHaveLength(1);
    expect(viLink.querySelector("svg[data-flag]")).toHaveAttribute("data-flag", "vi");
    expect(enLink.querySelectorAll("svg[data-flag]")).toHaveLength(1);
    expect(enLink.querySelector("svg[data-flag]")).toHaveAttribute("data-flag", "en");
    expect(viLink.textContent?.trim()).toBe("");
    expect(enLink.textContent?.trim()).toBe("");
    expect(screen.getByRole("group").textContent?.trim()).toBe("");
  });

  it("ngôn ngữ đang xem: aria-current + ring mảnh 1.5px; ngôn ngữ kia mờ 60%, không aria-current", () => {
    renderSwitcher("en", "/en");
    const current = screen.getByRole("link", { name: "English" });
    const other = screen.getByRole("link", { name: "Tiếng Việt" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current.querySelector("[data-flag]")?.parentElement).toHaveClass("ring-[1.5px]", "ring-offset-1");
    expect(current.querySelector("[data-flag]")?.parentElement).toHaveClass("h-3.5", "w-[21px]");
    expect(current).not.toHaveClass("opacity-60");
    expect(other).not.toHaveAttribute("aria-current");
    expect(other).toHaveClass("opacity-60", "hover:opacity-100", "focus-visible:opacity-100");
    for (const link of [current, other]) expect(link).toHaveClass("min-h-11", "min-w-11");
  });

  it("title + aria-label là tên ngôn ngữ theo locale đang xem; hreflang/lang giữ nguyên", () => {
    renderSwitcher("vi", "/");
    const viLink = screen.getByRole("link", { name: "Tiếng Việt" });
    const enLink = screen.getByRole("link", { name: "English" });
    expect(viLink).toHaveAttribute("title", "Tiếng Việt");
    expect(viLink).toHaveAttribute("aria-label", "Tiếng Việt");
    expect(viLink).toHaveAttribute("hreflang", "vi");
    expect(viLink).toHaveAttribute("lang", "vi");
    expect(enLink).toHaveAttribute("title", "English");
    expect(enLink).toHaveAttribute("hreflang", "en");
    expect(enLink).toHaveAttribute("lang", "en");
  });

  it("tone=on-dark đổi màu ring-offset của cờ đang chọn (mặc định on-light)", () => {
    const light = renderSwitcher("vi", "/");
    const lightFrame = screen.getByRole("link", { name: "Tiếng Việt" }).querySelector("[data-flag]")?.parentElement;
    expect(lightFrame).toHaveClass("ring-offset-glass");
    expect(lightFrame).not.toHaveClass("ring-offset-dark");
    light.unmount();
    renderSwitcher("vi", "/", "on-dark");
    const darkFrame = screen.getByRole("link", { name: "Tiếng Việt" }).querySelector("[data-flag]")?.parentElement;
    expect(darkFrame).toHaveClass("ring-offset-dark");
    expect(darkFrame).not.toHaveClass("ring-offset-glass");
  });
});
