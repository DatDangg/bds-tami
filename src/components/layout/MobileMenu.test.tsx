import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { MobileMenu } from "./MobileMenu";
import type { NavItemView } from "./shell-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const items: NavItemView[] = [
  { label: "Trang chủ", href: "/", external: false, children: [] },
  {
    label: "Dự án",
    href: "/du-an",
    external: false,
    children: [
      { label: "Đang mở bán", href: "/du-an?status=selling", external: false },
      { label: "Đã bàn giao", href: "/du-an?status=delivered", external: false },
    ],
  },
  { label: "Liên hệ", href: "/lien-he", external: false, children: [] },
];

async function openMenu(locale: "vi" | "en" = "vi") {
  const user = userEvent.setup();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi_ : en}>
      <MobileMenu items={items} contact={{}} logo={{}} />
    </NextIntlClientProvider>,
  );
  await user.click(screen.getByRole("button", { name: /menu/i }));
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

describe("MobileMenu: accordion menu con (design-spec §2.2)", () => {
  it("mục có con: link cha vẫn điều hướng, nút caret riêng ≥ 44px với aria-expanded/aria-controls/aria-label i18n; mục không con không có nút", async () => {
    const { dialog } = await openMenu();
    const parent = within(dialog).getByRole("link", { name: "Dự án" });
    expect(parent).toHaveAttribute("href", "/du-an");
    const toggle = within(dialog).getByRole("button", { name: "Mở mục con của Dự án" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveClass("min-h-11", "min-w-11");
    expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls") ?? "")).not.toBeNull();
    expect(within(dialog).queryByRole("button", { name: /Mở mục con của Trang chủ/ })).toBeNull();
  });

  it("đóng mặc định: link con không trong cây truy cập/tab order (inert); mở thì Tab đi qua link con", async () => {
    const { user, dialog } = await openMenu();
    expect(within(dialog).queryByRole("link", { name: "Đang mở bán" })).toBeNull();
    const panel = document.getElementById(within(dialog).getByRole("button", { name: "Mở mục con của Dự án" }).getAttribute("aria-controls") ?? "");
    expect(panel).toHaveAttribute("inert");
    // Chuyển động mở/đóng theo `--duration-base`, tắt khi reduced motion.
    expect(panel).toHaveClass("duration-(--duration-base)", "motion-reduce:transition-none");

    const toggle = within(dialog).getByRole("button", { name: "Mở mục con của Dự án" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("inert");
    const children = within(dialog).getAllByRole("link", { name: /Đang mở bán|Đã bàn giao/ });
    expect(children).toHaveLength(2);
    toggle.focus();
    await user.tab();
    expect(children[0]).toHaveFocus();
    await user.tab();
    expect(children[1]).toHaveFocus();
  });

  it("Enter/Space trên nút caret mở/đóng (button native)", async () => {
    const { user, dialog } = await openMenu();
    const toggle = within(dialog).getByRole("button", { name: "Mở mục con của Dự án" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("bấm link con thì đóng cả menu (giữ hành vi cũ)", async () => {
    const { user, dialog } = await openMenu();
    await user.click(within(dialog).getByRole("button", { name: "Mở mục con của Dự án" }));
    const child = within(dialog).getByRole("link", { name: "Đã bàn giao" });
    child.addEventListener("click", (event) => event.preventDefault());
    await user.click(child);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("EN: nhãn nút caret từ en.json", async () => {
    const { dialog } = await openMenu("en");
    expect(within(dialog).getByRole("button", { name: "Open submenu of Dự án" })).toBeInTheDocument();
  });
});
