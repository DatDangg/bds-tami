import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import viMessages from "@/i18n/messages/vi.json";
import { DesktopNav } from "./DesktopNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavItemView } from "./shell-data";

vi.mock("next/navigation", () => ({ usePathname: () => "/du-an" }));

const items: NavItemView[] = [
  { label: "Trang chủ", href: "/", external: false, children: [] },
  {
    label: "Dự án",
    href: "/du-an",
    external: false,
    children: [
      { label: "Đang mở bán", href: "/du-an/dang-mo-ban", external: false },
      { label: "Đã bàn giao", href: "/du-an/da-ban-giao", external: false },
    ],
  },
  { label: "Liên hệ", href: "/lien-he", external: false, children: [] },
];

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const caret = () => screen.getByRole("button", { name: "Mở mục con của Dự án", hidden: true });
const submenu = () => document.querySelector<HTMLElement>("ul[id] ul, li ul[id]") as HTMLElement;

describe("DesktopNav: mục con dạng disclosure", () => {
  it("nút riêng có aria-expanded/aria-controls trỏ tới danh sách con; mục không có con thì không có nút", () => {
    renderWithIntl(<DesktopNav items={items} />);
    expect(screen.getAllByRole("button", { hidden: true })).toHaveLength(1);
    expect(caret()).toHaveAttribute("aria-expanded", "false");
    const list = document.getElementById(caret().getAttribute("aria-controls") as string) as HTMLElement;
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute("hidden");
    expect(caret()).toHaveClass("size-11");
  });

  it("Enter và Space trên nút mở; link cha vẫn là link điều hướng", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopNav items={items} />);
    expect(screen.getByText("Dự án", { selector: "a" })).toHaveAttribute("href", "/du-an");
    caret().focus();
    await user.keyboard("{Enter}");
    expect(caret()).toHaveAttribute("aria-expanded", "true");
    expect(submenu()).not.toHaveAttribute("hidden");
    await user.keyboard("{Enter}");
    expect(caret()).toHaveAttribute("aria-expanded", "false");
    await user.keyboard(" ");
    expect(caret()).toHaveAttribute("aria-expanded", "true");
  });

  it("Esc đóng và trả focus về nút (kể cả khi focus đang ở mục con)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopNav items={items} />);
    await user.click(caret());
    const child = screen.getByText("Đã bàn giao", { selector: "a" });
    child.focus();
    await user.keyboard("{Escape}");
    expect(caret()).toHaveAttribute("aria-expanded", "false");
    expect(caret()).toHaveFocus();
  });

  it("đóng khi click ra ngoài và khi focus rời nhóm", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <button type="button">ngoài</button>
        <DesktopNav items={items} />
      </>,
    );
    await user.click(caret());
    expect(caret()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "ngoài" }));
    expect(caret()).toHaveAttribute("aria-expanded", "false");

    caret().focus();
    await user.keyboard("{Enter}");
    await user.tab();
    await user.tab();
    await user.tab();
    expect(caret()).toHaveAttribute("aria-expanded", "false");
  });

  it("chạm (pointerType touch) mở bằng click, mouse rê vào nhóm mở và rời nhóm đóng", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DesktopNav items={items} />);
    const group = caret().closest("li") as HTMLElement;
    fireEvent.pointerEnter(group, { pointerType: "touch" });
    expect(caret()).toHaveAttribute("aria-expanded", "false");
    await user.click(caret());
    expect(caret()).toHaveAttribute("aria-expanded", "true");
    await user.click(caret());
    fireEvent.pointerEnter(group, { pointerType: "mouse" });
    expect(caret()).toHaveAttribute("aria-expanded", "true");
    // rê vào nội dung xổ nằm trong nhóm: không đóng (WCAG 1.4.13 hoverable)
    fireEvent.pointerEnter(submenu(), { pointerType: "mouse" });
    expect(caret()).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(group, { pointerType: "mouse" });
    expect(caret()).toHaveAttribute("aria-expanded", "false");
  });

  it("mục con có vùng chạm ≥ 44px chiều cao", () => {
    renderWithIntl(<DesktopNav items={items} />);
    expect(screen.getByText("Đang mở bán", { selector: "a", exact: true })).toHaveClass("min-h-11");
  });
});

describe("LanguageSwitcher: vùng chạm và ngôn ngữ hiện tại", () => {
  it("mỗi mục là link ≥ 44×44, ngôn ngữ hiện tại có aria-current và tên truy cập đọc được, khoảng cách ≥ 8px", () => {
    renderWithIntl(<LanguageSwitcher />);
    const current = screen.getByRole("link", { name: "Tiếng Việt" });
    const other = screen.getByRole("link", { name: "English" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveAttribute("href", "/du-an");
    expect(other).not.toHaveAttribute("aria-current");
    for (const link of [current, other]) expect(link).toHaveClass("min-h-11", "min-w-11");
    const separator = document.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(separator).toHaveClass("px-2");
  });
});
