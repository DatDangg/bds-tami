import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { HeroSlideView } from "@/lib/home/home-view";
import { HeroSlider, SLIDE_INTERVAL_MS } from "./HeroSlider";

const slide = (n: number, overrides: Partial<HeroSlideView> = {}): HeroSlideView => ({
  id: `s${n}`,
  image: fakeMedia(`hero-${n}`),
  videoUrl: null,
  title: `Tiêu đề ${n}`,
  titleAccent: "",
  subtitle: `Phụ đề ${n}`,
  ctaLabel: `Nút ${n}`,
  ctaHref: `/du-an?s=${n}`,
  ...overrides,
});

/** Giả lập `matchMedia`: chỉ các query trong `matches` trả `true`. */
function stubMedia(matches: string[]) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({ matches: matches.includes(query), addEventListener: () => undefined, removeEventListener: () => undefined }),
  );
}

/** Chỉ slide đang hiện (không `inert`) mới thấy được với người dùng. */
const activeTitle = () => {
  const groups = screen.getAllByRole("group", { hidden: true }).filter((el) => el.getAttribute("aria-roledescription") === "slide" && !el.hasAttribute("inert"));
  expect(groups).toHaveLength(1);
  return groups[0]?.textContent ?? "";
};

beforeEach(() => {
  vi.useFakeTimers();
  stubMedia([]);
  // jsdom chưa cài đặt phát/dừng media.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("HeroSlider", () => {
  it("region carousel có nhãn; tiêu đề slide đều là p (h1 của trang nằm ngoài carousel); chỉ slide hiện tại thao tác được", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    expect(screen.getByRole("region", { name: "Nổi bật" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.queryAllByRole("heading", { hidden: true })).toHaveLength(0);
    expect(screen.getByText("Tiêu đề 1").tagName).toBe("P");
    expect(screen.getByText("Tiêu đề 2").tagName).toBe("P");
    expect(screen.getByRole("link", { name: "Nút 1" })).toHaveAttribute("href", "/du-an?s=1");
    expect(screen.queryByRole("link", { name: "Nút 2" })).toBeNull(); // slide 2 `inert` → ẩn khỏi cây truy cập
  });

  it("ảnh slide 1 là ảnh LCP (preload/high); ảnh slide 2 chưa tải cho tới khi trang xong", () => {
    const { container } = renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    tick(2000);
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.querySelectorAll("img")[1]).toHaveAttribute("loading", "lazy");
  });

  it("autoplay đổi slide sau mỗi chu kỳ", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    expect(activeTitle()).toContain("Tiêu đề 1");
    tick(SLIDE_INTERVAL_MS);
    expect(activeTitle()).toContain("Tiêu đề 2");
    tick(SLIDE_INTERVAL_MS);
    expect(activeTitle()).toContain("Tiêu đề 1");
  });

  it("dừng autoplay khi focus vào carousel, chạy lại khi focus ra ngoài", () => {
    renderWithIntl(
      <>
        <button type="button">Ngoài</button>
        <HeroSlider slides={[slide(1), slide(2)]} />
      </>,
    );
    const next = screen.getByRole("button", { name: "Chuyển tới slide 2" });
    act(() => next.focus());
    tick(SLIDE_INTERVAL_MS * 3);
    expect(activeTitle()).toContain("Tiêu đề 1");
    fireEvent.blur(next, { relatedTarget: screen.getByRole("button", { name: "Ngoài" }) });
    tick(SLIDE_INTERVAL_MS);
    expect(activeTitle()).toContain("Tiêu đề 2");
  });

  it("dừng autoplay khi rê chuột vào", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    const region = screen.getByRole("region", { name: "Nổi bật" });
    fireEvent.mouseEnter(region);
    tick(SLIDE_INTERVAL_MS * 2);
    expect(activeTitle()).toContain("Tiêu đề 1");
    fireEvent.mouseLeave(region);
    tick(SLIDE_INTERVAL_MS);
    expect(activeTitle()).toContain("Tiêu đề 2");
  });

  it("nút Dừng/Phát: dừng hẳn tới khi bấm Phát; vùng live đổi sang polite khi không tự chạy", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    const live = () => document.querySelector("[aria-live]");
    expect(live()).toHaveAttribute("aria-live", "off");
    fireEvent.click(screen.getByRole("button", { name: "Dừng trình chiếu" }));
    expect(live()).toHaveAttribute("aria-live", "polite");
    tick(SLIDE_INTERVAL_MS * 3);
    expect(activeTitle()).toContain("Tiêu đề 1");
    fireEvent.click(screen.getByRole("button", { name: "Phát trình chiếu" }));
    tick(SLIDE_INTERVAL_MS);
    expect(activeTitle()).toContain("Tiêu đề 2");
  });

  it("phím mũi tên chuyển slide; chấm phân trang đánh dấu slide hiện tại", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2), slide(3)]} />);
    const control = screen.getByRole("button", { name: "Chuyển tới slide 1" });
    fireEvent.keyDown(control, { key: "ArrowRight" });
    expect(activeTitle()).toContain("Tiêu đề 2");
    fireEvent.keyDown(control, { key: "ArrowLeft" });
    fireEvent.keyDown(control, { key: "ArrowLeft" });
    expect(activeTitle()).toContain("Tiêu đề 3");
    expect(screen.getByRole("button", { name: "Chuyển tới slide 3" })).toHaveAttribute("aria-current", "true");
  });

  it("phím mũi tên khi focus ở CTA trong slide KHÔNG đổi slide (không làm slide đang focus bị inert, focus không rơi về body)", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    const cta = screen.getByRole("link", { name: "Nút 1" });
    act(() => cta.focus());
    fireEvent.keyDown(cta, { key: "ArrowRight" });
    expect(activeTitle()).toContain("Tiêu đề 1");
    expect(document.activeElement).toBe(cta);
  });

  it("vuốt: chỉ đổi slide khi chuyển động ngang trội hơn; cuộn dọc/chéo bị bỏ qua", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2), slide(3)]} />);
    const region = screen.getByRole("region", { name: "Nổi bật" });
    const swipe = (from: [number, number], to: [number, number]) => {
      fireEvent.touchStart(region, { touches: [{ clientX: from[0], clientY: from[1] }] });
      fireEvent.touchEnd(region, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
    };
    swipe([200, 300], [100, 450]); // chéo, dọc trội hơn
    expect(activeTitle()).toContain("Tiêu đề 1");
    swipe([200, 300], [200, 100]); // dọc
    expect(activeTitle()).toContain("Tiêu đề 1");
    swipe([200, 300], [100, 310]); // ngang sang trái → slide kế
    expect(activeTitle()).toContain("Tiêu đề 2");
    swipe([100, 300], [200, 290]); // ngang sang phải → slide trước
    expect(activeTitle()).toContain("Tiêu đề 1");
  });

  it("nút Dừng/Phát đứng trước các chấm trong thứ tự tab", () => {
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    const labels = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
    expect(labels.slice(0, 3)).toEqual(["Dừng trình chiếu", "Chuyển tới slide 1", "Chuyển tới slide 2"]);
  });

  it("8 slide: Dừng/Phát, bộ đếm và thanh tiến trình cùng một cụm góc dưới trái; mỗi đoạn co giãn (flex-1) trong bề rộng cố định nên không tràn ở 390px", () => {
    renderWithIntl(<HeroSlider slides={Array.from({ length: 8 }, (_, n) => slide(n + 1))} />);
    const pause = screen.getByRole("button", { name: "Dừng trình chiếu" });
    const bar = screen.getByRole("group", { name: "Chọn slide" });
    expect(pause.parentElement).toBe(bar.parentElement);
    expect(pause.className).not.toContain("absolute");
    expect(pause.className).toContain("size-11");
    expect(within(bar).getAllByRole("button")).toHaveLength(8);
    // Vùng chạm ≥ 44px (M3 round 1): mỗi đoạn `min-w-11 h-11`, nhóm có minWidth = số đoạn × 2.75rem; vạch vẽ vẫn mảnh.
    for (const segment of within(bar).getAllByRole("button")) {
      expect(segment.className).toContain("min-w-11");
      expect(segment.className).toContain("h-11");
    }
    expect(bar.style.minWidth).toBe("22rem");
  });

  it("BL-044: bộ đếm `01 / 03` (aria-hidden, đổi theo slide) + thanh tiến trình = số slide, đoạn đang xem vàng; eyebrow/caption chung mọi slide; chữ canh trái; không còn chấm tròn", () => {
    renderWithIntl(<HeroSlider slides={[slide(1, { titleAccent: "sẵn sàng vào ở" }), slide(2), slide(3)]} eyebrow="TAMI HOMES" caption="Không gian sống đẳng cấp" />);
    const counter = document.querySelector("[aria-hidden='true'].tabular-nums") as HTMLElement;
    expect(counter).toHaveTextContent("01 / 03");
    const bar = screen.getByRole("group", { name: "Chọn slide" });
    const segments = within(bar).getAllByRole("button");
    expect(segments).toHaveLength(3);
    expect(segments[0]?.querySelector("span")?.className).toContain("bg-primary");
    expect(segments[1]?.querySelector("span")?.className).not.toContain("bg-primary");
    expect(bar.querySelector(".rounded-full")?.className).toContain("h-0.5");
    expect(screen.getByRole("link", { name: "Nút 1" }).querySelector("svg")).not.toBeNull();
    fireEvent.click(segments[2] as HTMLElement);
    expect(counter).toHaveTextContent("03 / 03");
    expect(segments[2]).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("sẵn sàng vào ở").className).toContain("text-primary");
    expect(screen.getAllByText("TAMI HOMES")).toHaveLength(3);
    expect(screen.getByText("Không gian sống đẳng cấp").className).toContain("line-clamp-2");
    expect(screen.getByText("Tiêu đề 1").parentElement?.className).toMatch(/items-start.*text-left/);
  });

  it("1 slide: ẩn bộ đếm và thanh tiến trình; mũi tên Trước/Sau là nút tròn viền khi có ≥ 2 slide", () => {
    renderWithIntl(<HeroSlider slides={[slide(1)]} />);
    expect(document.querySelector("[aria-hidden='true'].tabular-nums")).toBeNull();
    expect(screen.queryByRole("group", { name: "Chọn slide" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Slide sau" })).toBeNull();
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    expect(screen.getByRole("button", { name: "Slide sau" }).className).toContain("border-on-dark/40");
  });

  it("prefers-reduced-motion: không autoplay, không hiện nút Dừng", () => {
    stubMedia(["(prefers-reduced-motion: reduce)"]);
    renderWithIntl(<HeroSlider slides={[slide(1), slide(2)]} />);
    tick(SLIDE_INTERVAL_MS * 3);
    expect(activeTitle()).toContain("Tiêu đề 1");
    expect(screen.queryByRole("button", { name: "Dừng trình chiếu" })).toBeNull();
  });

  it("1 slide không video: không chấm, không nút điều khiển, không autoplay", () => {
    renderWithIntl(<HeroSlider slides={[slide(1)]} />);
    expect(screen.queryAllByRole("button").filter((button) => button.getAttribute("aria-label") !== "Cuộn xuống nội dung")).toHaveLength(0);
    tick(SLIDE_INTERVAL_MS * 2);
    expect(activeTitle()).toContain("Tiêu đề 1");
  });

  it("1 slide CÓ video tự chạy: vẫn có nút Dừng/Phát (WCAG 2.2.2), không có chấm; bấm Dừng → video.pause()", () => {
    stubMedia(["(min-width: 1024px)"]);
    const { container } = renderWithIntl(<HeroSlider slides={[slide(1, { videoUrl: "/api/media/file/v.mp4" })]} />);
    expect(container.querySelector("video")).not.toBeNull();
    expect(screen.queryByRole("group", { name: "Chọn slide" })).toBeNull();
    const pauseSpy = vi.mocked(HTMLMediaElement.prototype.pause);
    pauseSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Dừng trình chiếu" }));
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Phát trình chiếu" })).toBeInTheDocument();
  });

  it("1 slide video nhưng mobile (video không dựng): không cần nút Dừng", () => {
    renderWithIntl(<HeroSlider slides={[slide(1, { videoUrl: "/api/media/file/v.mp4" })]} />);
    expect(screen.queryAllByRole("button").filter((button) => button.getAttribute("aria-label") !== "Cuộn xuống nội dung")).toHaveLength(0);
  });

  it("video chỉ dựng khi ≥ 1024px, không reduced-motion, không Save-Data", () => {
    const withVideo = [slide(1, { videoUrl: "/api/media/file/v.mp4" }), slide(2)];
    const hasVideo = (container: HTMLElement) => container.querySelector("video") !== null;

    expect(hasVideo(renderWithIntl(<HeroSlider slides={withVideo} />).container)).toBe(false); // mobile

    stubMedia(["(min-width: 1024px)"]);
    const desktop = renderWithIntl(<HeroSlider slides={withVideo} />);
    expect(desktop.container.querySelector("video")).toHaveAttribute("src", "/api/media/file/v.mp4");
    desktop.unmount();

    stubMedia(["(min-width: 1024px)", "(prefers-reduced-motion: reduce)"]);
    const reduced = renderWithIntl(<HeroSlider slides={withVideo} />);
    expect(hasVideo(reduced.container)).toBe(false);
    reduced.unmount();

    stubMedia(["(min-width: 1024px)"]);
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    try {
      expect(hasVideo(renderWithIntl(<HeroSlider slides={withVideo} />).container)).toBe(false);
    } finally {
      Reflect.deleteProperty(navigator, "connection");
    }
  });

  it("nút cuộn xuống có tên; cuộn mượt tới đáy hero, reduced-motion thì nhảy ngay", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const smooth = renderWithIntl(<HeroSlider slides={[slide(1)]} />);
    fireEvent.click(screen.getByRole("button", { name: "Cuộn xuống nội dung" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "smooth" }));
    smooth.unmount();

    stubMedia(["(prefers-reduced-motion: reduce)"]);
    renderWithIntl(<HeroSlider slides={[slide(1)]} />);
    fireEvent.click(screen.getByRole("button", { name: "Cuộn xuống nội dung" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("nút cuộn xuống: có ô tìm kiếm ngay sau hero thì đưa đỉnh ô đó xuống dưới header; ảnh slide 1 vẫn là ảnh ưu tiên", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { container } = renderWithIntl(
      <>
        <HeroSlider slides={[slide(1), slide(2)]} overlapsSearch />
        <section data-hero-search="" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cuộn xuống nội dung" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(container.querySelector("img")).toHaveAttribute("fetchpriority", "high");
  });
});
