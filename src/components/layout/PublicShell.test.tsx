import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OPEN_COOKIE_SETTINGS_EVENT } from "./cookie-settings-event";
import { PublicShell } from "./PublicShell";
import { buildFooterColumns, buildNavItems, type ShellView } from "./shell-data";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), usePathname: () => pathname.current }));

const announcement = { text: "Thông báo trên cùng", href: null, external: false, hash: "h1" };

const shell: ShellView = {
  announcement: null,
  navItems: buildNavItems(null, "vi", vi_.layout.nav.items),
  contact: { hotline: { label: "0901 234 567", telHref: "tel:0901234567" }, email: "info@tami.vn", address: "Quận 1" },
  floatingContact: { hotline: { label: "0901 234 567", telHref: "tel:0901234567" } },
  consent: { gaMeasurementId: "G-TEST1234", privacyPolicyVersion: "1" },
  logo: {},
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

function renderShell(locale: "vi" | "en" = "vi", view: ShellView = shell) {
  const messages = locale === "vi" ? vi_ : en;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PublicShell shell={view}>
        <h1>Nội dung</h1>
      </PublicShell>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  });
});

afterEach(() => {
  pathname.current = "/";
  document.cookie = "NEXT_LOCALE=; Path=/; Max-Age=0";
});

describe("PublicShell", () => {
  describe("thanh thông báo (shell.announcement)", () => {
    const withBar: ShellView = { ...shell, announcement };

    it("trang chủ VI: đứng TRÊN header, sau skip link (skip link vẫn focus đầu tiên)", async () => {
      const user = userEvent.setup();
      renderShell("vi", withBar);
      const header = screen.getByRole("banner");
      const bar = screen.getByRole("region", { name: "Thông báo" });
      expect(bar.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await user.tab();
      expect(screen.getByRole("link", { name: "Bỏ qua tới nội dung" })).toHaveFocus();
    });

    it("trang chủ EN (/en) cũng hiện", () => {
      pathname.current = "/en";
      renderShell("en", withBar);
      expect(screen.getByRole("region", { name: "Announcement" })).toBeInTheDocument();
    });

    it.each([
      ["vi", "/du-an"],
      ["vi", "/cho-thue"],
      ["en", "/en/projects"],
    ] as const)("trang khác (%s %s): không hiện", (locale, path) => {
      pathname.current = path;
      renderShell(locale, withBar);
      expect(screen.queryByRole("region", { name: /Thông báo|Announcement/ })).toBeNull();
    });

    it("không có thông báo (announcement null) thì không dựng gì ở trang chủ", () => {
      renderShell("vi", shell);
      expect(screen.queryByRole("region", { name: "Thông báo" })).toBeNull();
    });
  });

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

  it("footer: không có mã GA hợp lệ thì ẩn nút Cài đặt cookie (không có gì để quản lý)", () => {
    renderShell("vi", { ...shell, consent: { gaMeasurementId: null, privacyPolicyVersion: "" } });
    expect(within(screen.getByRole("contentinfo")).queryByRole("button", { name: "Cài đặt cookie" })).toBeNull();
  });

  it("footer EN: nhãn tiếng Anh, không cột Liên hệ (Q2 BL-044), mạng xã hội an toàn", () => {
    renderShell("en");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("button", { name: "Cookie settings" })).toBeInTheDocument();
    expect(within(footer).queryByRole("link", { name: "Hotline: 0901 234 567" })).toBeNull();
    expect(within(footer).queryByRole("link", { name: "info@tami.vn" })).toBeNull();
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

  it("có island ghi UTM: trang không có form vẫn lưu utm_* của URL vào sessionStorage (BR-10)", () => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/?utm_source=facebook&utm_campaign=t10");
    renderShell();
    expect(JSON.parse(window.sessionStorage.getItem("tami.utm") ?? "null")).toEqual({ source: "facebook", campaign: "t10" });
    window.history.replaceState(null, "", "/");
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
  describe("cụm nút nổi (FloatingDock)", () => {
    it("khung mang offset banner cookie + thanh tư vấn dính đáy, ẩn khi in, không chặn click vùng trống", () => {
      renderShell();
      const dock = screen.getByRole("button", { name: "Lên đầu trang", hidden: true }).parentElement!;
      expect(dock.className).toContain("var(--floating-bottom-offset,0px)");
      expect(dock.className).toContain("var(--sticky-cta-height,0px)");
      expect(dock).toHaveClass("print:hidden", "pointer-events-none", "fixed");
      expect(within(dock).getByRole("group", { name: "Liên hệ nhanh" })).toBeInTheDocument();
    });

    it("không có link liên hệ nổi nào: vẫn có nút lên đầu trang", () => {
      renderShell("vi", { ...shell, floatingContact: {} });
      expect(screen.getByRole("button", { name: "Lên đầu trang", hidden: true })).toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Liên hệ nhanh" })).not.toBeInTheDocument();
    });
  });
});
