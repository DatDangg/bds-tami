import { act, fireEvent, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import vi_messages from "@/i18n/messages/vi.json";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ChipChoice } from "./FilterFacets";
import { RANGE_COMMIT_DELAY_MS, RangeSliderFacet } from "./RangeSliderFacet";
import { useListingFilterNav } from "./use-listing-filter-nav";

/**
 * P1-T02 review r3 n1–n3 (sửa ở P1-T05): `reset` tăng `generation` → trang dùng làm `key` nội dung bộ lọc (huỷ hẹn giờ thanh trượt, bỏ giá trị lạc quan);
 * thả chuột / ngón tay trên thanh trượt commit ngay (không hẹn giờ).
 */

const formatTy = (value: number) => (value >= 50 ? "50+ tỷ" : `${value} tỷ`);
const STATUS = [
  { value: "", label: "Tất cả" },
  { value: "selling", label: "Đang mở bán" },
];

afterEach(() => {
  push.mockReset();
  vi.useRealTimers();
});

/** Trang mẫu: gọi hook MỘT lần, `generation` làm `key` của nội dung bộ lọc, link "Xoá tất cả" gọi `reset`. */
function Page({ current }: { current: Record<string, string> }) {
  const { navigate, reset, generation } = useListingFilterNav("/du-an", current);
  return (
    <>
      <div key={generation}>
        <ChipChoice name="status" options={STATUS} value={current.status ?? ""} onChange={(status) => navigate({ status })} />
        <RangeSliderFacet
          names={["priceMin", "priceMax"]}
          min={0}
          max={50}
          step={1}
          value={[null, null]}
          formatValue={formatTy}
          onCommit={([low, high]) => navigate({ priceMin: low === null ? null : String(low), priceMax: high === null ? null : String(high) })}
        />
      </div>
      <button type="button" onClick={reset}>
        Xoá tất cả
      </button>
    </>
  );
}

describe("generation / reset (n1, n3)", () => {
  it("n1: 'Xoá tất cả' trong lúc thanh trượt (bàn phím) đang chờ commit → hẹn giờ bị huỷ, không điều hướng lại lọc cũ", () => {
    vi.useFakeTimers();
    renderWithIntl(<Page current={{ province: "ha-noi" }} />);
    const [low] = screen.getAllByRole("slider");
    act(() => low!.focus());
    fireEvent.keyDown(low!, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: "Xoá tất cả" }));
    act(() => vi.advanceTimersByTime(RANGE_COMMIT_DELAY_MS * 2));
    expect(push).not.toHaveBeenCalled();
    // Nội dung dựng lại từ URL: đầu kéo về mép.
    expect(screen.getAllByRole("slider")[0]).toHaveAttribute("aria-valuenow", "0");
  });

  it("n3: chọn chip (đang chờ URL) rồi 'Xoá tất cả' về đúng URL hiện tại → chip theo URL (Tất cả), không giữ giá trị lạc quan", () => {
    const { rerender } = renderWithIntl(<Page current={{}} />);
    fireEvent.click(screen.getByRole("radio", { name: "Đang mở bán" }));
    expect(screen.getByRole("radio", { name: "Đang mở bán" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Xoá tất cả" }));
    // URL không đổi (Next bỏ lượt điều hướng trước): `current` vẫn rỗng.
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        <Page current={{}} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("radio", { name: "Tất cả" })).toBeChecked();
  });
});

describe("thanh trượt: thả con trỏ commit ngay (n2)", () => {
  const rect = { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20, toJSON: () => ({}) };
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
    Object.assign(HTMLElement.prototype, { setPointerCapture: () => {}, releasePointerCapture: () => {}, hasPointerCapture: () => true });
  });
  afterEach(() => vi.restoreAllMocks());

  it("kéo + thả → điều hướng ngay, không đợi hẹn giờ; bàn phím vẫn hẹn giờ", () => {
    vi.useFakeTimers();
    renderWithIntl(<Page current={{}} />);
    const root = document.querySelector<HTMLElement>("[data-slot=slider]")!;
    fireEvent.pointerDown(root, { pointerId: 1, button: 0, clientX: 20, clientY: 10 });
    fireEvent.pointerUp(root, { pointerId: 1, button: 0, clientX: 20, clientY: 10 });
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenLastCalledWith("/du-an?priceMin=10", { scroll: false });

    const [low] = screen.getAllByRole("slider");
    act(() => low!.focus());
    fireEvent.keyDown(low!, { key: "ArrowRight" });
    expect(push).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(RANGE_COMMIT_DELAY_MS));
    expect(push).toHaveBeenCalledTimes(2);
    expect(push).toHaveBeenLastCalledWith("/du-an?priceMin=11", { scroll: false });
  });
});
