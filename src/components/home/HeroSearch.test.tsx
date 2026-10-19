import { fireEvent, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import vi_ from "@/i18n/messages/vi.json";
import { renderWithIntl } from "@/components/media/test-utils";
import { HeroSearch, RENTAL_KEYWORD_PARAM } from "./HeroSearch";

const chips = [
  { id: "p1", title: "Vinhomes Ocean Park", href: "/du-an/ocean-park" },
  { id: "p2", title: "Sun Grand", href: "/du-an/sun-grand" },
];
const provinces = [
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "tp-hcm", name: "TP.HCM" },
];
const props = { placeholder: null, chips, rentalsHref: "/cho-thue", projectsHref: "/du-an", provinces };

describe("HeroSearch", () => {
  it("HTML ban đầu (không cần JS): form GET tới danh sách cho thuê với tham số `q` có sẵn, input có nhãn", () => {
    expect(RENTAL_KEYWORD_PARAM).toBe("q");
    const { container } = renderWithIntl(<HeroSearch {...props} />);
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/cho-thue");
    expect(form).toHaveAttribute("method", "get");
    const input = within(form).getByLabelText("Từ khoá tìm căn hộ cho thuê");
    expect(input).toHaveAttribute("name", "q");
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
    expect(Array.from(form.elements).filter((element) => element.hasAttribute("name"))).toHaveLength(1);
  });

  it("EN: action là đường dẫn EN truyền vào; placeholder CMS thắng chữ mặc định", () => {
    const en = renderWithIntl(<HeroSearch {...props} rentalsHref="/en/for-rent" projectsHref="/en/projects" />, "en");
    expect(en.container.querySelector("form")).toHaveAttribute("action", "/en/for-rent");
    expect(screen.getByRole("searchbox")).toHaveAttribute("placeholder", "Enter an area, building name or apartment type");
    en.unmount();
    renderWithIntl(<HeroSearch {...props} placeholder="Tìm nhanh" />);
    expect(screen.getByRole("searchbox")).toHaveAttribute("placeholder", "Tìm nhanh");
  });

  it("tablist có nhãn: mặc định Cho thuê; tab Dự án là form GET tới /du-an chỉ với tham số lọc có sẵn (province, status)", () => {
    renderWithIntl(<HeroSearch {...props} />);
    expect(screen.getByRole("tablist", { name: "Loại tìm kiếm" })).toBeInTheDocument();
    const rentals = screen.getByRole("tab", { name: "Cho thuê" });
    const projects = screen.getByRole("tab", { name: "Dự án" });
    expect(rentals).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Cho thuê" })).toBeVisible();
    fireEvent.click(projects);
    expect(projects).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("searchbox")).toBeNull(); // panel Cho thuê bị ẩn
    const panel = screen.getByRole("tabpanel", { name: "Dự án" });
    const form = panel.querySelector("form") as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/du-an");
    expect(form).toHaveAttribute("method", "get");
    const names = Array.from(form.elements)
      .map((element) => element.getAttribute("name"))
      .filter(Boolean)
      .sort();
    expect(names).toEqual(["province", "status"]);
    expect(within(form).getByLabelText("Tỉnh/thành")).toBeInTheDocument();
    expect(within(form).getByLabelText("Trạng thái")).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
  });

  it("form Dự án dựng sẵn ở HTML server (không JS): select gốc có mọi tỉnh + 3 trạng thái, giá trị là slug / mã trạng thái", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <HeroSearch {...props} />
      </NextIntlClientProvider>,
    );
    const root = document.createElement("div");
    root.innerHTML = html;
    const values = (name: string) => Array.from(root.querySelectorAll(`select[name="${name}"] option`)).map((option) => option.getAttribute("value"));
    expect(values("province")).toEqual(["", "ha-noi", "tp-hcm"]);
    expect(values("status")).toEqual(["", "upcoming", "selling", "handed_over"]);
    expect(root.querySelector('form[action="/du-an"]')).not.toBeNull();
  });

  it("phím mũi tên đổi tab và chuyển focus (roving tabindex)", () => {
    renderWithIntl(<HeroSearch {...props} />);
    const rentals = screen.getByRole("tab", { name: "Cho thuê" });
    const projects = screen.getByRole("tab", { name: "Dự án" });
    expect(projects).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(rentals, { key: "ArrowRight" });
    expect(projects).toHaveAttribute("aria-selected", "true");
    expect(projects).toHaveFocus();
    expect(rentals).toHaveAttribute("tabindex", "-1");
  });

  it("Home/End nhảy tới tab đầu/cuối", () => {
    renderWithIntl(<HeroSearch {...props} />);
    const rentals = screen.getByRole("tab", { name: "Cho thuê" });
    const projects = screen.getByRole("tab", { name: "Dự án" });
    fireEvent.keyDown(rentals, { key: "End" });
    expect(projects).toHaveAttribute("aria-selected", "true");
    expect(projects).toHaveFocus();
    fireEvent.keyDown(projects, { key: "Home" });
    expect(rentals).toHaveAttribute("aria-selected", "true");
    expect(rentals).toHaveFocus();
  });

  it("vùng tìm kiếm có data-hero-search để nút cuộn của hero nhắm tới", () => {
    renderWithIntl(<HeroSearch {...props} />);
    expect(screen.getByRole("region", { name: "Tìm kiếm nhanh" })).toHaveAttribute("data-hero-search");
  });

  it("chip: danh sách có nhãn, link tới chi tiết dự án, vuốt ngang trên mobile; không có chip thì không dựng hàng chip", () => {
    const withChips = renderWithIntl(<HeroSearch {...props} />);
    const list = screen.getByRole("list", { name: "Dự án được quan tâm" });
    expect(within(list).getByRole("link", { name: "Sun Grand" })).toHaveAttribute("href", "/du-an/sun-grand");
    expect(list.className).toContain("overflow-x-auto");
    withChips.unmount();
    renderWithIntl(<HeroSearch {...props} chips={[]} />);
    expect(screen.queryByRole("list")).toBeNull();
  });
});
