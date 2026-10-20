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
});

describe("ProjectsSlider: thẻ lớn kính mờ + số liệu", () => {
  const renderOne = (view: ProjectSlideView, locale: "vi" | "en" = "vi") =>
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[view]} labelledBy="h" />
      </>,
      locale,
    );

  it("hiện đủ 3 số liệu từ field sẵn có, tên + địa điểm + badge trạng thái, cả thẻ là một link", () => {
    renderOne({ ...slide(1), salesStatus: "upcoming", stats: { landAreaM2: 12000, totalUnits: 350, handoverTime: "Q4/2027" } });
    const link = screen.getByRole("link", { name: "Dự án 1" }); // tên truy cập chỉ là tên dự án, không đọc cả số liệu
    expect(link).toHaveAttribute("href", "/du-an/du-an-1");
    expect(within(link).getByRole("heading", { level: 3, name: "Dự án 1" })).toBeInTheDocument();
    expect(within(link).getByText("Hà Nội")).toBeInTheDocument();
    expect(within(link).getByText("Sắp mở bán")).toHaveAttribute("data-variant", "primary");
    expect(within(link).getByText("Diện tích đất").tagName).toBe("DT");
    expect(within(link).getByText(/12\.000\s?m²/).tagName).toBe("DD");
    expect(within(link).getByText("Tổng số căn")).toBeInTheDocument();
    expect(within(link).getByText("350")).toBeInTheDocument();
    expect(within(link).getByText("Bàn giao")).toBeInTheDocument();
    expect(within(link).getByText("Q4/2027")).toBeInTheDocument();
  });

  it("thiếu trạng thái (dữ liệu cũ/select thiếu) → không badge, không lỗi i18n", () => {
    renderOne({ ...slide(1), salesStatus: null });
    expect(screen.getByRole("link", { name: "Dự án 1" })).toBeInTheDocument();
    expect(screen.queryByText(/mở bán|bàn giao/i)).toBeNull();
  });

  it("Đang mở bán dùng badge success; số liệu thiếu thì ẩn từng ô, không còn ô nào thì không có <dl>", () => {
    renderOne({ ...slide(1), stats: { landAreaM2: null, totalUnits: 120, handoverTime: null } });
    expect(screen.getByText("Đang mở bán")).toHaveAttribute("data-variant", "success");
    expect(screen.getByText("Tổng số căn")).toBeInTheDocument();
    expect(screen.queryByText("Diện tích đất")).toBeNull();
    expect(screen.queryByText("Bàn giao")).toBeNull();
  });

  it("không có số liệu nào: không dựng khung số liệu rỗng", () => {
    const { container } = renderOne(slide(1));
    expect(container.querySelector("dl")).toBeNull();
  });

  it("EN: nhãn và định dạng theo ngôn ngữ", () => {
    renderOne({ ...slide(1), stats: { landAreaM2: 12000, totalUnits: 350, handoverTime: "Q4/2027" } }, "en");
    expect(screen.getByText("Land area")).toBeInTheDocument();
    expect(screen.getByText("Total units")).toBeInTheDocument();
    expect(screen.getByText("Handover")).toBeInTheDocument();
    expect(screen.getByText(/12,000\s?m²/)).toBeInTheDocument();
  });
});
