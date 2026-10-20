import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { ProjectSlideView } from "@/lib/home/home-view";
import { ProjectsSlider } from "./ProjectsSlider";

const slide = (n: number): ProjectSlideView => ({
  id: `p${n}`,
  title: `Dự án ${n}`,
  href: `/du-an/du-an-${n}`,
  eyebrow: "Căn hộ",
  provinceName: "Hà Nội",
  summary: `Tóm tắt ${n}`,
  image: fakeMedia(`p${n}`),
  salesStatus: "selling",
  stats: { landAreaM2: null, totalUnits: null, handoverTime: null },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Giả lập layout 1280px: 6 thẻ 464px gap 24px, vùng nhìn 1265px, cuộn tối đa 1702px → 5 vị trí cuộn được. */
function mockLayout1280() {
  const proto = HTMLElement.prototype;
  vi.spyOn(proto, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.tagName === "UL" ? 1265 : 0;
  });
  vi.spyOn(proto, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.tagName === "UL" ? 2967 : 0;
  });
  vi.spyOn(proto, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const left = this.tagName === "LI" ? 31 + 488 * Number(this.dataset.index) : 0;
    return { left, right: left, top: 0, bottom: 0, width: 0, height: 0, x: left, y: 0, toJSON: () => ({}) };
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0; // chạy đồng bộ nên id 0 để cờ "đang chờ frame" không kẹt
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);

}

describe("ProjectsSlider", () => {
  it("BL-038: chấm = số vị trí cuộn được, chấm theo scrollLeft, mũi tên/chấm cuộn tới offset thẻ (vòng ở đầu/cuối)", () => {
    mockLayout1280();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo as unknown as Element["scrollTo"];
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[1, 2, 3, 4, 5, 6].map(slide)} labelledBy="h" />
      </>,
    );
    const list = screen.getByRole("list", { name: "Dự án nổi bật" });
    let scrollLeft = 0;
    Object.defineProperty(list, "scrollLeft", { get: () => scrollLeft, configurable: true });
    const scrollListTo = (left: number) => {
      scrollLeft = left;
      act(() => {
        fireEvent.scroll(list);
      });
    };
    const dot = (n: number) => screen.getByRole("button", { name: `Chuyển tới dự án ${n}` });

    expect(screen.getAllByRole("button", { name: /Chuyển tới dự án/ })).toHaveLength(5);
    expect(dot(1)).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "Dự án sau" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 488 }));
    scrollListTo(488);
    expect(dot(2)).toHaveAttribute("aria-current", "true");

    fireEvent.click(dot(3));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 976 }));

    scrollListTo(1702);
    expect(dot(5)).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Dự án sau" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));

    scrollListTo(0);
    fireEvent.click(screen.getByRole("button", { name: "Dự án trước" }));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 1702 }));
  });

  it("chưa có layout (clientWidth 0): chấm = số thẻ, nút Sau dùng scrollIntoView, không lỗi", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[slide(1), slide(2), slide(3)]} labelledBy="h" />
      </>,
    );
    expect(screen.getAllByRole("button", { name: /Chuyển tới dự án/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Chuyển tới dự án 1" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Dự án sau" }));
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole("group", { name: "Dự án 2 / 3" }));
  });

  it("không autoplay: slide không tự đổi; vùng cuộn có tabIndex để dùng bằng bàn phím", () => {
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[slide(1), slide(2)]} labelledBy="h" />
      </>,
    );
    expect(screen.getAllByRole("list")[0]).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("list", { name: "Dự án nổi bật" })).toHaveAttribute("tabindex", "0"); // vùng focus được phải có tên truy cập
    expect(screen.getByRole("button", { name: "Chuyển tới dự án 1" })).toHaveAttribute("aria-current", "true");
  });

  it("BL-037: tên dự án giữ chỗ 2 dòng (min-h-[2lh] + line-clamp-2)", () => {
    renderWithIntl(<><h2 id="h">Dự án nổi bật</h2><ProjectsSlider slides={[slide(1)]} labelledBy="h" /></>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("min-h-[2lh]", "line-clamp-2");
  });
});

describe("ProjectsSlider: thẻ trắng theo mockup BL-044", () => {
  const renderOne = (view: ProjectSlideView) =>
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[view]} labelledBy="h" />
      </>,
    );

  it("cả thẻ là MỘT link, tên truy cập = tên dự án; có tên, tỉnh, badge; không còn khung kính mờ / số liệu", () => {
    const { container } = renderOne({ ...slide(1), salesStatus: "upcoming", stats: { landAreaM2: 12000, totalUnits: 350, handoverTime: "Q4/2027" } });
    const link = screen.getByRole("link", { name: "Dự án 1" });
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(link).toHaveAttribute("href", "/du-an/du-an-1");
    expect(link).toHaveClass("bg-surface", "rounded-xl", "border-border");
    expect(within(link).getByRole("heading", { level: 3, name: "Dự án 1" })).toBeInTheDocument();
    expect(within(link).getByText("Hà Nội")).toBeInTheDocument();
    expect(within(link).getByText("Sắp mở bán")).toHaveAttribute("data-variant", "primary");
    expect(container.querySelector(".glass-panel")).toBeNull();
    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("Diện tích đất")).toBeNull();
  });

  it("tim chỉ trang trí: aria-hidden, không phải button, không nhận focus; chỉ có link thẻ là phần tử tương tác", () => {
    const { container } = renderOne(slide(1));
    const heart = screen.getByTestId("project-heart");
    expect(heart).toHaveAttribute("aria-hidden", "true");
    expect(heart.tagName).toBe("SPAN");
    expect(heart.closest("button")).toBeNull();
    expect(heart).not.toHaveAttribute("tabindex");
    expect(container.querySelectorAll("a, button")).toHaveLength(1); // 1 dự án → không có mũi tên/chấm
  });

  it("thiếu trạng thái (dữ liệu cũ) → không badge, không lỗi i18n; thiếu tỉnh → không dòng ghim", () => {
    renderOne({ ...slide(1), salesStatus: null, provinceName: null });
    expect(screen.getByRole("link", { name: "Dự án 1" })).toBeInTheDocument();
    expect(screen.queryByText(/mở bán|bàn giao/i)).toBeNull();
    expect(screen.queryByText("Hà Nội")).toBeNull();
  });

  it("Đang mở bán dùng badge success", () => {
    renderOne({ ...slide(1), salesStatus: "selling" });
    expect(screen.getByText("Đang mở bán")).toHaveAttribute("data-variant", "success");
  });
});
