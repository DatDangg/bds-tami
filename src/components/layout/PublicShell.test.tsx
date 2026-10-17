import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./cookie-settings-event";
import { PublicShell } from "./PublicShell";
import { buildFooterColumns, buildNavItems, type ShellView } from "./shell-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const shell: ShellView = {
  navItems: buildNavItems(null, "vi", vi_.layout.nav.items),
  contact: { hotline: { label: "0901 234 567", telHref: "tel:0901234567" }, email: "info@tami.vn", address: "Quận 1" },
  footer: {
    columns: buildFooterColumns(null, "vi", [
      { title: "Khám phá", links: [{ label: "Dự án", href: "/du-an", external: false }] },
    ]),
    tagline: "Giới thiệu ngắn",
    copyright: "© TAMI",
    socials: [
      { platform: "facebook", url: "https://facebook.com/tami" },
      { platform: "other", url: "https://example.com" },
    ],
  },
};

function renderShell(locale: "vi" | "en" = "vi") {
  const messages = locale === "vi" ? vi_ : en;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PublicShell shell={shell}>
        <h1>Nội dung</h1>
      </PublicShell>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  document.cookie = "NEXT_LOCALE=; Path=/; Max-Age=0";
});

describe("PublicShell", () => {
  it("skip link là phần tử focus đầu tiên và trỏ tới main#main", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.tab();
    const skip = screen.getByRole("link", { name: "Bỏ qua tới nội dung" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#main");
    expect(document.querySelector("main#main")).not.toBeNull();
    // phần tử tương tác đầu tiên trong DOM chính là skip link
    expect(document.querySelector("a[href], button")).toBe(skip);
  });

  it("đủ landmark: banner, nav có tên, main#main, contentinfo", () => {
    renderShell();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    for (const nav of screen.getAllByRole("navigation", { hidden: true })) {
      expect(nav).toHaveAccessibleName();
    }
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("Nội dung");
  });

  it("footer: có nút Cài đặt cookie phát sự kiện mở trình quản lý đồng ý", async () => {
    const user = userEvent.setup();
    renderShell();
    const listener = vi.fn();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
    const footer = screen.getByRole("contentinfo");
    await user.click(within(footer).getByRole("button", { name: "Cài đặt cookie" }));
    window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("footer EN: nhãn tiếng Anh, liên hệ và mạng xã hội an toàn", () => {
    renderShell("en");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("button", { name: "Cookie settings" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Hotline: 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    expect(within(footer).getByRole("link", { name: "info@tami.vn" })).toHaveAttribute("href", "mailto:info@tami.vn");
    const facebook = within(footer).getByRole("link", { name: "Facebook" });
    expect(facebook).toHaveAttribute("rel", "noopener noreferrer");
    expect(facebook).toHaveAttribute("target", "_blank");
    expect(within(footer).getByRole("link", { name: "Social media link" })).toBeInTheDocument();
  });

  it("chuyển ngôn ngữ có ở header và footer", () => {
    renderShell();
    const groups = screen.getAllByRole("group", { name: "Chuyển ngôn ngữ" });
    expect(groups).toHaveLength(2);
  });
});

describe("LanguageSwitcher", () => {
  function renderSwitcher(locale: "vi" | "en") {
    const messages = locale === "vi" ? vi_ : en;
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );
  }

  it("VI đang xem: EN là link về /en, VI là link aria-current về chính trang", () => {
    renderSwitcher("vi");
    const current = screen.getByRole("link", { name: "Tiếng Việt" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current.tagName).toBe("A");
    const other = screen.getByRole("link", { name: "English" });
    expect(other).toHaveAttribute("href", "/en");
    expect(other).toHaveAttribute("hreflang", "en");
    expect(other).toHaveAttribute("lang", "en");
  });

  it("EN đang xem: VI là link về trang chủ không tiền tố", () => {
    renderSwitcher("en");
    expect(screen.getByRole("link", { name: "Tiếng Việt" })).toHaveAttribute("href", "/");
  });

  it("bấm EN ghi cookie NEXT_LOCALE=en (client) mà vẫn là link bình thường", async () => {
    const user = userEvent.setup();
    const { container } = renderSwitcher("vi");
    container.addEventListener("click", (event) => event.preventDefault());
    expect(document.cookie).not.toContain("NEXT_LOCALE");
    await user.click(screen.getByRole("link", { name: "English" }));
    expect(document.cookie).toContain("NEXT_LOCALE=en");
  });

  it("bấm VI từ trang EN ghi cookie NEXT_LOCALE=vi", async () => {
    const user = userEvent.setup();
    const { container } = renderSwitcher("en");
    container.addEventListener("click", (event) => event.preventDefault());
    await user.click(screen.getByRole("link", { name: "Tiếng Việt" }));
    expect(document.cookie).toContain("NEXT_LOCALE=vi");
  });
});
