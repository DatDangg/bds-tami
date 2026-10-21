import Link from "next/link";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { chooseOption } from "../media/test-utils";
import { ListPendingProvider, PendingRegion } from "@/components/layout/PendingRegion";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import type { RentalFilters as RentalFilterValues } from "@/lib/search/url-params";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { RentalFilters } from "./RentalFilters";
import { RentalListNavigationProvider } from "./RentalListNavigation";
import { RentalSortControl } from "./RentalSortControl";

const options: RentalFilterOptions = {
  categories: [
    { id: "c1", slug: "can-ho", label: "Căn hộ", depth: 0 },
    { id: "c2", slug: "can-ho-dich-vu", label: "Căn hộ dịch vụ", depth: 1 },
  ],
  provinces: [
    { id: "p1", slug: "ha-noi", name: "Hà Nội" },
    { id: "p2", slug: "ho-chi-minh", name: "Hồ Chí Minh" },
  ],
  wards: [],
  wardsProvince: null,
  projects: [],
};
const withHanoiWards: RentalFilterOptions = {
  ...options,
  wards: [
    { slug: "ba-dinh", name: "Phường Ba Đình" },
    { slug: "cau-giay", name: "Phường Cầu Giấy" },
  ],
  wardsProvince: "ha-noi",
};
const none: RentalFilterValues = { sort: "newest", page: 1 };

function ui(filters: RentalFilterValues, opts: RentalFilterOptions = options, locale: "vi" | "en" = "vi", fixedCategory?: string, actionPath?: string, categoryRow?: ReactNode) {
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi_ : en}>
      <RentalListNavigationProvider actionPath={actionPath ?? (locale === "vi" ? "/cho-thue" : "/en/for-rent")} filters={filters}>
        <ListPendingProvider>
          <RentalFilters filters={filters} options={opts} fixedCategory={fixedCategory} categoryRow={categoryRow} />
          <RentalSortControl />
          <PendingRegion>
            <p>Kết quả</p>
          </PendingRegion>
        </ListPendingProvider>
      </RentalListNavigationProvider>
    </NextIntlClientProvider>
  );
}

const bar = () => within(screen.getByRole("search", { name: /Tìm tin cho thuê|Search rental listings/ }));
const lastUrl = () => replace.mock.calls.at(-1)?.[0];
/** jsdom không có matchMedia: mặc định < lg (Sheet); `desktop(true)` giả lập ≥ lg (Popover). */
const desktop = (matches: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches, media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  replace.mockReset();
});

describe("RentalFilters: thẻ lọc (áp dụng ngay, URL là nguồn sự thật)", () => {
  it("gõ từ khoá: chờ 300ms mới đổi URL, một lần duy nhất, scroll=false", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(bar().getByLabelText("Từ khoá"), "studio");
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cho-thue?q=studio", { scroll: false });
  });

  it("ô từ khoá giới hạn 100 ký tự", () => {
    render(ui(none));
    expect(bar().getByLabelText("Từ khoá")).toHaveAttribute("maxlength", "100");
  });

  it("nút Tìm kiếm áp dụng ngay (không đợi debounce), không tải lại trang", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(bar().getByLabelText("Từ khoá"), "studio");
    await user.click(bar().getByRole("button", { name: "Tìm kiếm" }));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(lastUrl()).toBe("/cho-thue?q=studio");
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("Enter trong ô từ khoá submit form và áp dụng ngay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(bar().getByLabelText("Từ khoá"), "a{Enter}");
    expect(lastUrl()).toBe("/cho-thue?q=a");
  });

  it("hàng danh mục do trang truyền vào nằm giữa ô từ khoá và 'Tùy chọn khác', cùng một form", () => {
    render(ui(none, options, "vi", undefined, undefined, <Link href="/cho-thue/danh-muc/can-ho">Căn hộ</Link>));
    const chip = bar().getByRole("link", { name: "Căn hộ" });
    expect(bar().getByLabelText("Từ khoá").compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chip.compareDocumentPosition(bar().getByRole("group", { name: "Tùy chọn khác" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("hàng 'Tùy chọn khác' có đủ 6 ô theo thứ tự: Khu vực, Mức giá, Diện tích, Phòng ngủ, Nội thất, Tiện ích + nút Bộ lọc", () => {
    render(ui(none));
    const more = bar().getByRole("group", { name: "Tùy chọn khác" });
    const names = Array.from(more.querySelectorAll("button")).map((element) => element.getAttribute("aria-label") ?? element.textContent?.trim());
    expect(names).toEqual(["Tỉnh/thành", "Giá/tháng (VNĐ)", "Diện tích (m²)", "Phòng ngủ", "Nội thất", "Tiện ích", "Bộ lọc"]);
  });

  it("danh mục trên URL của /cho-thue (?category=) được giữ khi đổi ô khác (không còn ô chọn danh mục)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ category: "can-ho", sort: "newest", page: 3 }));
    expect(bar().queryByLabelText("Danh mục")).toBeNull();
    await user.type(bar().getByLabelText("Từ khoá"), "a{Enter}");
    expect(lastUrl()).toBe("/cho-thue?q=a&category=can-ho");
  });

  it("ô Mức giá đặt priceMin/priceMax như chip mốc giá cũ; 'Mức giá' (mục đầu) bỏ cả hai; mốc đang chọn hiện đúng", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "5-10 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMin=5000000&priceMax=10000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "< 5 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMax=5000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "> 20 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMin=20000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "Mức giá");
    expect(lastUrl()).toBe("/cho-thue");
    expect(String(lastUrl())).not.toContain("__");
    rerender(ui({ priceMin: 5_000_000, priceMax: 10_000_000, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Giá/tháng (VNĐ)")).toHaveTextContent("5-10 triệu");
    rerender(ui({ priceMin: 7_000_000, priceMax: 9_000_000, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Giá/tháng (VNĐ)")).toHaveTextContent("Khoảng giá tuỳ chọn");
  });

  it("ô Diện tích dùng chung mốc với ô tìm kiếm trang chủ (areaMin/areaMax); mục đầu bỏ cả hai; khoảng tự nhập hiện 'Diện tích tuỳ chọn'", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    await chooseOption(user, bar().getByLabelText("Diện tích (m²)"), "30-50 m²");
    expect(lastUrl()).toBe("/cho-thue?areaMin=30&areaMax=50");
    await chooseOption(user, bar().getByLabelText("Diện tích (m²)"), "< 30 m²");
    expect(lastUrl()).toBe("/cho-thue?areaMax=30");
    await chooseOption(user, bar().getByLabelText("Diện tích (m²)"), "> 120 m²");
    expect(lastUrl()).toBe("/cho-thue?areaMin=120");
    await chooseOption(user, bar().getByLabelText("Diện tích (m²)"), "Diện tích");
    expect(lastUrl()).toBe("/cho-thue");
    rerender(ui({ areaMin: 50, areaMax: 80, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Diện tích (m²)")).toHaveTextContent("50-80 m²");
    rerender(ui({ areaMin: 35, areaMax: 45, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Diện tích (m²)")).toHaveTextContent("Diện tích tuỳ chọn");
  });

  it("ô Khu vực = tỉnh (province): đổi ngay, bỏ phường; mục đầu bỏ khỏi URL", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 2 }, withHanoiWards));
    expect(bar().getByLabelText("Tỉnh/thành")).toHaveTextContent("Hà Nội");
    await chooseOption(user, bar().getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(lastUrl()).toBe("/cho-thue?province=ho-chi-minh");
    await chooseOption(user, bar().getByLabelText("Tỉnh/thành"), "Khu vực");
    expect(lastUrl()).toBe("/cho-thue");
  });

  it("ô Phòng ngủ và Nội thất đặt bedrooms / furnishing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, bar().getByLabelText("Phòng ngủ"), "4+ phòng ngủ");
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4");
    await chooseOption(user, bar().getByLabelText("Nội thất"), "Đầy đủ");
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4&furnishing=full");
    await chooseOption(user, bar().getByLabelText("Phòng ngủ"), "Phòng ngủ");
    expect(lastUrl()).toBe("/cho-thue?furnishing=full");
  });

  it("Tiện ích chọn NHIỀU: xổ danh sách ô tích, URL `amenities=a,b` theo thứ tự danh sách (AND); bỏ tích từng cái; nút hiện số đã chọn", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ amenities: ["gym"], sort: "newest", page: 1 }));
    const trigger = bar().getByRole("button", { name: "Tiện ích (1)" });
    await user.click(trigger);
    const group = within(await screen.findByRole("group", { name: "Tiện ích" }));
    expect(group.getAllByRole("checkbox")).toHaveLength(10);
    expect(group.getByRole("checkbox", { name: "Phòng gym" })).toBeChecked();
    expect(group.getByRole("checkbox", { name: "Hồ bơi" })).not.toBeChecked();
    await user.click(group.getByRole("checkbox", { name: "Hồ bơi" }));
    expect(lastUrl()).toBe("/cho-thue?amenities=pool%2Cgym");
    expect(group.getByRole("checkbox", { name: "Hồ bơi" })).toBeChecked();
    await user.click(group.getByRole("checkbox", { name: "Phòng gym" }));
    expect(lastUrl()).toBe("/cho-thue?amenities=pool");
    await user.click(group.getByRole("checkbox", { name: "Hồ bơi" }));
    expect(lastUrl()).toBe("/cho-thue");
    expect(trigger).toHaveTextContent(/^Tiện ích$/);
  });

  it("/en: đường dẫn công khai /en/for-rent", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, options, "en"));
    await chooseOption(user, within(screen.getByRole("search", { name: "Search rental listings" })).getByLabelText("Province/city"), "Hà Nội");
    expect(lastUrl()).toBe("/en/for-rent?province=ha-noi");
  });
});

describe("RentalFilters: form GET (không JS) + huy hiệu", () => {
  it("SSR (trước hydrate): form GET tới trang, ô có name đúng tên tham số URL, ô chọn là <select> gốc đã chọn sẵn, tham số khác được giữ không trùng", () => {
    const html = renderToString(
      ui({ category: "can-ho", province: "ha-noi", ward: "ba-dinh", priceMin: 5_000_000, priceMax: 10_000_000, bedrooms: 2, furnishing: "full", amenities: ["pool"], sort: "price_asc", page: 4 }, withHanoiWards),
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    const form = doc.querySelector("form[role=search]")!;
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe("/cho-thue");
    expect(form.querySelector("input[name=q]")).not.toBeNull();
    const province = form.querySelector("select[name=province]") as HTMLSelectElement;
    expect(Array.from(province.options).map((option) => option.value)).toEqual(["", "ha-noi", "ho-chi-minh"]);
    expect(province.querySelector("option[selected]")?.getAttribute("value")).toBe("ha-noi");
    expect((form.querySelector("select[name=bedrooms]") as HTMLSelectElement).querySelector("option[selected]")?.getAttribute("value")).toBe("2");
    expect((form.querySelector("select[name=furnishing]") as HTMLSelectElement).querySelector("option[selected]")?.getAttribute("value")).toBe("full");
    const hidden = Object.fromEntries(Array.from(form.querySelectorAll("input[type=hidden]")).map((input) => [input.getAttribute("name"), input.getAttribute("value")]));
    // page không được giữ (lọc mới về trang 1); q / province / bedrooms / furnishing do ô tự gửi nên KHÔNG lặp ở input ẩn (tránh gửi hai lần).
    expect(hidden).toEqual({ category: "can-ho", ward: "ba-dinh", priceMin: "5000000", priceMax: "10000000", amenities: "pool", sort: "price_asc" });
    expect(form.querySelector("button[type=submit]")).not.toBeNull();
  });

  it("huy hiệu trên 'Bộ lọc' CHỈ đếm lọc trong Popover/Sheet: phường + khoảng giá tự nhập + khoảng diện tích tự nhập; tỉnh, mốc, phòng ngủ, nội thất, tiện ích, từ khoá, danh mục không tính", () => {
    const { rerender } = render(ui({ q: "a", category: "can-ho", province: "ha-noi", priceMin: 5_000_000, priceMax: 10_000_000, areaMin: 30, areaMax: 50, bedrooms: 2, furnishing: "full", amenities: ["pool", "gym"], sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByRole("button", { name: "Bộ lọc" })).toBeInTheDocument();
    expect(bar().queryByTestId("filters-count")).toBeNull();
    rerender(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByRole("button", { name: "Bộ lọc (1)" })).toBeInTheDocument();
    expect(bar().getByTestId("filters-count")).toHaveTextContent("1");
    rerender(ui({ province: "ha-noi", ward: "ba-dinh", priceMin: 7_000_000, priceMax: 9_000_000, areaMin: 35, areaMax: 45, sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByRole("button", { name: "Bộ lọc (3)" })).toBeInTheDocument();
  });
});

describe("RentalFilters: vào từ nút tìm kiếm của header", () => {
  it("focusSearch: con trỏ vào ô từ khoá; mặc định thì không", () => {
    const { unmount } = render(ui(none));
    expect(document.body).toHaveFocus();
    unmount();
    render(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <RentalListNavigationProvider actionPath="/cho-thue" filters={none}>
          <RentalFilters filters={none} options={options} focusSearch />
        </RentalListNavigationProvider>
      </NextIntlClientProvider>,
    );
    expect(document.activeElement).toBe(screen.getByLabelText("Từ khoá"));
    expect(document.activeElement).toHaveAttribute("type", "search");
  });
});

describe("RentalFilters: đồng bộ với URL", () => {
  it("URL đổi từ ngoài (bỏ chip, nút Xoá, back) thì ô nạp lại", () => {
    const { rerender } = render(ui({ q: "studio", province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByLabelText("Từ khoá")).toHaveValue("studio");
    expect(bar().getByLabelText("Tỉnh/thành")).toHaveTextContent("Hà Nội");
    rerender(ui(none));
    expect(bar().getByLabelText("Từ khoá")).toHaveValue("");
    expect(bar().getByLabelText("Tỉnh/thành")).toHaveTextContent("Khu vực");
  });

  it("URL đổi do chính lần gõ của người dùng thì KHÔNG nuốt chữ gõ thêm trong lúc chờ server", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    const input = bar().getByLabelText("Từ khoá");
    await user.type(input, "ab");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?q=ab");
    await user.type(input, "c");
    // Server trả về kết quả của lần commit đầu ("ab") khi người dùng đã gõ thêm "c".
    rerender(ui({ q: "ab", sort: "newest", page: 1 }));
    expect(input).toHaveValue("abc");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?q=abc");
  });

  it("vùng kết quả không bận khi chưa đổi bộ lọc (aria-busy=false)", () => {
    render(ui(none));
    expect(screen.getByText("Kết quả").parentElement).toHaveAttribute("aria-busy", "false");
  });
});

describe("RentalFilters: sắp xếp ở hàng kết quả", () => {
  it("đổi ngay, giữ bộ lọc đang trên URL, về trang 1; về mặc định thì bỏ sort", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui({ province: "ha-noi", bedrooms: 2, sort: "newest", page: 3 }));
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Giá giảm dần");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&bedrooms=2&sort=price_desc");
    rerender(ui({ province: "ha-noi", bedrooms: 2, sort: "price_desc", page: 1 }));
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Mới nhất");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&bedrooms=2");
  });

  it("đổi Khu vực khi server chưa trả về rồi đổi sắp xếp → URL cuối có cả province và sort", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, bar().getByLabelText("Tỉnh/thành"), "Hà Nội");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi");
    // props `filters` vẫn là URL cũ (đang pending): ô Sắp xếp phải dựa trên bản nháp chung.
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Giá giảm dần");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&sort=price_desc");
    expect(screen.getByLabelText("Sắp xếp")).toHaveTextContent("Giá giảm dần");
  });

  it("từ khoá đang chờ debounce + đổi sắp xếp → một URL có cả q và sort, và không bắn thêm lần nào sau đó", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(bar().getByLabelText("Từ khoá"), "studio");
    expect(replace).not.toHaveBeenCalled();
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Giá giảm dần");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(lastUrl()).toBe("/cho-thue?q=studio&sort=price_desc");
    act(() => vi.advanceTimersByTime(1000));
    expect(replace).toHaveBeenCalledTimes(1);
  });
});

describe("RentalFilters: trang danh mục (danh mục khoá)", () => {
  it("đổi giá đổi URL của trang danh mục, không thêm category", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, { ...options, categories: [] }, "vi", "can-ho", "/cho-thue/danh-muc/can-ho"));
    expect(bar().queryByLabelText("Danh mục")).toBeNull();
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "< 5 triệu");
    expect(lastUrl()).toBe("/cho-thue/danh-muc/can-ho?priceMax=5000000");
  });

  it("Sheet: số 'Xem n tin' đếm theo danh mục khoá dù bản nháp không có category", async () => {
    const fetchSpy = vi.fn<(url: string) => Promise<Response>>(async () => Response.json({ success: true, data: { total: 4 } }));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, { ...options, categories: [] }, "vi", "can-ho", "/cho-thue/danh-muc/can-ho"));
    await user.click(bar().getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog", { name: "Bộ lọc tin cho thuê" });
    await within(dialog).findByRole("button", { name: "Xem 4 tin" });
    const url = new URL(String(fetchSpy.mock.calls.map((call) => call[0] as string).find((u) => u.startsWith("/api/public/rentals"))), "http://x");
    expect(url.searchParams.get("category")).toBe("can-ho");
    expect(within(dialog).queryByLabelText("Danh mục")).toBeNull();
  });
});

describe("RentalFilters: Popover 'Bộ lọc' (≥ lg, áp dụng ngay)", () => {
  async function openPopover(user: ReturnType<typeof userEvent.setup>) {
    desktop(true);
    await user.click(bar().getByRole("button", { name: /^Bộ lọc/ }));
    return screen.findByRole("dialog", { name: "Bộ lọc tin cho thuê" });
  }

  it("CHỈ còn phường + khoảng giá / diện tích tự nhập (không tỉnh, phòng ngủ, nội thất, tiện ích, từ khoá, danh mục, sắp xếp); ô đổi URL ngay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    render(ui({ province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    const popover = within(await openPopover(user));
    for (const label of ["Từ khoá", "Danh mục", "Sắp xếp", "Tỉnh/thành", "Phòng ngủ", "Nội thất", "Tiện ích"]) expect(popover.queryByLabelText(label)).toBeNull();
    expect(popover.getByLabelText("Phường/xã")).toBeEnabled();
    await user.type(popover.getByLabelText("Diện tích đến"), "60");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&areaMax=60");
    await chooseOption(user, popover.getByLabelText("Phường/xã"), "Phường Cầu Giấy");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&ward=cau-giay&areaMax=60");
  });

  it("phường bị khoá cho tới khi chọn tỉnh ở hàng 'Tùy chọn khác'; đổi tỉnh bỏ phường, ô phường khoá tới khi server trả phường mới", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    const { rerender } = render(ui(none));
    let popover = within(await openPopover(user));
    expect(popover.getByLabelText("Phường/xã")).toBeDisabled();
    await user.keyboard("{Escape}");
    rerender(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 3 }, withHanoiWards));
    await chooseOption(user, bar().getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(lastUrl()).toBe("/cho-thue?province=ho-chi-minh");
    popover = within(await openPopover(user));
    expect(popover.getByLabelText("Phường/xã")).toBeDisabled();
    rerender(ui({ province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    await chooseOption(user, popover.getByLabelText("Phường/xã"), "Phường Cầu Giấy");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&ward=cau-giay");
  });

  it("giá min > max được đảo lại trong URL (cùng bộ phân tích với server)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    render(ui({ priceMax: 3_000_000, sort: "newest", page: 1 }));
    const popover = within(await openPopover(user));
    await user.type(popover.getByLabelText("Giá từ"), "9000000");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?priceMin=3000000&priceMax=9000000");
  });

  it("nút Đóng nhìn thấy (tên truy cập, ≥ 44px) đóng Popover và trả focus về nút 'Bộ lọc'", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    render(ui(none));
    const popover = within(await openPopover(user));
    const close = popover.getByRole("button", { name: "Đóng bộ lọc" });
    expect(close.className).toContain("size-11");
    await user.click(close);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(bar().getByRole("button", { name: /^Bộ lọc/ })).toHaveFocus();
  });

  it("Esc đóng và trả focus về nút 'Bộ lọc'", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    render(ui(none));
    await openPopover(user);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(bar().getByRole("button", { name: /^Bộ lọc/ })).toHaveFocus();
  });
});

describe("RentalFilters: Sheet 'Bộ lọc' (< lg)", () => {
  const fetchMock = () => {
    const mock = vi.fn(async (url: string) => (url.startsWith("/api/wards") ? Response.json({ docs: [{ id: "w9", name: "Phường Bến Nghé", slug: "ben-nghe" }] }) : Response.json({ success: true, data: { total: 7 } })));
    vi.stubGlobal("fetch", mock);
    return mock;
  };

  it("Sheet là dialog, ô lọc đổi KHÔNG đổi URL; 'Xem n tin' lấy số sống từ API và chỉ áp dụng khi bấm", async () => {
    const fetchSpy = fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.click(bar().getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog", { name: "Bộ lọc tin cho thuê" });
    for (const label of ["Tỉnh/thành", "Phòng ngủ", "Nội thất", "Tiện ích"]) expect(within(dialog).queryByLabelText(label)).toBeNull();
    await user.type(within(dialog).getByLabelText("Giá từ"), "5000000");
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    const show = await within(dialog).findByRole("button", { name: "Xem 7 tin" });
    const countCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith("/api/public/rentals"))!;
    expect(new URL(countCall, "http://x").searchParams.get("priceMin")).toBe("5000000");
    expect(new URL(countCall, "http://x").searchParams.get("limit")).toBe("1");
    expect(new URL(countCall, "http://x").searchParams.get("available")).toBe("true");
    await user.click(show);
    expect(replace).toHaveBeenCalledWith("/cho-thue?priceMin=5000000", { scroll: false });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Sheet giữ từ khoá/danh mục/tỉnh/phòng ngủ/sắp xếp khi áp dụng; 'Xoá' chỉ dọn phường + khoảng tự nhập", async () => {
    fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ q: "cũ", category: "can-ho", province: "ha-noi", priceMin: 7_000_000, priceMax: 9_000_000, bedrooms: 2, sort: "price_asc", page: 1 }, withHanoiWards));
    await user.click(bar().getByRole("button", { name: "Bộ lọc (1)" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Từ khoá")).toBeNull();
    expect(within(dialog).getByLabelText("Giá từ")).toHaveValue(7000000);
    await user.click(within(dialog).getByRole("button", { name: "Xoá" }));
    expect(within(dialog).getByLabelText("Giá từ")).toHaveValue(null);
    await chooseOption(user, within(dialog).getByLabelText("Phường/xã"), "Phường Cầu Giấy");
    await user.click(within(dialog).getByRole("button", { name: /^Xem/ }));
    expect(replace).toHaveBeenLastCalledWith("/cho-thue?q=c%C5%A9&category=can-ho&province=ha-noi&ward=cau-giay&bedrooms=2&sort=price_asc", { scroll: false });
  });

  it("Sheet nạp từ bản nháp chung (Khu vực vừa đổi, URL chưa kịp cập nhật): tải phường qua REST, áp qua update chung — không mất tỉnh / từ khoá, không bắn thêm lần debounce", async () => {
    const fetchSpy = fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, bar().getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(lastUrl()).toBe("/cho-thue?province=ho-chi-minh");
    await user.type(bar().getByRole("searchbox"), "abc");
    await user.click(bar().getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByLabelText("Phường/xã")).toBeEnabled());
    const wardsCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith("/api/wards"))!;
    expect(decodeURIComponent(wardsCall)).toContain("where[province][equals]=p2");
    await chooseOption(user, within(dialog).getByLabelText("Phường/xã"), "Phường Bến Nghé");
    await user.click(within(dialog).getByRole("button", { name: /^Xem/ }));
    expect(lastUrl()).toBe("/cho-thue?q=abc&province=ho-chi-minh&ward=ben-nghe");
    const calls = replace.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(replace.mock.calls).toHaveLength(calls);
  });

  it("đếm lỗi: nút vẫn bấm được với nhãn không kèm số", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 500 })));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.click(bar().getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog");
    act(() => vi.advanceTimersByTime(300));
    expect(await within(dialog).findByRole("button", { name: "Xem tin" })).toBeEnabled();
  });
});
