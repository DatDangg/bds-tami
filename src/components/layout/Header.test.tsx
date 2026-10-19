import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import viMessages from "@/i18n/messages/vi.json";
import { Header, searchHrefFor } from "./Header";
import { buildNavItems, fixedMenuItems, MAIN_MENU_KEYS } from "./shell-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/du-an/abc" }));

const messages = { vi: viMessages, en };

function renderIntl(ui: ReactElement, locale: "vi" | "en" = "vi") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const contact = { hotline: { label: "0901 234 567", telHref: "tel:0901234567" }, email: "info@tami.vn" };
const viItems = fixedMenuItems("vi", viMessages.layout.nav.items);
const noLogo = {};
const cmsLogo = {
  onLight: { url: "/api/media/file/logo-dark.webp", width: 800, height: 416 },
  onDark: { url: "/api/media/file/logo-white.webp", width: 800, height: 416 },
};
const cta = { label: "Nhận tư vấn", href: "/lien-he", external: false };

function menuTrigger() {
  return screen.getByRole("button", { name: /menu/i });
}

describe("Header: khung và landmark", () => {
  it("có landmark header, nav có tên, nút tìm kiếm dẫn tới /cho-thue?q=", () => {
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu chính", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tìm tin cho thuê" })).toHaveAttribute("href", "/cho-thue?q=");
    expect(screen.getByRole("link", { name: "TAMI, về trang chủ" })).toHaveAttribute("href", "/");
  });

  it("EN: tìm kiếm dẫn tới /en/for-rent?q=", () => {
    renderIntl(<Header items={fixedMenuItems("en", en.layout.nav.items)} contact={{}} logo={noLogo} />, "en");
    expect(screen.getByRole("link", { name: "Search rentals" })).toHaveAttribute("href", "/en/for-rent?q=");
    expect(searchHrefFor("vi")).toBe("/cho-thue?q=");
    expect(searchHrefFor("en")).toBe("/en/for-rent?q=");
  });

  it("menu ngang chỉ hiện từ xl; nút Menu có ở mọi breakpoint (header 1 hàng ở ≥ xl, BL-001)", () => {
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const desktopNav = screen.getByRole("navigation", { name: "Menu chính", hidden: true });
    expect(desktopNav).toHaveClass("hidden", "xl:block");
    expect(menuTrigger()).not.toHaveClass("xl:hidden");
    expect(menuTrigger().className).not.toMatch(/\bxl:hidden\b/);
  });

  it("logo: không có trong CMS thì dùng file tĩnh (vàng cho header đặc, trắng cho header trong suốt); có thì dùng URL từ site-settings", () => {
    const { unmount } = renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const home = screen.getByRole("link", { name: "TAMI, về trang chủ" });
    // Logo tĩnh vẫn qua trình tối ưu ảnh của Next (`/_next/image?url=...`), như trước BL-001.
    const staticSources = within(home)
      .getAllByRole("presentation")
      .map((img) => new URLSearchParams(img.getAttribute("src")?.split("?")[1]).get("url"));
    expect(staticSources).toEqual(["/brand/tami-logo-gold.png", "/brand/tami-logo-white.png"]);
    unmount();

    renderIntl(<Header items={viItems} contact={contact} logo={cmsLogo} />);
    const cmsSources = within(screen.getByRole("link", { name: "TAMI, về trang chủ" }))
      .getAllByRole("presentation")
      .map((img) => img.getAttribute("src"));
    expect(cmsSources).toEqual(["/api/media/file/logo-dark.webp", "/api/media/file/logo-white.webp"]);
    // Logo CMS quá ngang bị chặn rộng (giữ tỉ lệ, neo trái) để không đè menu ở 1280.
    for (const img of within(screen.getByRole("link", { name: "TAMI, về trang chủ" })).getAllByRole("presentation")) {
      expect(img).toHaveClass("max-w-[7.5rem]", "xl:max-w-[6rem]", "object-contain", "object-left");
    }
  });

  it("CTA: có thì là link nhãn/href theo view model, ẩn dưới md; không có thì không render", () => {
    const { unmount } = renderIntl(<Header items={viItems} contact={contact} logo={noLogo} cta={cta} />);
    const button = screen.getByRole("link", { name: "Nhận tư vấn" });
    expect(button).toHaveAttribute("href", "/lien-he");
    expect(button).toHaveClass("hidden", "md:inline-flex");
    // Nhãn CMS dài không được đẩy menu đè logo ở 1280: giới hạn rộng + cắt chữ, `title` giữ nhãn đầy đủ.
    expect(button).toHaveClass("max-w-[10rem]");
    expect(within(button).getByText("Nhận tư vấn")).toHaveClass("truncate");
    expect(button).toHaveAttribute("title", "Nhận tư vấn");
    expect(button).not.toHaveAttribute("target");
    unmount();

    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    expect(screen.queryByRole("link", { name: "Nhận tư vấn" })).not.toBeInTheDocument();
  });

  it("CTA là URL ngoài: mở tab mới kèm noopener", () => {
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} cta={{ label: "Zalo", href: "https://zalo.me/tami", external: true }} />);
    const button = screen.getByRole("link", { name: "Zalo" });
    expect(button).toHaveAttribute("target", "_blank");
    expect(button).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("đánh dấu trang đang xem bằng aria-current (trang con tính vào mục cha)", () => {
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const nav = screen.getByRole("navigation", { name: "Menu chính", hidden: true });
    expect(within(nav).getByText("Dự án", { selector: "a" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByText("Trang chủ", { selector: "a" })).not.toHaveAttribute("aria-current");
  });

  it("EN khi global không có bản EN: header hiện nhãn từ en.json, không có chữ tiếng Việt", () => {
    const items = buildNavItems(
      MAIN_MENU_KEYS.map((key) => ({ label: undefined, link: key })),
      "en",
      en.layout.nav.items,
    );
    renderIntl(<Header items={items} contact={{}} logo={noLogo} />, "en");
    const nav = screen.getByRole("navigation", { name: "Main menu", hidden: true });
    const labels = within(nav)
      .getAllByRole("link", { hidden: true })
      .map((link) => link.textContent);
    expect(labels).toEqual(["Home", "Projects", "For rent", "Property news", "News", "Careers", "Contact"]);
    expect(nav).not.toHaveTextContent(/Trang chủ|Dự án|Cho thuê|Tin tức/);
    expect(within(nav).getByText("Projects", { selector: "a" })).toHaveAttribute("href", "/en/projects");
  });
});

describe("MobileMenu (< xl)", () => {
  it("mở: nút aria-expanded, dialog có tên, 7 mục, focus vào trong; khoá cuộn nền", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const trigger = menuTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.body).toHaveAttribute("data-scroll-locked");
    const menu = within(dialog).getByRole("navigation", { name: "Menu chính toàn màn hình" });
    expect(within(menu).getAllByRole("link")).toHaveLength(7);
    expect(within(dialog).getByRole("button", { name: "Đóng menu" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    // Vùng chạm ≥ 44px (design-spec §1.4) cho mọi phần tử tương tác trong menu.
    for (const name of ["0901 234 567", "info@tami.vn", "Liên hệ"]) expect(within(dialog).getByRole("link", { name })).toHaveClass(/min-h-1[14]/);
    expect(within(dialog).getByRole("button", { name: "Đóng menu" })).toHaveClass("min-h-11", "min-w-11");
  });

  it("Esc đóng, trả focus về nút mở, mở khoá cuộn", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const trigger = menuTrigger();
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("nút Đóng đóng menu và trả focus về nút mở", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    const trigger = menuTrigger();
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: "Đóng menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("bẫy focus: Tab / Shift+Tab nhiều lần không bao giờ ra ngoài dialog", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    await user.click(menuTrigger());
    const dialog = await screen.findByRole("dialog");
    for (let i = 0; i < 20; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i < 20; i++) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("bấm một mục menu thì menu đóng (layout không dựng lại khi điều hướng)", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    await user.click(menuTrigger());
    const dialog = await screen.findByRole("dialog");
    const link = within(dialog).getByRole("link", { name: "Liên hệ" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("có chuyển ngôn ngữ trong menu", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    await user.click(menuTrigger());
    const dialog = await screen.findByRole("dialog");
    // /du-an/abc là trang có slug: bản ngôn ngữ kia do endpoint tra rồi chuyển hướng (xem LanguageSwitcher.test).
    const href = within(dialog).getByRole("link", { name: "English" }).getAttribute("href") ?? "";
    expect(href).toBe("/api/locale-counterpart?to=en&path=%2Fdu-an%2Fabc");
  });

  it("có CTA và logo nền tối từ CMS trong menu; bấm CTA thì menu đóng", async () => {
    const user = userEvent.setup();
    renderIntl(<Header items={viItems} contact={contact} logo={cmsLogo} cta={cta} />);
    await user.click(menuTrigger());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("presentation")).toHaveAttribute("src", "/api/media/file/logo-white.webp");
    const link = within(dialog).getByRole("link", { name: "Nhận tư vấn" });
    expect(link).toHaveAttribute("href", "/lien-he");
    expect(link).toHaveClass("min-h-11");
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("không tự đóng khi cửa sổ rộng lên xl (nút Menu vẫn có ở ≥ xl)", async () => {
    const user = userEvent.setup();
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => listeners.push(listener),
        removeEventListener: () => {},
      }),
    });
    renderIntl(<Header items={viItems} contact={contact} logo={noLogo} />);
    await user.click(menuTrigger());
    await screen.findByRole("dialog");
    act(() => {
      for (const listener of listeners) listener({ matches: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
