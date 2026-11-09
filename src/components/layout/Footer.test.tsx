import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en_ from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { Footer, SocialLinks } from "./Footer";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const columns = [
  { title: "Dự án", links: [{ label: "Đang bán", href: "/du-an", external: false }] },
  { title: "Về TAMI", links: [{ label: "Tuyển dụng", href: "/tuyen-dung", external: false }] },
];
const socials = [
  { platform: "facebook", url: "https://facebook.com/tami" },
  { platform: "youtube", url: "https://youtube.com/@tami" },
];

/** `matches` = cửa sổ ≥ md (768px) hay không; jsdom không có matchMedia nên stub. */
function stubViewport(isMd: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({ matches: isMd && query.includes("768px"), addEventListener: () => {}, removeEventListener: () => {} }),
  });
}

function renderFooter() {
  return render(
    <NextIntlClientProvider locale="vi" messages={vi_}>
      <Footer logo={{}} columns={columns} tagline="Giới thiệu" copyright="© TAMI" socials={socials} showCookieSettings={false} />
    </NextIntlClientProvider>,
  );
}

describe("Footer < md: cột link là accordion (design-spec §2.4)", () => {
  beforeEach(() => stubViewport(false));

  it("tiêu đề cột là h2 chứa nút đóng mặc định, aria-controls trỏ danh sách link, link vẫn trong HTML nhưng ẩn bằng CSS", () => {
    renderFooter();
    const heading = screen.getByRole("heading", { level: 2, name: "Dự án" });
    const button = within(heading).getByRole("button", { name: "Dự án" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveClass("min-h-11");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    const list = document.getElementById(button.getAttribute("aria-controls") ?? "");
    expect(list?.tagName).toBe("UL");
    // SSR giữ link trong HTML cho crawler; < md chỉ ẩn bằng `max-md:hidden` (display:none → ra khỏi tab order/AT).
    expect(list).toHaveClass("max-md:hidden");
    expect(within(list as HTMLElement).getByRole("link", { name: "Đang bán", hidden: true })).toHaveAttribute("href", "/du-an");
  });

  it("bấm nút thì mở (aria-expanded=true, bỏ lớp ẩn); bấm lại thì đóng; các cột độc lập", async () => {
    const user = userEvent.setup();
    renderFooter();
    const first = screen.getByRole("button", { name: "Dự án" });
    const second = screen.getByRole("button", { name: "Về TAMI" });
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(first.getAttribute("aria-controls") ?? "")).not.toHaveClass("max-md:hidden");
    expect(second).toHaveAttribute("aria-expanded", "false");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("Enter/Space trên nút cũng mở (button native)", async () => {
    const user = userEvent.setup();
    renderFooter();
    const button = screen.getByRole("button", { name: "Về TAMI" });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Footer: logo nền tối", () => {
  it("logo tĩnh mặc định là bản trắng (không dùng bản vàng của nền sáng)", () => {
    stubViewport(true);
    renderFooter();
    const sources = screen
      .getAllByRole("presentation")
      .map((img) => new URLSearchParams(img.getAttribute("src")?.split("?")[1]).get("url"));
    expect(sources).toContain("/brand/tami-logo-white.png");
    expect(sources).not.toContain("/brand/tami-logo-gold.png");
  });
});

describe("Footer: logo là link về trang chủ (BL-117)", () => {
  beforeEach(() => stubViewport(true));

  it.each([
    ["vi", vi_, "/"],
    ["en", en_, "/en"],
  ])("locale %s: logo bọc link về %s, có tên truy cập, ảnh alt rỗng", (locale, messages, href) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Footer logo={{}} columns={columns} tagline="Giới thiệu" copyright="© TAMI" socials={[]} showCookieSettings={false} />
      </NextIntlClientProvider>,
    );
    const footer = screen.getByRole("contentinfo");
    const home = within(footer).getByRole("link", { name: messages.layout.header.home });
    expect(home).toHaveAttribute("href", href);
    expect(home).toHaveClass("min-h-11");
    expect(home.querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("Footer ≥ md: lưới như cũ", () => {
  beforeEach(() => stubViewport(true));

  it("tiêu đề là chữ thường (không nút), mọi link hiện", () => {
    renderFooter();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Dự án" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đang bán" }).closest("ul")).not.toHaveClass("max-md:hidden");
    expect(screen.getByRole("link", { name: "Tuyển dụng" })).toBeInTheDocument();
  });
});

describe("Footer theo mockup BL-044", () => {
  beforeEach(() => stubViewport(true));

  it("cột trái: logo, mô tả và mạng xã hội dạng ô tròn; hàng cuối chỉ bản quyền + ngôn ngữ (không mạng xã hội)", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    const social = within(footer).getByRole("list", { name: "Mạng xã hội" });
    const left = social.parentElement as HTMLElement;
    expect(within(left).getByText("Giới thiệu")).toBeInTheDocument();
    expect(within(social).getByRole("link", { name: "Facebook" })).toHaveClass("size-11");
    expect(social.querySelector("span.rounded-full.border-dark-border")).not.toBeNull();
    const bottom = screen.getByText("© TAMI").parentElement as HTMLElement;
    expect(bottom).toHaveClass("border-dark-border");
    expect(within(bottom).queryByRole("list", { name: "Mạng xã hội" })).toBeNull();
    expect(within(bottom).getByRole("group", { name: "Chuyển ngôn ngữ" })).toBeInTheDocument();
  });

  it("không có cột Liên hệ (Q2): không heading, hotline, email hay địa chỉ", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).queryByRole("heading", { name: "Liên hệ" })).toBeNull();
    expect(within(footer).queryByRole("link", { name: /Hotline/ })).toBeNull();
  });

  it("không có mạng xã hội thì cột trái vẫn có logo + mô tả, không dựng danh sách rỗng", () => {
    render(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <Footer logo={{}} columns={columns} tagline="Giới thiệu" copyright="© TAMI" socials={[]} showCookieSettings={false} />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByRole("list", { name: "Mạng xã hội" })).toBeNull();
  });
});

describe("SocialLinks: khoảng cách theo variant", () => {
  it("circle gap-1 (ô 44px sát nhau); plain (trang Liên hệ) giữ gap-2", () => {
    const wrap = (variant?: "circle") => (
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <SocialLinks socials={socials} {...(variant ? { variant } : {})} />
      </NextIntlClientProvider>
    );
    const circle = render(wrap("circle"));
    expect(screen.getByRole("list")).toHaveClass("gap-1");
    circle.unmount();
    render(wrap());
    expect(screen.getByRole("list")).toHaveClass("gap-2");
    expect(screen.getByRole("list")).not.toHaveClass("gap-1");
  });
});
