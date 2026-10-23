import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DETAIL_ASIDE_CARD_CLASS, DETAIL_ASIDE_STICKY_CLASS, DetailLayout } from "./DetailLayout";
import { DetailAsideFit } from "./DetailAsideFit";
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
  it("gốc data-detail-page + nền primary-subtle; thứ tự before → lưới (chứa thanh mục con) → after", () => {
    const { container } = renderLayout();
    const root = container.querySelector("[data-detail-page]") as HTMLElement;
    expect(root.className).toContain("bg-primary-subtle");
    const kids = Array.from(root.children).map((el) => el.textContent ?? "");
    expect(kids[0]).toBe("Đầu trang");
    expect(root.querySelector(":scope > nav")).toBeNull();
    expect(kids.at(-1)).toBe("Cuối trang");
    expect(screen.getByRole("navigation", { name: "Mục lục thử" })).toBeInTheDocument();
  });

  it("có subNav: thanh + cột chính cùng một khối lg:contents TRONG lưới; aside đứng ngoài khối đó (thanh hết dính khi hết cột trái < lg)", () => {
    const { container } = renderLayout();
    const nav = screen.getByRole("navigation", { name: "Mục lục thử" });
    const group = nav.parentElement as HTMLElement;
    const grid = group.parentElement as HTMLElement;
    expect(group.className).toBe("lg:contents");
    expect(group.firstElementChild).toBe(nav);
    expect(group.lastElementChild?.querySelector("section#a")).not.toBeNull();
    expect(group.nextElementSibling?.tagName).toBe("ASIDE");
    expect(grid.parentElement).toBe(container.querySelector("[data-detail-page]"));
    // Khe trên lưới chuyển sang mb của thanh; thanh trải 2 cột ≥ lg, không còn khung riêng (mx-auto/max-w/px) vì lưới đã có.
    expect(grid.className).toContain("pb-4 lg:pb-8");
    expect(grid.className).not.toMatch(/\bpy-4\b/);
    expect(nav.className).toContain("lg:col-span-2");
    expect(nav.className).toContain("mb-4");
    expect(nav.className).toContain("lg:mb-8");
    expect(nav.className).not.toContain("max-w-container");
  });

  it("cột chính là một thẻ trắng bo lớn; aside đứng sau (< lg nằm sau thẻ)", () => {
    const { container } = renderLayout({ subNav: undefined });
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
      "lg:top-[min(var(--detail-aside-top,calc(var(--sticky-top)_+_4.5rem)),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))]",
    );
  });

  it("DETAIL_ASIDE_STICKY_CLASS đọc --detail-aside-top (mặc định dưới thanh tab) để trang không có tab tái dùng", () => {
    expect(DETAIL_ASIDE_STICKY_CLASS).toContain("var(--detail-aside-top,");
  });

  it("DetailAsideFit: mặc định là aside; as=div dựng div không aria-labelledby", () => {
    const { container } = renderWithIntl(
      <>
        <DetailAsideFit aria-labelledby="x">
          <p>a</p>
        </DetailAsideFit>
        <DetailAsideFit as="div" aria-labelledby="x">
          <p>b</p>
        </DetailAsideFit>
      </>,
    );
    expect(container.querySelector("aside")?.getAttribute("aria-labelledby")).toBe("x");
    const div = container.querySelector("div") as HTMLElement;
    expect(div.tagName).toBe("DIV");
    expect(div).not.toHaveAttribute("aria-labelledby");
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

  it("leading: cột trái nằm TRƯỚC thẻ trắng, chỉ hiện ≥ lg, lưới [cột trái][thẻ]; không dùng aside", () => {
    const { container } = renderLayout({ subNav: undefined, aside: undefined, leading: <nav aria-label="Mục lục tin">TOC</nav> });
    const card = container.querySelector("section#a")?.parentElement as HTMLElement;
    const grid = card.parentElement as HTMLElement;
    expect(grid.firstElementChild?.className).toContain("hidden");
    expect(grid.firstElementChild?.className).toContain("lg:block");
    expect(grid.firstElementChild?.textContent).toBe("TOC");
    expect(grid.firstElementChild?.nextElementSibling).toBe(card);
    expect(grid.className).toContain("lg:grid-cols-[15rem_minmax(0,1fr)]");
    expect(grid.className).not.toContain("22rem");
  });

  it("không có leading/subNav: lưới và DOM giữ nguyên như cũ (thẻ là con đầu, cột phải 22rem/24rem)", () => {
    const { container } = renderLayout({ subNav: undefined });
    const card = container.querySelector("section#a")?.parentElement as HTMLElement;
    const grid = card.parentElement as HTMLElement;
    expect(grid.firstElementChild).toBe(card);
    expect(grid.className).toBe(
      "mx-auto w-full max-w-container px-gutter lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-10 py-4 lg:py-8",
    );
  });
});

describe('DetailLayout sectionStyle="cards" (BL-045)', () => {
  it("mặc định (single): cột chính là MỘT thẻ trắng, DetailSection không đổi (không eyebrow, h2 cỡ cũ)", () => {
    const { container } = renderLayout();
    const card = container.querySelector("section#a")?.parentElement as HTMLElement;
    expect(card.getAttribute("data-section-style")).toBeNull();
    expect(card.className).toContain("rounded-[28px]");
    expect(card.className).not.toContain("group/detail");
    expect(container.querySelector("section#a h2")?.className).toContain("text-h2");
    expect(container.querySelector("section#a p")).toBeNull();
  });

  it("cards: không thẻ bao ngoài; gốc group/detail + data-section-style; mỗi mục là thẻ trắng bo 20px; aside vẫn là phần tử kế sau", () => {
    const { container } = renderWithIntl(
      <DetailLayout sectionStyle="cards" aside={<div id="card">Thẻ phụ</div>} asideLabelledBy="card">
        <DetailSection id="a" eyebrow="Giới thiệu" title="Khối A">
          Nội dung A
        </DetailSection>
        <DetailSection id="b" title="Khối B">
          Nội dung B
        </DetailSection>
      </DetailLayout>,
    );
    const column = container.querySelector("section#a")?.parentElement as HTMLElement;
    expect(column.getAttribute("data-section-style")).toBe("cards");
    expect(column.className).toContain("group/detail");
    expect(column.className).not.toContain("rounded-[28px]");
    expect(column.className).not.toContain("bg-surface");
    expect(column.nextElementSibling?.tagName).toBe("ASIDE");
    const section = container.querySelector("section#a") as HTMLElement;
    expect(section.className).toContain("group-data-[section-style=cards]/detail:rounded-[20px]");
    expect(section.className).toContain("group-data-[section-style=cards]/detail:bg-surface");
    expect(section.className).toContain("scroll-mt-[calc(var(--sticky-top)+4.5rem)]");
    // Eyebrow vàng đứng trước h2.
    const eyebrow = section.querySelector("p") as HTMLElement;
    expect(eyebrow).toHaveTextContent("Giới thiệu");
    expect(eyebrow.className).toContain("text-accent-text");
    expect(eyebrow.nextElementSibling?.tagName).toBe("H2");
    expect(screen.getByRole("heading", { level: 2, name: "Khối A" })).toBeInTheDocument();
  });
});
