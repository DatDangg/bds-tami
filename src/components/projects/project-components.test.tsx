import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import vi_ from "@/i18n/messages/vi.json";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseOption, fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectCardData } from "@/lib/projects/project-view";
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";

afterEach(() => push.mockReset());

const card = (overrides: Partial<ProjectCardData> = {}): ProjectCardData => ({
  id: "d1",
  title: "Dự án Sông Sài Gòn",
  href: "/du-an/song-sai-gon",
  salesStatus: "selling",
  provinceName: "TP. Hồ Chí Minh",
  categoryName: "Căn hộ",
  priceFrom: "3,5 tỷ",
  cover: fakeMedia("anh-1"),
  ...overrides,
});

describe("ProjectCard", () => {
  it("cả thẻ là MỘT link phủ ảnh + chữ (không lồng link); tiêu đề h2 tối đa 2 dòng; badge, tỉnh, mũi tên tròn; không icon tim", () => {
    const { container } = renderWithIntl(<ProjectCard data={card()} />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/du-an/song-sai-gon");
    const heading = within(link).getByRole("heading", { level: 2, name: "Dự án Sông Sài Gòn" });
    expect(heading.className).toContain("line-clamp-2");
    expect(link).toHaveTextContent("Đang mở bán");
    expect(link).toHaveTextContent("TP. Hồ Chí Minh");
    expect(link.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("[data-testid*=heart i], [class*=heart i]")).toBeNull();
    expect(heading.className).toContain("min-h-[2lh]");
    expect(link.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("badge theo trạng thái: Sắp mở bán / Đã bàn giao (neutral); EN không còn chữ Việt trong nhãn", () => {
    const { unmount } = renderWithIntl(<ProjectCard data={card({ salesStatus: "upcoming" })} />);
    expect(screen.getByText("Sắp mở bán")).toHaveAttribute("data-variant", "primary");
    unmount();
    renderWithIntl(<ProjectCard data={card({ salesStatus: "handed_over" })} />);
    expect(screen.getByText("Đã bàn giao")).toHaveAttribute("data-variant", "neutral");
  });

  it("EN: nhãn tiếng Anh", () => {
    renderWithIntl(<ProjectCard data={card()} />, "en");
    expect(screen.getByText("Now selling")).toBeInTheDocument();
  });

  it("thiếu ảnh / tỉnh: vẫn giữ khung ảnh, không render phần thiếu", () => {
    const { container } = renderWithIntl(<ProjectCard data={card({ cover: null, provinceName: null })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[class~=\"aspect-[11/10]\"]")).not.toBeNull();
    expect(screen.queryByText("TP. Hồ Chí Minh")).toBeNull();
  });

  it("thẻ đầu (priority) tải ảnh ngay, thẻ khác lazy", () => {
    const first = renderWithIntl(<ProjectCard data={card()} priority />);
    expect(first.container.querySelector("img")).toHaveAttribute("fetchpriority", "high");
    first.unmount();
    const second = renderWithIntl(<ProjectCard data={card()} />);
    expect(second.container.querySelector("img")).toHaveAttribute("loading", "lazy");
  });
});

const provinces = [
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "da-nang", name: "Đà Nẵng" },
];

describe("ProjectFilters", () => {
  it("băng tìm kiếm GET về đúng trang: hai ô chọn có nhãn, chọn sẵn giá trị từ URL, nút Lọc, KHÔNG có ô từ khoá / nút Bộ lọc", () => {
    const { container } = renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} selectedProvince="da-nang" selectedStatus="upcoming" />);
    const form = screen.getByRole("search", { name: "Bộ lọc dự án" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/du-an");
    // Sau mount: Select TAMI; trigger có nhãn, hiện mục đang chọn, giá trị gửi đi nằm ở input ẩn có name.
    expect(screen.getByLabelText("Tỉnh/thành")).toHaveTextContent("Đà Nẵng");
    expect(screen.getByLabelText("Trạng thái")).toHaveTextContent("Sắp mở bán");
    expect(container.querySelector("input[type=hidden][name=province]")).toHaveValue("da-nang");
    expect(container.querySelector("input[type=hidden][name=status]")).toHaveValue("upcoming");
    expect(screen.getByRole("button", { name: "Lọc" })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /Bộ lọc/ })).toBeNull();
    expect(container.querySelector("input[name=q]")).toBeNull();
  });

  it("no-JS: SSR vẫn render <select name> gốc (lọc được bằng form GET), giữ giá trị chọn sẵn, không có sentinel", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <ProjectFilters actionPath="/du-an" provinces={provinces} selectedProvince="da-nang" hiddenCategory="can-ho" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('method="get"');
    expect(html).toContain('<select id="project-filter-province" name="province"');
    expect(html).toContain('<select id="project-filter-status" name="status"');
    expect(html).toMatch(/<option value="da-nang" selected="">/);
    expect(html).toContain('<option value="" selected="">Mọi trạng thái</option>');
    expect(html).toContain('<input type="hidden" name="category" value="can-ho"/>');
    expect(html).not.toContain("__tami_empty__");
  });

  it("chọn 'Tất cả' gửi giá trị rỗng (không lộ sentinel) và chưa đổi URL khi đổi ô (WCAG 3.2.2)", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} selectedProvince="da-nang" />);
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Hà Nội");
    expect(container.querySelector("input[name=province]")).toHaveValue("ha-noi");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Tất cả tỉnh/thành");
    expect(container.querySelector("input[name=province]")).toHaveValue("");
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("province")).toBe("");
    expect(push).not.toHaveBeenCalled();
  });

  it("bấm Lọc: router.push đúng query theo thứ tự cũ (category, province, status), trang 1; ô 'Tất cả' bị bỏ", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} hiddenCategory="can-ho" />);
    await chooseOption(user, screen.getByLabelText("Trạng thái"), "Đang mở bán");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Hà Nội");
    await user.click(screen.getByRole("button", { name: "Lọc" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?category=can-ho&province=ha-noi&status=selling");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Tất cả tỉnh/thành");
    await chooseOption(user, screen.getByLabelText("Trạng thái"), "Mọi trạng thái");
    await user.click(screen.getByRole("button", { name: "Lọc" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?category=can-ho");
  });

  it("giữ ?category= bằng input ẩn; EN dùng nhãn tiếng Anh và đường dẫn /en/projects", () => {
    const { container } = renderWithIntl(<ProjectFilters actionPath="/en/projects" provinces={provinces} hiddenCategory="apartments" />, "en");
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveAttribute("value", "apartments");
    expect(screen.getByLabelText("Province/city")).toHaveTextContent("All provinces/cities");
    expect(screen.getByLabelText("Status")).toHaveTextContent("Any status");
  });
});
