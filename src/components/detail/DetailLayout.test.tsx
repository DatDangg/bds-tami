import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DETAIL_ASIDE_CARD_CLASS, DetailLayout } from "./DetailLayout";
import { DetailSection } from "./DetailSection";

function renderLayout(props: Partial<Parameters<typeof DetailLayout>[0]> = {}) {
  return renderWithIntl(
    <DetailLayout
      before={<h1>Đầu trang</h1>}
      subNav={{ items: [{ id: "a", label: "Mục A" }], label: "Mục lục thử" }}
      aside={<div id="card">Thẻ phụ</div>}
      asideLabelledBy="card"
      after={<p>Cuối trang</p>}
      {...props}
    >
      <DetailSection id="a" title="Khối A">
        Nội dung A
      </DetailSection>
    </DetailLayout>,
  );
}

describe("DetailLayout", () => {
  it("gốc data-detail-page + nền primary-subtle; thứ tự before → thanh mục con → lưới → after", () => {
    const { container } = renderLayout();
    const root = container.querySelector("[data-detail-page]") as HTMLElement;
    expect(root.className).toContain("bg-primary-subtle");
    const kids = Array.from(root.children).map((el) => el.textContent ?? "");
    expect(kids[0]).toBe("Đầu trang");
    expect(root.children[1]?.tagName).toBe("NAV");
    expect(kids.at(-1)).toBe("Cuối trang");
    expect(screen.getByRole("navigation", { name: "Mục lục thử" })).toBeInTheDocument();
  });

  it("cột chính là một thẻ trắng bo lớn; aside là phần tử kế sau (< lg nằm sau thẻ)", () => {
    const { container } = renderLayout();
    const card = container.querySelector("section#a")?.parentElement as HTMLElement;
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("rounded-[28px]");
    expect(card.className).toContain("p-5");
    expect(card.nextElementSibling?.tagName).toBe("ASIDE");
    expect(card.nextElementSibling?.getAttribute("aria-labelledby")).toBe("card");
  });

  it("thẻ phụ không cuộn riêng: không max-h/overflow-y, top = min(dưới thanh mục con, đáy viewport − chiều cao thẻ − 1rem)", () => {
    expect(DETAIL_ASIDE_CARD_CLASS).not.toMatch(/max-h|overflow-y/);
    expect(DETAIL_ASIDE_CARD_CLASS).toContain("lg:sticky");
    expect(DETAIL_ASIDE_CARD_CLASS).toContain(
      "lg:top-[min(calc(var(--sticky-top)_+_4.5rem),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))]",
    );
  });

  describe("DetailAsideFit (ResizeObserver)", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("ghi --detail-aside-h lên aside theo chiều cao thẻ con đầu; ngắt observer khi unmount", () => {
      let notify: () => void = () => {};
      const disconnect = vi.fn();
      class FakeResizeObserver {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe() {}
        disconnect = disconnect;
      }
      vi.stubGlobal("ResizeObserver", FakeResizeObserver);
      const { container, unmount } = renderLayout();
      const aside = container.querySelector("aside") as HTMLElement;
      const card = aside.firstElementChild as HTMLElement;
      expect(aside).toHaveAttribute("aria-labelledby", "card");
      expect(aside.className).toContain("pt-6");
      card.getBoundingClientRect = () => ({ height: 812 }) as DOMRect;
      notify();
      expect(aside.style.getPropertyValue("--detail-aside-h")).toBe("812px");
      unmount();
      expect(disconnect).toHaveBeenCalled();
    });

    it("không có ResizeObserver: không lỗi, không ghi biến", () => {
      vi.stubGlobal("ResizeObserver", undefined);
      const { container } = renderLayout();
      expect((container.querySelector("aside") as HTMLElement).style.getPropertyValue("--detail-aside-h")).toBe("");
    });
  });

  it("không có subNav/aside thì không dựng nav/aside", () => {
    const { container } = renderLayout({ subNav: undefined, aside: undefined });
    expect(container.querySelector("nav")).toBeNull();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("DetailSection: section[aria-labelledby] + scroll-mt theo --sticky-top + tabIndex -1", () => {
    const { container } = renderLayout();
    const section = container.querySelector("section#a") as HTMLElement;
    expect(section.getAttribute("aria-labelledby")).toBe(section.querySelector("h2")?.id);
    expect(section.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    expect(section).toHaveAttribute("tabindex", "-1");
  });
});
