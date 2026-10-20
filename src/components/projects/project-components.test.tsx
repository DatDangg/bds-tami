import Link from "next/link";
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
import { ProjectSortControl } from "./ProjectSortControl";

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
const developers = [
  { id: "dev1", name: "Vinhomes" },
  { id: "dev2", name: "Ecopark" },
];

describe("ProjectFilters", () => {
  it("thẻ lọc GET về đúng trang: ô từ khoá (≤ 100) + Tìm kiếm, ba ô chọn có nhãn và chọn sẵn giá trị từ URL, hàng 'Tùy chọn khác'", () => {
    const { container } = renderWithIntl(
      <ProjectFilters actionPath="/du-an" provinces={provinces} developers={developers} selectedProvince="da-nang" selectedStatus="upcoming" selectedDeveloper="dev2" query="sông" />,
    );
    const form = screen.getByRole("search", { name: "Bộ lọc dự án" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/du-an");
    const keyword = screen.getByRole("searchbox", { name: "Từ khoá dự án" });
    expect(keyword).toHaveValue("sông");
    expect(keyword).toHaveAttribute("name", "q");
    expect(keyword).toHaveAttribute("maxlength", "100");
    expect(screen.getByRole("group", { name: "Tùy chọn khác" })).toBeInTheDocument();
    // Sau mount: Select TAMI; trigger có nhãn, hiện mục đang chọn, giá trị gửi đi nằm ở input ẩn có name.
    expect(screen.getByLabelText("Tỉnh/thành")).toHaveTextContent("Đà Nẵng");
    expect(screen.getByLabelText("Trạng thái")).toHaveTextContent("Sắp mở bán");
    expect(screen.getByLabelText("Chủ đầu tư")).toHaveTextContent("Ecopark");
    expect(container.querySelector("input[type=hidden][name=province]")).toHaveValue("da-nang");
    expect(container.querySelector("input[type=hidden][name=status]")).toHaveValue("upcoming");
    expect(container.querySelector("input[type=hidden][name=developer]")).toHaveValue("dev2");
    expect(screen.getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
    // Dự án không có lọc phụ nên không có nút "Bộ lọc".
    expect(screen.queryByRole("button", { name: /Bộ lọc/ })).toBeNull();
  });

  it("không có chủ đầu tư công khai nào thì không có ô Chủ đầu tư", () => {
    renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} developers={[]} />);
    expect(screen.queryByLabelText("Chủ đầu tư")).toBeNull();
  });

  it("no-JS: SSR vẫn render ô từ khoá + <select name> gốc (lọc được bằng form GET), giữ giá trị chọn sẵn, category/sort giữ bằng input ẩn, không có sentinel", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <ProjectFilters actionPath="/du-an" provinces={provinces} developers={developers} selectedProvince="da-nang" hiddenCategory="can-ho" sort="price_asc" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain('method="get"');
    expect(html).toContain('id="project-filter-q"');
    expect(html).toMatch(/<select name="province"/);
    expect(html).toMatch(/<select name="status"/);
    expect(html).toMatch(/<select name="developer"/);
    expect(html).toMatch(/<option value="da-nang" selected="">/);
    expect(html).toContain('<option value="" selected="">Tình trạng</option>');
    expect(html).toContain('<input type="hidden" name="category" value="can-ho"/>');
    expect(html).toContain('<input type="hidden" name="sort" value="price_asc"/>');
    expect(html).not.toContain("__tami_empty__");
  });

  it("chọn 'Tất cả' gửi giá trị rỗng (không lộ sentinel) và chưa đổi URL khi đổi ô (WCAG 3.2.2)", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} developers={developers} selectedProvince="da-nang" />);
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Hà Nội");
    expect(container.querySelector("input[name=province]")).toHaveValue("ha-noi");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Tỉnh/thành");
    expect(container.querySelector("input[name=province]")).toHaveValue("");
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("province")).toBe("");
    expect(push).not.toHaveBeenCalled();
  });

  it("bấm Tìm kiếm: router.push đúng query theo thứ tự cố định (category, province, status, q, developer, sort), trang 1; ô trống bị bỏ", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} developers={developers} hiddenCategory="can-ho" sort="price_desc" />);
    await chooseOption(user, screen.getByLabelText("Trạng thái"), "Đang mở bán");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Hà Nội");
    await chooseOption(user, screen.getByLabelText("Chủ đầu tư"), "Vinhomes");
    await user.type(screen.getByRole("searchbox"), "  sông  ");
    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?category=can-ho&province=ha-noi&status=selling&q=s%C3%B4ng&developer=dev1&sort=price_desc");
    await chooseOption(user, screen.getByLabelText("Tỉnh/thành"), "Tỉnh/thành");
    await chooseOption(user, screen.getByLabelText("Trạng thái"), "Tình trạng");
    await chooseOption(user, screen.getByLabelText("Chủ đầu tư"), "Chủ đầu tư");
    await user.clear(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?category=can-ho&sort=price_desc");
  });

  it("hàng 'Loại hình' truyền vào nằm GIỮA ô từ khoá và 'Tùy chọn khác', cùng một form", () => {
    renderWithIntl(<ProjectFilters actionPath="/du-an" provinces={provinces} developers={developers} categoryRow={<Link href="/du-an?category=can-ho">Căn hộ</Link>} />);
    const form = screen.getByRole("search");
    const chip = within(form).getByRole("link", { name: "Căn hộ" });
    expect(screen.getByRole("searchbox").compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chip.compareDocumentPosition(screen.getByRole("group", { name: "Tùy chọn khác" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("giữ ?category= bằng input ẩn; EN dùng nhãn tiếng Anh và đường dẫn /en/projects", () => {
    const { container } = renderWithIntl(<ProjectFilters actionPath="/en/projects" provinces={provinces} developers={developers} hiddenCategory="apartments" />, "en");
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveAttribute("value", "apartments");
    expect(screen.getByLabelText("Province/city")).toHaveTextContent("Province/city");
    expect(screen.getByLabelText("Status")).toHaveTextContent("Status");
    expect(screen.getByLabelText("Developer")).toHaveTextContent("Developer");
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });
});

describe("ProjectSortControl", () => {
  it("đổi sắp xếp: router.push giữ mọi bộ lọc, về trang 1; 'Mới nhất' không lên URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectSortControl actionPath="/du-an" params={{ category: "can-ho", province: "ha-noi", q: "sông" }} />);
    expect(screen.getByLabelText("Sắp xếp")).toHaveTextContent("Mới nhất");
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Giá tăng dần");
    expect(push).toHaveBeenLastCalledWith("/du-an?category=can-ho&province=ha-noi&q=s%C3%B4ng&sort=price_asc");
  });

  it("đang sắp xếp theo giá giảm: hiện đúng giá trị, chọn 'Mới nhất' bỏ sort khỏi URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ProjectSortControl actionPath="/du-an" value="price_desc" params={{}} />);
    expect(screen.getByLabelText("Sắp xếp")).toHaveTextContent("Giá giảm dần");
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Mới nhất");
    expect(push).toHaveBeenLastCalledWith("/du-an");
  });
});
