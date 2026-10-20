import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardSlider, type CardSliderLabels } from "./CardSlider";

const labels: CardSliderLabels = { slide: "Thẻ {index} / {total}", previous: "Trước", next: "Sau", dots: "Chọn thẻ", goTo: "Tới thẻ {index}" };

const originalScrollTo = Element.prototype.scrollTo;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Element.prototype.scrollTo = originalScrollTo;
});

const renderSlider = (count: number) =>
  render(
    <>
      <h2 id="h">Tiêu đề</h2>
      <CardSlider labelledBy="h" labels={labels} items={Array.from({ length: count }, (_, index) => <a key={index} href={`/x/${index}`}>Thẻ nội dung {index + 1}</a>)} />
    </>,
  );

/** Giả lập layout: 6 thẻ 272px gap 24px, vùng nhìn 1160px (4 thẻ) → cuộn tối đa 592px → chỉ 3 vị trí cuộn được (0, 296, 592). */
function mockLayout4Visible() {
  const proto = HTMLElement.prototype;
  vi.spyOn(proto, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.tagName === "UL" ? 1160 : 0;
  });
  vi.spyOn(proto, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.tagName === "UL" ? 1752 : 0;
  });
  vi.spyOn(proto, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const left = this.tagName === "LI" ? 296 * Number(this.dataset.index) : 0;
    return { left, right: left, top: 0, bottom: 0, width: 0, height: 0, x: left, y: 0, toJSON: () => ({}) };
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
}

describe("CardSlider", () => {
  it("vùng carousel có tên, vùng cuộn focus được, mỗi thẻ là slide có nhãn; không autoplay", () => {
    renderSlider(3);
    expect(screen.getByRole("region", { name: "Tiêu đề" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("list", { name: "Tiêu đề" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("group", { name: "Thẻ 2 / 3" })).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("BL-038: 6 thẻ, hiện 4 → 3 chấm (= số vị trí cuộn được); chấm theo scrollLeft; chấm/mũi tên cuộn tới offset thẻ", () => {
    mockLayout4Visible();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo as unknown as Element["scrollTo"];
    renderSlider(6);
    const list = screen.getByRole("list", { name: "Tiêu đề" });
    let scrollLeft = 0;
    Object.defineProperty(list, "scrollLeft", { get: () => scrollLeft, configurable: true });
    const dot = (n: number) => screen.getByRole("button", { name: `Tới thẻ ${n}` });

    expect(screen.getAllByRole("button", { name: /Tới thẻ/ })).toHaveLength(3);
    expect(dot(1)).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 296 }));

    scrollLeft = 592;
    act(() => {
      fireEvent.scroll(list);
    });
    expect(dot(3)).toHaveAttribute("aria-current", "true");
    fireEvent.click(dot(2));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 296 }));
  });

  it("một thẻ: không mũi tên, không chấm", () => {
    renderSlider(1);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
