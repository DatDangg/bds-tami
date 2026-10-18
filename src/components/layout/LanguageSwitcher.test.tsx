import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { LanguageSwitcher } from "./LanguageSwitcher";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

function renderSwitcher(locale: "vi" | "en", path: string) {
  pathname.current = path;
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi_ : en}>
      <LanguageSwitcher />
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
