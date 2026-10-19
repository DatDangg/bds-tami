import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/i18n/messages/en.json";
import vi_ from "@/i18n/messages/vi.json";
import { chooseOption } from "../media/test-utils";
import type { RentalFilterOptions } from "@/lib/rentals/rental-list-queries";
import type { RentalFilters as RentalFilterValues } from "@/lib/search/url-params";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { RentalFilters } from "./RentalFilters";
import { RentalPendingRegion, RentalListNavigationProvider } from "./RentalListNavigation";
import { RentalSortControl } from "./RentalSortControl";

const options: RentalFilterOptions = {
  categories: [
    { slug: "can-ho", label: "Căn hộ", depth: 0 },
    { slug: "can-ho-dich-vu", label: "Căn hộ dịch vụ", depth: 1 },
  ],
  provinces: [
    { id: "p1", slug: "ha-noi", name: "Hà Nội" },
    { id: "p2", slug: "ho-chi-minh", name: "Hồ Chí Minh" },
  ],
  wards: [],
  wardsProvince: null,
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

function ui(filters: RentalFilterValues, opts: RentalFilterOptions = options, locale: "vi" | "en" = "vi", fixedCategory?: string, actionPath?: string) {
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi_ : en}>
      <RentalListNavigationProvider actionPath={actionPath ?? (locale === "vi" ? "/cho-thue" : "/en/for-rent")} filters={filters}>
        <RentalFilters filters={filters} options={opts} fixedCategory={fixedCategory} />
        <RentalSortControl />
        <RentalPendingRegion>
          <p>Kết quả</p>
        </RentalPendingRegion>
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

describe("RentalFilters: băng tìm kiếm (áp dụng ngay, URL là nguồn sự thật)", () => {
  it("gõ từ khoá: chờ 300ms mới đổi URL, một lần duy nhất, scroll=false", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(bar().getByLabelText("Từ khoá"), "studio");
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cho-thue?q=studio", { scroll: false });
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

  it("ô Loại là danh mục (tham số category): đổi ngay; 'Tất cả danh mục' bỏ khỏi URL, không lộ sentinel", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ category: "can-ho", sort: "newest", page: 3 }));
    await chooseOption(user, bar().getByLabelText("Danh mục"), "– Căn hộ dịch vụ");
    expect(lastUrl()).toBe("/cho-thue?category=can-ho-dich-vu");
    await chooseOption(user, bar().getByLabelText("Danh mục"), /^Tất cả/);
    expect(lastUrl()).toBe("/cho-thue");
    expect(String(lastUrl())).not.toContain("__");
  });

  it("ô Khoảng giá đặt priceMin/priceMax như chip mốc giá cũ; 'Mọi mức giá' bỏ cả hai; mốc đang chọn hiện đúng", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "5-10 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMin=5000000&priceMax=10000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "< 5 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMax=5000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "> 20 triệu");
    expect(lastUrl()).toBe("/cho-thue?priceMin=20000000");
    await chooseOption(user, bar().getByLabelText("Giá/tháng (VNĐ)"), "Mọi mức giá");
    expect(lastUrl()).toBe("/cho-thue");
    rerender(ui({ priceMin: 5_000_000, priceMax: 10_000_000, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Giá/tháng (VNĐ)")).toHaveTextContent("5-10 triệu");
    rerender(ui({ priceMin: 7_000_000, priceMax: 9_000_000, sort: "newest", page: 1 }));
    expect(bar().getByLabelText("Giá/tháng (VNĐ)")).toHaveTextContent("Khoảng giá tuỳ chọn");
  });

  it("/en: đường dẫn công khai /en/for-rent", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, options, "en"));
    await chooseOption(user, within(screen.getByRole("search", { name: "Search rental listings" })).getByLabelText("Category"), "Căn hộ");
    expect(lastUrl()).toBe("/en/for-rent?category=can-ho");
  });
});

describe("RentalFilters: form GET (không JS) + huy hiệu", () => {
  it("SSR (trước hydrate): form GET tới trang, ô có name đúng tên tham số URL, ô chọn là <select> gốc đã chọn sẵn, tham số khác được giữ", () => {
    const html = renderToString(ui({ category: "can-ho", province: "ha-noi", priceMin: 5_000_000, priceMax: 10_000_000, bedrooms: 2, sort: "price_asc", page: 4 }, withHanoiWards));
    const doc = new DOMParser().parseFromString(html, "text/html");
    const form = doc.querySelector("form[role=search]")!;
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe("/cho-thue");
    expect(form.querySelector("input[name=q]")).not.toBeNull();
    const category = form.querySelector("select[name=category]") as HTMLSelectElement;
    expect(Array.from(category.options).map((option) => option.value)).toEqual(["", "can-ho", "can-ho-dich-vu"]);
    expect(category.querySelector("option[selected]")?.getAttribute("value")).toBe("can-ho");
    const hidden = Object.fromEntries(Array.from(form.querySelectorAll("input[type=hidden]")).map((input) => [input.getAttribute("name"), input.getAttribute("value")]));
    // page không được giữ (lọc mới về trang 1); q/category do ô tự gửi.
    expect(hidden).toEqual({ province: "ha-noi", priceMin: "5000000", priceMax: "10000000", bedrooms: "2", sort: "price_asc" });
    expect(form.querySelector("button[type=submit]")).not.toBeNull();
  });

  it("huy hiệu trên 'Bộ lọc' đếm lọc PHỤ (tỉnh, phường, diện tích, phòng ngủ, nội thất, giá tự nhập); từ khoá/danh mục/mốc giá của băng không tính", () => {
    const { rerender } = render(ui({ q: "a", category: "can-ho", priceMin: 5_000_000, priceMax: 10_000_000, sort: "newest", page: 1 }));
    expect(bar().getByRole("button", { name: "Bộ lọc" })).toBeInTheDocument();
    expect(bar().queryByTestId("filters-count")).toBeNull();
    rerender(ui({ province: "ha-noi", ward: "ba-dinh", areaMin: 20, areaMax: 40, bedrooms: 2, sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByRole("button", { name: "Bộ lọc (4)" })).toBeInTheDocument();
    expect(bar().getByTestId("filters-count")).toHaveTextContent("4");
    // Khoảng giá tự nhập (không trùng mốc nào) nằm trong Sheet/Popover và bị "Xoá" dọn → tính 1.
    rerender(ui({ priceMin: 7_000_000, priceMax: 9_000_000, sort: "newest", page: 1 }));
    expect(bar().getByRole("button", { name: "Bộ lọc (1)" })).toBeInTheDocument();
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
    const { rerender } = render(ui({ q: "studio", category: "can-ho", sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByLabelText("Từ khoá")).toHaveValue("studio");
    expect(bar().getByLabelText("Danh mục")).toHaveTextContent("Căn hộ");
    rerender(ui(none));
    expect(bar().getByLabelText("Từ khoá")).toHaveValue("");
    expect(bar().getByLabelText("Danh mục")).toHaveTextContent("Tất cả danh mục");
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

  it("đổi Loại khi server chưa trả về rồi đổi sắp xếp → URL cuối có cả category và sort", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, bar().getByLabelText("Danh mục"), "Căn hộ");
    expect(lastUrl()).toBe("/cho-thue?category=can-ho");
    // props `filters` vẫn là URL cũ (đang pending): ô Sắp xếp phải dựa trên bản nháp chung.
    await chooseOption(user, screen.getByLabelText("Sắp xếp"), "Giá giảm dần");
    expect(lastUrl()).toBe("/cho-thue?category=can-ho&sort=price_desc");
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
  it("không có ô Loại (options.categories rỗng); đổi giá đổi URL của trang danh mục, không thêm category", async () => {
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

describe("RentalFilters: Popover lọc phụ (≥ lg, áp dụng ngay)", () => {
  async function openPopover(user: ReturnType<typeof userEvent.setup>) {
    desktop(true);
    await user.click(bar().getByRole("button", { name: /^Bộ lọc/ }));
    return screen.findByRole("dialog", { name: "Bộ lọc tin cho thuê" });
  }

  it("chứa lọc phụ (không có từ khoá/danh mục/sắp xếp); chip và ô đổi URL ngay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    render(ui(none));
    const popover = within(await openPopover(user));
    expect(popover.queryByLabelText("Từ khoá")).toBeNull();
    expect(popover.queryByLabelText("Danh mục")).toBeNull();
    expect(popover.queryByLabelText("Sắp xếp")).toBeNull();
    await user.click(popover.getByRole("button", { name: "4+" }));
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4");
    await user.click(popover.getByRole("button", { name: "Đầy đủ" }));
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4&furnishing=full");
    await user.click(popover.getByRole("button", { name: "4+" }));
    expect(lastUrl()).toBe("/cho-thue?furnishing=full");
    await user.type(popover.getByLabelText("Diện tích đến"), "60");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?areaMax=60&furnishing=full");
  });

  it("đổi tỉnh: bỏ phường, ô phường khoá cho tới khi server trả phường mới; phường chọn được khi đã có", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    desktop(true);
    const { rerender } = render(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 3 }, withHanoiWards));
    const popover = within(await openPopover(user));
    await chooseOption(user, popover.getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(lastUrl()).toBe("/cho-thue?province=ho-chi-minh");
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

describe("RentalFilters: Sheet lọc phụ (< lg)", () => {
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
    await user.click(within(dialog).getByRole("button", { name: "3" }));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    const show = await within(dialog).findByRole("button", { name: "Xem 7 tin" });
    const countCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith("/api/public/rentals"))!;
    expect(new URL(countCall, "http://x").searchParams.get("bedrooms")).toBe("3");
    expect(new URL(countCall, "http://x").searchParams.get("limit")).toBe("1");
    expect(new URL(countCall, "http://x").searchParams.get("available")).toBe("true");
    await user.click(show);
    expect(replace).toHaveBeenCalledWith("/cho-thue?bedrooms=3", { scroll: false });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Sheet giữ từ khoá/danh mục/giá/sắp xếp khi áp dụng; 'Xoá' chỉ dọn lọc phụ; đổi tỉnh tải phường qua REST", async () => {
    const fetchSpy = fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ q: "cũ", category: "can-ho", priceMin: 5_000_000, bedrooms: 2, sort: "price_asc", page: 1 }));
    await user.click(bar().getByRole("button", { name: "Bộ lọc (2)" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Từ khoá")).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Xoá" }));
    expect(within(dialog).getByRole("button", { name: "2" })).toHaveAttribute("aria-pressed", "false");

    expect(within(dialog).getByLabelText("Phường/xã")).toBeDisabled();
    await chooseOption(user, within(dialog).getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    await waitFor(() => expect(within(dialog).getByLabelText("Phường/xã")).toBeEnabled());
    const wardsCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith("/api/wards"))!;
    expect(decodeURIComponent(wardsCall)).toContain("where[province][equals]=p2");
    await chooseOption(user, within(dialog).getByLabelText("Phường/xã"), "Phường Bến Nghé");

    await user.click(within(dialog).getByRole("button", { name: /^Xem/ }));
    // "Xoá" dọn cả khoảng giá tuỳ chọn nằm trong Sheet; từ khoá + danh mục + sắp xếp còn nguyên.
    expect(replace).toHaveBeenLastCalledWith("/cho-thue?q=c%C5%A9&category=can-ho&province=ho-chi-minh&ward=ben-nghe&sort=price_asc", { scroll: false });
  });

  it("Sheet nạp từ bản nháp chung (Loại vừa đổi, URL chưa kịp cập nhật) và áp qua update chung: không mất Loại, không bắn thêm lần debounce", async () => {
    fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, bar().getByLabelText("Danh mục"), "Căn hộ");
    expect(lastUrl()).toBe("/cho-thue?category=can-ho");
    await user.type(bar().getByRole("searchbox"), "abc");
    await user.click(bar().getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "3" }));
    await user.click(within(dialog).getByRole("button", { name: /^Xem/ }));
    expect(lastUrl()).toBe("/cho-thue?q=abc&category=can-ho&bedrooms=3");
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
