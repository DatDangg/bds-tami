import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseOption, renderWithIntl } from "@/components/media/test-utils";
import vi_messages from "@/i18n/messages/vi.json";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { CheckboxFacetList, ChipChoice, FilterGroup, SelectFacet } from "./FilterFacets";
import { RANGE_COMMIT_DELAY_MS, RangeSliderFacet } from "./RangeSliderFacet";
import { FilterSheet, FilterSidebar } from "./FilterPanel";
import { useListingFilterNav } from "./use-listing-filter-nav";

afterEach(() => push.mockReset());

/** HTML như server dựng (chưa hydrate = trình duyệt không JS). */
function serverHtml(ui: ReactElement): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToString(
    <NextIntlClientProvider locale="vi" messages={vi_messages}>
      {ui}
    </NextIntlClientProvider>,
  );
  return host;
}

const PROVINCES = [
  { value: "ha-noi", label: "Hà Nội", count: 8 },
  { value: "bac-ninh", label: "Bắc Ninh", count: 4 },
  { value: "hung-yen", label: "Hưng Yên", count: 0 },
  { value: "da-nang", label: "Đà Nẵng", count: 2 },
];
const STATUS = [
  { value: "", label: "Tất cả" },
  { value: "selling", label: "Đang mở bán" },
  { value: "upcoming", label: "Sắp mở bán" },
];
const formatTy = (value: number) => (value >= 50 ? "50+ tỷ" : `${value} tỷ`);

describe("FilterGroup + ChipChoice", () => {
  it("fieldset có legend; chip là radio gốc (một lựa chọn, bàn phím sẵn), đổi → onChange + chọn ngay", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <FilterGroup title="Tình trạng">
        <ChipChoice name="status" options={STATUS} value="" onChange={onChange} />
      </FilterGroup>,
    );
    const group = screen.getByRole("group", { name: "Tình trạng" });
    expect(within(group).getByRole("radio", { name: "Tất cả" })).toBeChecked();
    await user.click(within(group).getByRole("radio", { name: "Sắp mở bán" }));
    expect(onChange).toHaveBeenCalledWith("upcoming");
    expect(within(group).getByRole("radio", { name: "Sắp mở bán" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "Sắp mở bán" })).toHaveAttribute("name", "status");
  });

  it("giá trị trên URL đổi từ ngoài (back / Xoá tất cả) → chip theo URL", () => {
    const { rerender } = renderWithIntl(<ChipChoice name="status" options={STATUS} value="selling" />);
    expect(screen.getByRole("radio", { name: "Đang mở bán" })).toBeChecked();
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        <ChipChoice name="status" options={STATUS} value="" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("radio", { name: "Tất cả" })).toBeChecked();
  });
});

describe("CheckboxFacetList", () => {
  it("ô tích gốc có name + số đếm; mục đếm 0 mờ nhưng vẫn hiện; tích → danh sách theo thứ tự danh sách", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(<CheckboxFacetList name="province" label="Tỉnh / thành" options={PROVINCES} value={["da-nang"]} onChange={onChange} />);
    const list = screen.getByRole("list", { name: "Tỉnh / thành" });
    expect(within(list).getAllByRole("checkbox")).toHaveLength(4);
    expect(within(list).getByRole("checkbox", { name: /Hà Nội/ })).toHaveAttribute("name", "province");
    expect(within(list).getByText("(8)")).toBeInTheDocument();
    expect(within(list).getByRole("checkbox", { name: /Hưng Yên/ }).closest("li")).toHaveAttribute("data-empty", "true");
    await user.click(within(list).getByRole("checkbox", { name: /Hà Nội/ }));
    expect(onChange).toHaveBeenLastCalledWith(["ha-noi", "da-nang"]);
    await user.click(within(list).getByRole("checkbox", { name: /Đà Nẵng/ }));
    expect(onChange).toHaveBeenLastCalledWith(["ha-noi"]);
  });

  it("chỉ N mục đầu + 'Xem thêm' (aria-expanded); ô tìm khớp không dấu; không khớp → thông báo", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CheckboxFacetList name="province" label="Tỉnh / thành" options={PROVINCES} value={[]} initialVisible={2} searchPlaceholder="Tìm tỉnh / thành" />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    const more = screen.getByRole("button", { name: "Xem thêm" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await user.click(more);
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Thu gọn" })).toHaveAttribute("aria-expanded", "true");
    const search = screen.getByRole("searchbox", { name: "Tìm trong danh sách Tỉnh / thành" });
    await user.type(search, "da nang");
    expect(screen.getAllByRole("checkbox").map((box) => (box as HTMLInputElement).value)).toEqual(["da-nang"]);
    // Enter trong ô tìm không gửi form bao ngoài.
    const submitted = fireEvent.keyDown(search, { key: "Enter" });
    expect(submitted).toBe(false);
    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.getByText("Không có mục phù hợp")).toBeInTheDocument();
  });

  it("mục đang chọn nằm sau N → mở sẵn danh sách", () => {
    renderWithIntl(<CheckboxFacetList name="province" label="Tỉnh" options={PROVINCES} value={["da-nang"]} initialVisible={2} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("không JS: hiện hết mục, không ô tìm, không nút 'Xem thêm'", () => {
    const html = serverHtml(<CheckboxFacetList name="province" label="Tỉnh" options={PROVINCES} value={[]} initialVisible={2} searchPlaceholder="Tìm" />);
    expect(html.querySelectorAll('input[type="checkbox"][name="province"]')).toHaveLength(4);
    expect(html.querySelector('input[type="search"]')).toBeNull();
    expect(html.querySelector("button")).toBeNull();
  });
});

describe("SelectFacet", () => {
  const options = [
    { value: "", label: "Tất cả chủ đầu tư" },
    { value: "7", label: "Vinhomes" },
  ];

  it("Select TAMI có nhãn; chọn → onChange; input ẩn mang name", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderWithIntl(<SelectFacet name="developer" label="Chủ đầu tư" options={options} value="" onChange={onChange} />);
    await chooseOption(user, screen.getByRole("combobox", { name: "Chủ đầu tư" }), "Vinhomes");
    expect(onChange).toHaveBeenCalledWith("7");
    expect(container.querySelector('input[type="hidden"][name="developer"]')).toHaveValue("7");
  });

  it("không JS: select gốc có name", () => {
    const html = serverHtml(<SelectFacet name="developer" label="Chủ đầu tư" options={options} value="7" />);
    expect(html.querySelector('select[name="developer"]')).not.toBeNull();
  });
});

describe("RangeSliderFacet", () => {
  afterEach(() => vi.useRealTimers());
  const settle = () => act(() => vi.advanceTimersByTime(RANGE_COMMIT_DELAY_MS));

  it("hai đầu kéo role=slider có tên + aria-valuetext; nhãn hai đầu; phím → commit (sau độ trễ), Home về mép = null", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { container } = renderWithIntl(<RangeSliderFacet names={["priceMin", "priceMax"]} min={0} max={50} step={1} value={[null, null]} formatValue={formatTy} onCommit={onCommit} />);
    const [low, high] = screen.getAllByRole("slider");
    expect(low).toHaveAccessibleName("Thấp nhất");
    expect(high).toHaveAccessibleName("Cao nhất");
    expect(low).toHaveAttribute("aria-valuetext", "0 tỷ");
    expect(high).toHaveAttribute("aria-valuetext", "50+ tỷ");
    expect(screen.getByText("0 tỷ")).toBeInTheDocument();
    expect(screen.getByText("50+ tỷ")).toBeInTheDocument();
    // Ở mép: input ẩn rỗng (không lên URL).
    expect(container.querySelector<HTMLInputElement>('input[name="priceMin"]')?.value).toBe("");
    fireEvent.keyDown(low!, { key: "ArrowRight" });
    expect(low).toHaveAttribute("aria-valuetext", "1 tỷ");
    expect(onCommit).not.toHaveBeenCalled();
    settle();
    expect(onCommit).toHaveBeenLastCalledWith([1, null]);
    expect(container.querySelector<HTMLInputElement>('input[name="priceMin"]')?.value).toBe("1");
    // Radix đổi đầu kéo theo đầu đang focus.
    act(() => high!.focus());
    fireEvent.keyDown(high!, { key: "ArrowLeft" });
    settle();
    expect(onCommit).toHaveBeenLastCalledWith([1, 49]);
    expect(high).toHaveAttribute("aria-valuetext", "49 tỷ");
    act(() => low!.focus());
    fireEvent.keyDown(low!, { key: "Home" });
    settle();
    expect(onCommit).toHaveBeenLastCalledWith([null, 49]);
  });

  it("giữ phím (nhiều bước liền) → chỉ một commit với giá trị cuối", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    renderWithIntl(<RangeSliderFacet names={["priceMin", "priceMax"]} min={0} max={50} step={1} value={[null, null]} formatValue={formatTy} onCommit={onCommit} />);
    const [low] = screen.getAllByRole("slider");
    act(() => low!.focus());
    for (let step = 0; step < 5; step++) {
      fireEvent.keyDown(low!, { key: "ArrowRight" });
      act(() => vi.advanceTimersByTime(100));
    }
    expect(onCommit).not.toHaveBeenCalled();
    settle();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith([5, null]);
  });

  it("giá trị từ URL đặt vị trí đầu kéo; giá trị ngoài khoảng bị kẹp; min > max bị sắp lại", () => {
    const { unmount } = renderWithIntl(<RangeSliderFacet names={["priceMin", "priceMax"]} min={0} max={50} step={1} value={[5, 80]} formatValue={formatTy} />);
    const [low, high] = screen.getAllByRole("slider");
    expect(low).toHaveAttribute("aria-valuenow", "5");
    expect(high).toHaveAttribute("aria-valuenow", "50");
    unmount();
    renderWithIntl(<RangeSliderFacet names={["priceMin", "priceMax"]} min={0} max={50} step={1} value={[30, 10]} formatValue={formatTy} />);
    const [swappedLow, swappedHigh] = screen.getAllByRole("slider");
    expect(swappedLow).toHaveAttribute("aria-valuenow", "10");
    expect(swappedHigh).toHaveAttribute("aria-valuenow", "30");
  });

  it("không JS: hai ô số Từ / Đến có name + giá trị URL", () => {
    const html = serverHtml(<RangeSliderFacet names={["priceMin", "priceMax"]} min={0} max={50} step={1} value={[5, null]} formatValue={formatTy} />);
    const inputs = html.querySelectorAll<HTMLInputElement>('input[type="number"]');
    expect([...inputs].map((input) => [input.name, input.value])).toEqual([
      ["priceMin", "5"],
      ["priceMax", ""],
    ]);
    expect(html.querySelector('[role="slider"]')).toBeNull();
  });

  it("không JS: giá trị lẻ bước / vượt mép từ link cũ vẫn hợp lệ (không chặn gửi form) — `step=any`, không `max`", () => {
    const html = serverHtml(<RangeSliderFacet names={["areaMin", "areaMax"]} min={0} max={300} step={5} value={[7, 420]} formatValue={String} />);
    const inputs = [...html.querySelectorAll<HTMLInputElement>('input[type="number"]')];
    expect(inputs.map((input) => input.value)).toEqual(["7", "420"]);
    for (const input of inputs) {
      expect(input.getAttribute("step")).toBe("any");
      expect(input.hasAttribute("max")).toBe(false);
      expect(input.validity.valid).toBe(true);
    }
  });
});

describe("FilterSidebar / FilterSheet", () => {
  const body = (
    <FilterGroup title="Tình trạng">
      <ChipChoice name="status" options={STATUS} value="" />
    </FilterGroup>
  );

  it("sidebar: vùng có tiêu đề 'Bộ lọc' + 'Xoá tất cả'; form GET + input ẩn; có JS thì không nút 'Áp dụng'", () => {
    const onClear = vi.fn();
    const { container } = renderWithIntl(
      <FilterSidebar action="/du-an" clearHref="/du-an?q=vin" onClear={onClear} preservedParams={{ q: "vin", sort: "" }}>
        {body}
      </FilterSidebar>,
    );
    const aside = screen.getByRole("complementary", { name: "Bộ lọc" });
    const clear = within(aside).getByRole("link", { name: "Xoá tất cả" });
    expect(clear).toHaveAttribute("href", "/du-an?q=vin");
    clear.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/du-an");
    expect([...container.querySelectorAll<HTMLInputElement>("input[type=hidden]")].map((input) => input.name)).toEqual(["q"]);
    expect(within(aside).queryByRole("button", { name: "Áp dụng" })).toBeNull();
    // Có JS: gợi ý "cập nhật ngay" gắn vào vùng (WCAG 3.2.2).
    expect(aside).toHaveAccessibleDescription("Chọn tiêu chí, danh sách cập nhật ngay.");
  });

  it("không JS < lg: nút 'Bộ lọc' là details/summary gốc mở form GET có 'Áp dụng' + input ẩn; không có Sheet", () => {
    const html = serverHtml(
      <FilterSheet action="/du-an" activeCount={2} preservedParams={{ q: "vin" }}>
        {body}
      </FilterSheet>,
    );
    const details = html.querySelector("details");
    const summary = details?.querySelector("summary");
    expect(summary?.querySelector("[data-testid=filters-count]")).toHaveAttribute("aria-hidden", "true");
    expect(summary?.querySelector(".sr-only")).toHaveTextContent("(2)");
    // Cùng chiều cao 44px với nút Sheet sau hydrate ở mọi cỡ < lg.
    expect(summary).toHaveClass("h-11");
    const form = details?.querySelector("form");
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/du-an");
    expect(form?.querySelector('input[type="hidden"][name="q"]')).toHaveValue("vin");
    expect(form?.querySelector('input[type="radio"][name="status"]')).not.toBeNull();
    expect(form?.querySelector('button[type="submit"]')).toHaveTextContent("Áp dụng");
    expect(html.querySelector('[aria-haspopup="dialog"]')).toBeNull();
  });

  it("không JS: sidebar có nút 'Áp dụng' gửi form", () => {
    const html = serverHtml(<FilterSidebar action="/du-an">{body}</FilterSidebar>);
    const button = html.querySelector('form button[type="submit"]');
    expect(button).toHaveTextContent("Áp dụng");
  });

  it("sheet: nút 'Bộ lọc (n)' + badge; mở → hộp thoại chứa cùng nội dung + 'Xem kết quả' đóng lại", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FilterSheet action="/du-an" activeCount={3} clearHref="/du-an">
        {body}
      </FilterSheet>,
    );
    const trigger = screen.getByRole("button", { name: "Bộ lọc (3)" });
    expect(trigger).toHaveClass("h-11", "md:h-11");
    expect(trigger).not.toHaveClass("md:h-10");
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Bộ lọc" });
    expect(within(dialog).getByRole("group", { name: "Tình trạng" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/du-an");
    await user.click(within(dialog).getByRole("button", { name: "Xem kết quả" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sheet không lọc nào → nút không badge", () => {
    renderWithIntl(
      <FilterSheet action="/du-an" activeCount={0}>
        {body}
      </FilterSheet>,
    );
    expect(screen.getByRole("button", { name: "Bộ lọc" })).toBeInTheDocument();
    expect(screen.queryByTestId("filters-count")).toBeNull();
  });
});

describe("useListingFilterNav", () => {
  function Harness() {
    const { navigate } = useListingFilterNav("/en/du-an", { q: "vin", page: "3", province: ["ha-noi", "bac-ninh"] });
    return <ChipChoice name="status" options={STATUS} value="" onChange={(status) => navigate({ status })} />;
  }

  it("đổi ô lọc → router.push URL mới (giữ tham số khác, bỏ page), không cuộn", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Đang mở bán" }));
    expect(push).toHaveBeenCalledWith("/en/du-an?q=vin&province=ha-noi,bac-ninh&status=selling", { scroll: false });
  });

  function TwoFacets({ current }: { current: Record<string, string> }) {
    const { navigate } = useListingFilterNav("/du-an", current);
    return (
      <>
        <button type="button" onClick={() => navigate({ status: "selling" })}>
          status
        </button>
        <button type="button" onClick={() => navigate({ province: ["ha-noi"] })}>
          province
        </button>
      </>
    );
  }

  it("đổi hai ô liên tiếp trước khi URL về (current chưa đổi) → lần sau giữ cả thay đổi trước", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TwoFacets current={{ q: "vin" }} />);
    await user.click(screen.getByRole("button", { name: "status" }));
    await user.click(screen.getByRole("button", { name: "province" }));
    expect(push).toHaveBeenNthCalledWith(1, "/du-an?q=vin&status=selling", { scroll: false });
    expect(push).toHaveBeenNthCalledWith(2, "/du-an?q=vin&status=selling&province=ha-noi", { scroll: false });
  });

  it("URL từ server đổi (back / Xoá tất cả) → bỏ thay đổi đang gom, dựng từ URL mới", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(<TwoFacets current={{ q: "vin" }} />);
    await user.click(screen.getByRole("button", { name: "status" }));
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        <TwoFacets current={{}} />
      </NextIntlClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "province" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?province=ha-noi", { scroll: false });
  });

  it("reset (link 'Xoá tất cả' về cùng URL) → bỏ thay đổi đang gom", () => {
    function WithReset() {
      const { navigate, reset } = useListingFilterNav("/du-an", {});
      return (
        <>
          <button type="button" onClick={() => navigate({ status: "selling" })}>
            status
          </button>
          <button type="button" onClick={reset}>
            clear
          </button>
          <button type="button" onClick={() => navigate({ province: ["ha-noi"] })}>
            province
          </button>
        </>
      );
    }
    renderWithIntl(<WithReset />);
    fireEvent.click(screen.getByRole("button", { name: "status" }));
    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    fireEvent.click(screen.getByRole("button", { name: "province" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?province=ha-noi", { scroll: false });
  });

  it("thanh trượt hẹn commit → URL đổi (lọc khác vừa về) trước khi hết giờ → push giữ cả lọc mới lẫn giá", () => {
    vi.useFakeTimers();
    function PriceFacet({ current }: { current: Record<string, string> }) {
      const { navigate } = useListingFilterNav("/du-an", current);
      return (
        <RangeSliderFacet
          names={["priceMin", "priceMax"]}
          min={0}
          max={50}
          step={1}
          value={[null, null]}
          formatValue={formatTy}
          onCommit={([low, high]) => navigate({ priceMin: low === null ? null : String(low), priceMax: high === null ? null : String(high) })}
        />
      );
    }
    try {
      const { rerender } = renderWithIntl(<PriceFacet current={{}} />);
      const [low] = screen.getAllByRole("slider");
      act(() => low!.focus());
      fireEvent.keyDown(low!, { key: "ArrowRight" });
      rerender(
        <NextIntlClientProvider locale="vi" messages={vi_messages}>
          <PriceFacet current={{ province: "ha-noi" }} />
        </NextIntlClientProvider>,
      );
      expect(push).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(RANGE_COMMIT_DELAY_MS));
      expect(push).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/du-an?province=ha-noi&priceMin=1", { scroll: false });
    } finally {
      vi.useRealTimers();
    }
  });

  it("trang truyền object mới mỗi lần render nhưng URL không đổi → vẫn giữ thay đổi đang gom", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(<TwoFacets current={{ q: "vin" }} />);
    await user.click(screen.getByRole("button", { name: "status" }));
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        <TwoFacets current={{ q: "vin" }} />
      </NextIntlClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "province" }));
    expect(push).toHaveBeenLastCalledWith("/du-an?q=vin&status=selling&province=ha-noi", { scroll: false });
  });
});
