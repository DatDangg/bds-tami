import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import vi_ from "@/i18n/messages/vi.json";
import { chooseOption, renderWithIntl } from "@/components/media/test-utils";
import { HeroSearch, RENTAL_KEYWORD_PARAM, rentalFiltersFromForm } from "./HeroSearch";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const chips = [
  { id: "p1", title: "Vinhomes Ocean Park", href: "/du-an/ocean-park" },
  { id: "p2", title: "Sun Grand", href: "/du-an/sun-grand" },
];
const provinces = [
  { slug: "ha-noi", name: "Hà Nội" },
  { slug: "tp-hcm", name: "TP.HCM" },
];
const rentalCategories = [
  { slug: "can-ho", name: "Căn hộ" },
  { slug: "nha-pho", name: "Nhà phố" },
];
const props = { placeholder: null, chips, rentalsHref: "/cho-thue", projectsHref: "/du-an", provinces, rentalCategories };

/** Tên các control có `name` trong form (sau hydrate OptionSelect dùng input ẩn, trước hydrate là select gốc). */
const fieldNames = (form: HTMLFormElement) =>
  Array.from(form.elements)
    .map((element) => element.getAttribute("name"))
    .filter(Boolean)
    .sort();

beforeEach(() => push.mockReset());

describe("HeroSearch", () => {
  it("HTML ban đầu (không cần JS): form GET tới danh sách cho thuê với `q` + các ô đơn trị của /cho-thue; hai ô mốc giá/diện tích đặt tên KHÔNG trùng tham số trang đích", () => {
    expect(RENTAL_KEYWORD_PARAM).toBe("q");
    const { container } = renderWithIntl(<HeroSearch {...props} />);
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/cho-thue");
    expect(form).toHaveAttribute("method", "get");
    const input = within(form).getByLabelText("Từ khoá tìm căn hộ cho thuê");
    expect(input).toHaveAttribute("name", "q");
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
    expect(fieldNames(form)).toEqual(["amenities", "areaRange", "category", "furnishing", "priceRange", "q"]);
  });

  it("hàng 'Tùy chọn khác' chỉ ở tab Cho thuê: 5 ô chọn kiểu chip có nhãn, chưa chọn thì chip hiện TÊN ô như mockup (mục đầu = rỗng); không có mũi tên xổ cuối hàng", () => {
    renderWithIntl(<HeroSearch {...props} />);
    const group = screen.getByRole("group", { name: "Tùy chọn khác" });
    const selects = within(group).getAllByRole("combobox");
    expect(selects.map((select) => select.getAttribute("aria-label"))).toEqual(["Mức giá", "Diện tích", "Loại căn hộ", "Nội thất", "Tiện ích"]);
    expect(selects.map((select) => select.textContent)).toEqual(["Mức giá", "Diện tích", "Loại căn hộ", "Nội thất", "Tiện ích"]);
    expect(selects[0]?.className).toContain("rounded-pill");
    expect(within(group).queryByRole("button")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Dự án" }));
    expect(screen.queryByRole("group", { name: "Tùy chọn khác" })).toBeNull();
  });

  it("form Cho thuê dựng sẵn ở HTML server (không JS): select gốc có mốc giá, mốc diện tích, danh mục, nội thất, tiện ích với giá trị đúng của /cho-thue", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <HeroSearch {...props} />
      </NextIntlClientProvider>,
    );
    const root = document.createElement("div");
    root.innerHTML = html;
    const values = (name: string) => Array.from(root.querySelectorAll(`select[name="${name}"] option`)).map((option) => option.getAttribute("value"));
    expect(values("priceRange")).toEqual(["", "under5", "from5to10", "from10to20", "over20"]);
    expect(values("areaRange")).toEqual(["", "under30", "from30to50", "from50to80", "from80to120", "over120"]);
    expect(values("category")).toEqual(["", "can-ho", "nha-pho"]);
    expect(values("furnishing")).toEqual(["", "none", "basic", "full"]);
    expect(values("amenities")).toEqual(["", "pool", "gym", "elevator", "parking", "security", "balcony", "washing_machine", "air_conditioner", "pet_friendly", "kitchen"]);
    expect(root.querySelector('form[action="/cho-thue"] input[name="q"]')).not.toBeNull();
  });

  it("có JS: chọn Mức giá + Loại căn hộ + Nội thất rồi Tìm kiếm → router.push tới /cho-thue với query đúng thứ tự của rentalListQueryString; 'Tất cả' không lên URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<HeroSearch {...props} />);
    await user.type(screen.getByRole("searchbox"), " Vinhomes ");
    await chooseOption(user, screen.getByRole("combobox", { name: "Mức giá" }), "5-10 triệu");
    await chooseOption(user, screen.getByRole("combobox", { name: "Loại căn hộ" }), "Căn hộ");
    await chooseOption(user, screen.getByRole("combobox", { name: "Nội thất" }), "Đầy đủ");
    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/cho-thue?q=Vinhomes&category=can-ho&priceMin=5000000&priceMax=10000000&furnishing=full");
  });

  it("có JS: Diện tích + Tiện ích → areaMin/areaMax + amenities; không chọn gì → đúng đường dẫn danh sách (EN dùng đường dẫn EN)", async () => {
    const user = userEvent.setup();
    const en = renderWithIntl(<HeroSearch {...props} rentalsHref="/en/for-rent" />, "en");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(push).toHaveBeenLastCalledWith("/en/for-rent");
    en.unmount();
    renderWithIntl(<HeroSearch {...props} />);
    await chooseOption(user, screen.getByRole("combobox", { name: "Diện tích" }), "> 120 m²");
    await chooseOption(user, screen.getByRole("combobox", { name: "Tiện ích" }), "Hồ bơi");
    await user.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/cho-thue?areaMin=120&amenities=pool");
  });

  it("rentalFiltersFromForm: giá trị lạ/rỗng bị bỏ, từ khoá cắt khoảng trắng, mốc tách thành min/max", () => {
    const form = new FormData();
    form.set("q", "  ");
    form.set("priceRange", "under5");
    form.set("areaRange", "from30to50");
    form.set("category", "");
    form.set("furnishing", "lạ");
    form.set("amenities", "javascript");
    expect(rentalFiltersFromForm(form)).toEqual({ priceMax: 5_000_000, areaMin: 30, areaMax: 50, sort: "newest", page: 1 });
  });

  it("kính lúp nằm trong ô nhập (trang trí, aria-hidden); nút Tìm kiếm có mũi tên", () => {
    const { container } = renderWithIntl(<HeroSearch {...props} />);
    const field = screen.getByRole("searchbox").parentElement as HTMLElement;
    expect(field.querySelector("svg[aria-hidden]")).not.toBeNull();
    expect(screen.getByRole("searchbox").className).toContain("pr-11");
    expect(container.querySelectorAll('form[action="/cho-thue"] button[type="submit"] svg')).toHaveLength(2);
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
    expect(fieldNames(form)).toEqual(["province", "status"]);
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

  it("BL-083/BL-085: thẻ không ghi đè `pointer-events` khi Radix Select khoá body (gutter bấm xuyên khi không mở), nhưng hàng chip tự `pointer-events-auto` để trigger chip khác nhận pointerdown khi đang khoá", () => {
    renderWithIntl(<HeroSearch {...props} />);
    const section = screen.getByRole("region", { name: "Tìm kiếm nhanh" });
    const card = section.firstElementChild;
    expect(section).toHaveClass("pointer-events-none");
    expect(card).not.toHaveClass("pointer-events-auto");
    expect(card).toHaveClass("not-in-data-[scroll-locked]:pointer-events-auto");
    const chipRow = within(screen.getByRole("group", { name: "Tùy chọn khác" })).getAllByRole("combobox")[0]?.parentElement;
    expect(chipRow).toHaveClass("pointer-events-auto");
  });

  it("BL-085: bấm chip khác khi một dropdown đang mở = đóng cái cũ + mở cái mới trong 1 click; không bao giờ 2 listbox cùng mở; Esc đóng", async () => {
    // jsdom không có CSS tailwind nên `pointer-events` kế thừa `none` từ body khoá bị userEvent chặn; trình duyệt thật có `pointer-events-auto` ở hàng chip.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderWithIntl(<HeroSearch {...props} />);
    const price = screen.getByRole("combobox", { name: "Mức giá" });
    const area = screen.getByRole("combobox", { name: "Diện tích" });
    await user.click(price);
    expect(price).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    await user.click(area);
    expect(price).toHaveAttribute("aria-expanded", "false");
    expect(area).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(area).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).toBeNull();
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

  it("chip gọn 1 hàng từ md (overflow-hidden) + nút tròn mở có aria-expanded/aria-controls; bấm → xuống dòng đủ chip; chip vẫn hiện ở tab Dự án", () => {
    renderWithIntl(<HeroSearch {...props} />);
    const list = screen.getByRole("list", { name: "Dự án được quan tâm" });
    const toggle = screen.getByRole("button", { name: "Xem thêm dự án" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", list.id);
    // Chip không vừa rớt xuống hàng bị ẩn (flex-wrap + h-10 + overflow-hidden), không bị cắt giữa chữ.
    expect(list.className).toContain("md:flex-wrap");
    expect(list.className).toContain("md:h-10");
    expect(list.className).toContain("md:overflow-hidden");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Thu gọn dự án" })).toHaveAttribute("aria-expanded", "true");
    expect(list.className).not.toContain("md:h-10");
    expect(list.className).toContain("md:overflow-visible");
    // m3: tabpanel/form giữ role trong a11y tree — không dùng `display: contents`.
    expect(screen.getByRole("tabpanel").className).not.toContain("contents");
    expect(screen.getByRole("search").className).not.toContain("contents");
    fireEvent.click(screen.getByRole("tab", { name: "Dự án" }));
    expect(screen.getByRole("list", { name: "Dự án được quan tâm" })).toBeInTheDocument();
  });
});
