import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TocHeading } from "@/lib/content/section-headings";
import { NewsTocDisclosure, NewsTocSidebar } from "./NewsToc";

const headings: TocHeading[] = [
  { id: "mot", text: "Phần một", level: 2 },
  { id: "con", text: "Mục con", level: 3 },
  { id: "hai", text: "Phần hai", level: 2 },
];

/** Đặt `top` (tính từ đỉnh viewport) của từng heading để mô phỏng vị trí cuộn. */
function setTops(tops: Record<string, number>) {
  for (const [id, top] of Object.entries(tops)) {
    const target = document.getElementById(id);
    if (!target) throw new Error(`Thiếu heading ${id}`);
    target.getBoundingClientRect = () => ({ top }) as DOMRect;
    target.scrollIntoView = vi.fn();
  }
}

function renderWithTargets(ui: ReactElement) {
  return render(
    <>
      {ui}
      {headings.map((heading) => (
        <h2 key={heading.id} id={heading.id} tabIndex={-1}>
          {heading.text}
        </h2>
      ))}
    </>,
  );
}

let frames: FrameRequestCallback[] = [];

function scrollTo(tops: Record<string, number>) {
  setTops(tops);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    const pending = frames;
    frames = [];
    for (const callback of pending) callback(0);
  });
}

function activeLabels() {
  return screen
    .queryAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "location")
    .map((link) => link.textContent?.replace(/^[0-9]{2}/, ""));
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("NewsTocSidebar (BL-054: cột trái ≥ lg, khôi phục bản dính BL-033)", () => {
  it("nav có nhãn, link #id thật, heading cấp 3 thụt vào", () => {
    renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    expect(screen.getByRole("navigation", { name: "Mục lục" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phần một" })).toHaveAttribute("href", "#mot");
    expect(screen.getByRole("link", { name: "Mục con" }).className).toContain("pl-16");
  });

  it("BL-062: thẻ trắng viền mảnh; số tròn 01 / 02 cho heading cấp 2 (trang trí aria-hidden, đếm không tính cấp 3); cấp 3 không số; tên truy cập không có số", () => {
    const { container } = renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    const nav = container.querySelector("nav") as HTMLElement;
    expect(nav.className).toContain("rounded-xl");
    expect(nav.className).toContain("border");
    expect(nav.className).toContain("overflow-y-auto");
    const badges = [...nav.querySelectorAll("a > span[aria-hidden='true']")].map((badge) => badge.textContent);
    expect(badges).toEqual(["01", "02"]);
    expect(screen.getByRole("link", { name: "Mục con" }).querySelector("span")).toBeNull();
    expect(screen.getByRole("link", { name: "Phần hai" })).toHaveTextContent("02Phần hai");
  });

  it("active = heading cuối cùng đã qua vạch; trên heading đầu thì không active; qua heading cuối giữ mục cuối", () => {
    renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    scrollTo({ mot: 300, con: 700, hai: 1100 });
    expect(activeLabels()).toEqual([]);
    scrollTo({ mot: 20, con: 420, hai: 820 });
    expect(activeLabels()).toEqual(["Phần một"]);
    scrollTo({ mot: -400, con: 10, hai: 400 });
    expect(activeLabels()).toEqual(["Mục con"]);
    scrollTo({ mot: -1400, con: -1000, hai: -600 });
    expect(activeLabels()).toEqual(["Phần hai"]);
  });

  it("bấm mục: cuộn mượt tới heading, focus heading, đặt hash, active ngay; khoá cuộn ~1s rồi theo cuộn lại", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    setTops({ mot: 300, con: 700, hai: 1100 });
    fireEvent.click(screen.getByRole("link", { name: "Phần hai" }));
    const target = document.getElementById("hai") as HTMLElement;
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(target);
    expect(window.location.hash).toBe("#hai");
    expect(activeLabels()).toEqual(["Phần hai"]);
    scrollTo({ mot: 20, con: 420, hai: 820 });
    expect(activeLabels()).toEqual(["Phần hai"]);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    scrollTo({ mot: 20, con: 420, hai: 820 });
    expect(activeLabels()).toEqual(["Phần một"]);
  });

  it("giảm chuyển động: cuộn tức thì (behavior auto)", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    setTops({ mot: 300, con: 700, hai: 1100 });
    fireEvent.click(screen.getByRole("link", { name: "Phần một" }));
    expect((document.getElementById("mot") as HTMLElement).scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("mục active tự cuộn trong khung mục lục (nav.scrollTop), không cuộn trang", () => {
    const { container } = renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    const nav = container.querySelector("nav") as HTMLElement;
    Object.defineProperty(nav, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(nav, "clientHeight", { value: 200, configurable: true });
    let scrollTop = 0;
    Object.defineProperty(nav, "scrollTop", { get: () => scrollTop, set: (value: number) => (scrollTop = value), configurable: true });
    const link = screen.getByRole("link", { name: "Phần hai" });
    Object.defineProperty(link, "offsetTop", { value: 600, configurable: true });
    Object.defineProperty(link, "offsetHeight", { value: 44, configurable: true });
    const pageScroll = vi.fn();
    window.scrollTo = pageScroll;
    scrollTo({ mot: 300, con: 700, hai: 1100 });
    scrollTo({ mot: -1400, con: -1000, hai: -600 });
    expect(scrollTop).toBe(600 - (200 - 44) / 2);
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("dọn listener khi unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("ẩn dưới lg và khi in; vạch trái tô màu nhấn + đậm ở mục đang đọc", () => {
    const { container } = renderWithTargets(<NewsTocSidebar headings={headings} label="Mục lục" />);
    const nav = container.querySelector("nav") as HTMLElement;
    expect(nav.className).toContain("hidden");
    expect(nav.className).toContain("lg:block");
    expect(nav.className).toContain("print:hidden");
    scrollTo({ mot: 20, con: 420, hai: 820 });
    expect(screen.getByRole("link", { name: "Phần một" }).className).toContain("border-primary-deep");
    expect(screen.getByRole("link", { name: "Phần hai" }).className).toContain("border-transparent");
    // Số của mục active: nền vàng (primary), mục khác nền kem + vòng viền vàng nhạt.
    expect(screen.getByRole("link", { name: "Phần một" }).querySelector("span")?.className).toContain("bg-primary");
    expect(screen.getByRole("link", { name: "Phần hai" }).querySelector("span")?.className).toContain("ring-primary-soft");
  });
});

describe("NewsTocDisclosure (< lg: khối gập đầu bài)", () => {
  it("<details> đóng mặc định, có summary, nav có nhãn, link #id thật, heading cấp 3 thụt vào; ẩn từ lg", () => {
    const { container } = renderWithTargets(<NewsTocDisclosure headings={headings} label="Mục lục" />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.className).toContain("lg:hidden");
    expect(details.querySelector("summary")?.textContent).toBe("Mục lục");
    expect(screen.getByRole("navigation", { name: "Mục lục" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Phần một" })).toHaveAttribute("href", "#mot");
    expect(screen.getByRole("link", { name: "Mục con" }).className).toContain("pl-6");
  });

  it("bấm mục: gập lại, cuộn mượt tới heading, focus heading, đặt hash", () => {
    const { container } = renderWithTargets(<NewsTocDisclosure headings={headings} label="Mục lục" />);
    const target = document.getElementById("hai") as HTMLElement;
    target.scrollIntoView = vi.fn();
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    fireEvent.click(screen.getByRole("link", { name: "Phần hai" }));
    expect(details.open).toBe(false);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(target);
    expect(window.location.hash).toBe("#hai");
  });
});
