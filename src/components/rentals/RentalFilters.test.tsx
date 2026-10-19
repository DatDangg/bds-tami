import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
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
      <RentalListNavigationProvider actionPath={actionPath ?? (locale === "vi" ? "/cho-thue" : "/en/for-rent")}>
        <RentalFilters filters={filters} options={opts} fixedCategory={fixedCategory} />
        <RentalPendingRegion>
          <p>Kết quả</p>
        </RentalPendingRegion>
      </RentalListNavigationProvider>
    </NextIntlClientProvider>
  );
}

const panel = () => within(screen.getByRole("region", { name: "Bộ lọc tin cho thuê" }));
const lastUrl = () => replace.mock.calls.at(-1)?.[0];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  replace.mockReset();
});

describe("RentalFilters: thanh lọc desktop (áp dụng ngay, URL là nguồn sự thật)", () => {
  it("gõ từ khoá: chờ 300ms mới đổi URL, một lần duy nhất, scroll=false", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.type(panel().getByLabelText("Từ khoá"), "studio");
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/cho-thue?q=studio", { scroll: false });
  });

  it("chọn tỉnh: đổi ngay, bỏ phường đang chọn và về trang 1 (không có page)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 3 }, withHanoiWards));
    await chooseOption(user, panel().getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(lastUrl()).toBe("/cho-thue?province=ho-chi-minh");
  });

  it("chọn 'Tất cả tỉnh' bỏ province khỏi URL (không lộ sentinel) và bỏ luôn phường", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ province: "ha-noi", ward: "ba-dinh", sort: "newest", page: 1 }, withHanoiWards));
    await chooseOption(user, panel().getByLabelText("Tỉnh/thành"), /^Tất cả/);
    expect(lastUrl()).toBe("/cho-thue");
    expect(String(lastUrl())).not.toContain("__");
  });

  it("phường bị khoá khi chưa chọn tỉnh; có tỉnh thì chọn được và URL có ward", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    expect(panel().getByLabelText("Phường/xã")).toBeDisabled();
    rerender(ui({ province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    const ward = panel().getByLabelText("Phường/xã");
    expect(ward).toBeEnabled();
    await chooseOption(user, ward, "Phường Cầu Giấy");
    expect(lastUrl()).toBe("/cho-thue?province=ha-noi&ward=cau-giay");
  });

  it("đổi tỉnh khi server chưa trả phường mới: ô phường khoá cho tới khi props đổi", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    await chooseOption(user, panel().getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    expect(panel().getByLabelText("Phường/xã")).toBeDisabled();
  });

  it("chip mốc giá đặt cả hai đầu, bấm lại bỏ chọn; ô số debounce", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    const hint = panel().getByRole("button", { name: "5-10 triệu" });
    await user.click(hint);
    expect(lastUrl()).toBe("/cho-thue?priceMin=5000000&priceMax=10000000");
    expect(hint).toHaveAttribute("aria-pressed", "true");
    await user.click(hint);
    expect(lastUrl()).toBe("/cho-thue");
    await user.type(panel().getByLabelText("Diện tích đến"), "60");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?areaMax=60");
  });

  it("phòng ngủ và nội thất là chip bật/tắt; 4+ gửi bedrooms=4", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await user.click(panel().getByRole("button", { name: "4+" }));
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4");
    await user.click(panel().getByRole("button", { name: "Đầy đủ" }));
    expect(lastUrl()).toBe("/cho-thue?bedrooms=4&furnishing=full");
    await user.click(panel().getByRole("button", { name: "4+" }));
    expect(lastUrl()).toBe("/cho-thue?furnishing=full");
  });

  it("sắp xếp đổi ngay và đặt sort vào URL; về mặc định thì bỏ khỏi URL", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none));
    await chooseOption(user, panel().getByLabelText("Sắp xếp"), "Giá giảm dần");
    expect(lastUrl()).toBe("/cho-thue?sort=price_desc");
    await chooseOption(user, panel().getByLabelText("Sắp xếp"), "Mới nhất");
    expect(lastUrl()).toBe("/cho-thue");
  });

  it("/en: đường dẫn công khai /en/for-rent", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, options, "en"));
    await user.click(within(screen.getByRole("region", { name: "Rental filters" })).getByRole("button", { name: "2" }));
    expect(lastUrl()).toBe("/en/for-rent?bedrooms=2");
  });

  it("giá min > max được đảo lại trong URL (cùng bộ phân tích với server)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ priceMax: 3_000_000, sort: "newest", page: 1 }));
    await user.type(panel().getByLabelText("Giá từ"), "9000000");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?priceMin=3000000&priceMax=9000000");
  });
});

describe("RentalFilters: vào từ nút tìm kiếm của header", () => {
  it("focusSearch: con trỏ vào ô từ khoá; mặc định thì không", () => {
    const { unmount } = render(ui(none));
    expect(document.body).toHaveFocus();
    unmount();
    render(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <RentalListNavigationProvider actionPath="/cho-thue">
          <RentalFilters filters={none} options={options} focusSearch />
        </RentalListNavigationProvider>
      </NextIntlClientProvider>,
    );
    expect(document.activeElement?.tagName).toBe("INPUT");
    expect(document.activeElement).toHaveAttribute("type", "search");
  });
});

describe("RentalFilters: đồng bộ với URL", () => {
  it("URL đổi từ ngoài (bỏ chip, nút Xoá, back) thì ô lọc nạp lại", () => {
    const { rerender } = render(ui({ q: "studio", province: "ha-noi", sort: "newest", page: 1 }, withHanoiWards));
    expect(panel().getByLabelText("Từ khoá")).toHaveValue("studio");
    rerender(ui(none));
    expect(panel().getByLabelText("Từ khoá")).toHaveValue("");
    expect(panel().getByLabelText("Tỉnh/thành")).toHaveValue("");
  });

  it("URL đổi do chính lần gõ của người dùng thì KHÔNG nuốt chữ gõ thêm trong lúc chờ server", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(ui(none));
    const input = panel().getByLabelText("Từ khoá");
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

describe("RentalFilters: trang danh mục (danh mục khoá)", () => {
  it("không có ô Danh mục (options.categories rỗng); đổi ô khác đổi URL của trang danh mục, không thêm category", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, { ...options, categories: [] }, "vi", "can-ho", "/cho-thue/danh-muc/can-ho"));
    expect(panel().queryByLabelText("Danh mục")).toBeNull();
    await chooseOption(user, panel().getByLabelText("Tỉnh/thành"), "Hà Nội");
    expect(lastUrl()).toBe("/cho-thue/danh-muc/can-ho?province=ha-noi");
  });

  it("Sheet: số 'Xem n tin' đếm theo danh mục khoá dù bản nháp không có category", async () => {
    const fetchSpy = vi.fn<(url: string) => Promise<Response>>(async () => Response.json({ success: true, data: { total: 4 } }));
    vi.stubGlobal("fetch", fetchSpy);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui(none, { ...options, categories: [] }, "vi", "can-ho", "/cho-thue/danh-muc/can-ho"));
    await user.click(within(screen.getByRole("group", { name: "Bộ lọc tin cho thuê" })).getByRole("button", { name: "Bộ lọc" }));
    const dialog = await screen.findByRole("dialog", { name: "Bộ lọc tin cho thuê" });
    await within(dialog).findByRole("button", { name: "Xem 4 tin" });
    const url = new URL(String(fetchSpy.mock.calls.map((call) => call[0] as string).find((u) => u.startsWith("/api/public/rentals"))), "http://x");
    expect(url.searchParams.get("category")).toBe("can-ho");
    expect(within(dialog).queryByLabelText("Danh mục")).toBeNull();
  });
});

describe("RentalFilters: thanh dính + Sheet mobile", () => {
  const fetchMock = () => {
    const mock = vi.fn(async (url: string) => (url.startsWith("/api/wards") ? Response.json({ docs: [{ id: "w9", name: "Phường Bến Nghé", slug: "ben-nghe" }] }) : Response.json({ success: true, data: { total: 7 } })));
    vi.stubGlobal("fetch", mock);
    return mock;
  };
  const bar = () => within(screen.getByRole("group", { name: "Bộ lọc tin cho thuê" }));

  it("thanh dính có từ khoá + nút 'Bộ lọc (n)' đếm điều kiện + Sắp xếp; từ khoá debounce", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ province: "ha-noi", priceMin: 1, bedrooms: 2, sort: "newest", page: 1 }, withHanoiWards));
    expect(bar().getByRole("button", { name: "Bộ lọc (3)" })).toBeInTheDocument();
    await user.type(bar().getByLabelText("Từ khoá"), "q");
    act(() => vi.advanceTimersByTime(300));
    expect(lastUrl()).toBe("/cho-thue?q=q&province=ha-noi&priceMin=1&bedrooms=2");
    await chooseOption(user, bar().getByLabelText("Sắp xếp"), "Giá tăng dần");
    expect(lastUrl()).toContain("sort=price_asc");
  });

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

  it("Sheet giữ sắp xếp đang chọn khi áp dụng; 'Xoá' dọn bản nháp; đổi tỉnh trong Sheet tải phường qua REST", async () => {
    const fetchSpy = fetchMock();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(ui({ q: "cũ", sort: "price_asc", page: 1 }));
    await user.click(bar().getByRole("button", { name: "Bộ lọc (1)" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Từ khoá")).toHaveValue("cũ");
    await user.click(within(dialog).getByRole("button", { name: "Xoá" }));
    expect(within(dialog).getByLabelText("Từ khoá")).toHaveValue("");

    expect(within(dialog).getByLabelText("Phường/xã")).toBeDisabled();
    await chooseOption(user, within(dialog).getByLabelText("Tỉnh/thành"), "Hồ Chí Minh");
    await waitFor(() => expect(within(dialog).getByLabelText("Phường/xã")).toBeEnabled());
    const wardsCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith("/api/wards"))!;
    expect(decodeURIComponent(wardsCall)).toContain("where[province][equals]=p2");
    await chooseOption(user, within(dialog).getByLabelText("Phường/xã"), "Phường Bến Nghé");

    await user.click(within(dialog).getByRole("button", { name: /^Xem/ }));
    expect(replace).toHaveBeenLastCalledWith("/cho-thue?province=ho-chi-minh&ward=ben-nghe&sort=price_asc", { scroll: false });
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
