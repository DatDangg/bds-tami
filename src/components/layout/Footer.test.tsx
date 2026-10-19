import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import vi_ from "@/i18n/messages/vi.json";
import { Footer } from "./Footer";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const columns = [
  { title: "Dự án", links: [{ label: "Đang bán", href: "/du-an", external: false }] },
  { title: "Về TAMI", links: [{ label: "Tuyển dụng", href: "/tuyen-dung", external: false }] },
];
const contact = { hotline: { label: "0901 234 567", telHref: "tel:0901234567" }, email: "info@tami.vn", address: "Quận 1" };

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
      <Footer logo={{}} columns={columns} tagline="Giới thiệu" copyright="© TAMI" contact={contact} socials={[]} showCookieSettings={false} />
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

  it("cột Liên hệ luôn mở: heading không có nút, link hotline/email hiện", () => {
    renderFooter();
    const heading = screen.getByRole("heading", { level: 2, name: "Liên hệ" });
    expect(within(heading).queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "Hotline: 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    expect(screen.getByRole("link", { name: "info@tami.vn" }).closest("ul")).not.toHaveClass("max-md:hidden");
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
