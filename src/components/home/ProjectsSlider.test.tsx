import { act, fireEvent, screen } from "@testing-library/react";
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
});

type ObserverCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void;

afterEach(() => vi.unstubAllGlobals());

describe("ProjectsSlider", () => {
  it("chấm phân trang theo slide đang hiện (IntersectionObserver) và nút Sau cuộn tới slide kế", () => {
    let notify: ObserverCallback = () => undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: ObserverCallback) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderWithIntl(
      <>
        <h2 id="h">Dự án nổi bật</h2>
        <ProjectsSlider slides={[slide(1), slide(2), slide(3)]} labelledBy="h" />
      </>,
    );
    expect(screen.getByRole("region", { name: "Dự án nổi bật" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("button", { name: "Chuyển tới dự án 1" })).toHaveAttribute("aria-current", "true");

    const second = screen.getByRole("group", { name: "Dự án 2 / 3" });
    act(() => notify([{ isIntersecting: true, target: second }]));
    expect(screen.getByRole("button", { name: "Chuyển tới dự án 2" })).toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "Dự án sau" }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole("group", { name: "Dự án 3 / 3" }));
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
