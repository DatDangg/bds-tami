import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DetailPageShell } from "./DetailPageShell";
import { DetailSection } from "./DetailSection";
import { SimilarCarousel } from "./SimilarCarousel";

const labels = { slide: "Dự án {index} / {total}", previous: "Trước", next: "Sau", dots: "Trang", goTo: "Tới {index}" };

describe("DetailPageShell", () => {
  it("hero → thanh thông số → tab dính → cột nội dung (thẻ) + aside có nhãn → slot cuối; gốc data-detail-page nền primary-subtle", () => {
    const { container } = renderWithIntl(
      <DetailPageShell
        hero={<h1>Hero</h1>}
        specBar={<div data-testid="spec" />}
        subNav={{ items: [{ id: "overview", label: "Tổng quan" }], label: "Mục" }}
        aside={<h2 id="aside-h">Liên hệ</h2>}
        asideLabelledBy="aside-h"
        after={<div data-testid="after" />}
      >
        <DetailSection id="overview" title="Tổng quan">
          <p>x</p>
        </DetailSection>
      </DetailPageShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-detail-page");
    expect(root).toHaveClass("bg-primary-subtle");
    const order = [screen.getByRole("heading", { level: 1 }), screen.getByTestId("spec"), screen.getByRole("navigation", { name: "Mục" }), screen.getByRole("region", { name: "Tổng quan" }), screen.getByRole("complementary", { name: "Liên hệ" }), screen.getByTestId("after")];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(container.querySelector('[data-section-style="cards"]')).not.toBeNull();
  });

  it("bands: dải rộng hết khung ngoài lưới, sau aside và trước after, nền xen kẽ trắng / bg-alt; khối trong dải không phải thẻ", () => {
    const { container } = renderWithIntl(
      <DetailPageShell
        hero={<h1>Hero</h1>}
        aside={<h2 id="aside-h">Liên hệ</h2>}
        asideLabelledBy="aside-h"
        bands={["location", "amenities", "gallery"].map((id) => ({ key: id, content: <DetailSection id={id} title={id}><p>{id}</p></DetailSection> }))}
        after={<div data-testid="after" />}
      >
        <DetailSection id="overview" title="Tổng quan">
          <p>x</p>
        </DetailSection>
      </DetailPageShell>,
    );
    const bands = Array.from(container.querySelectorAll<HTMLElement>("[data-detail-band]"));
    expect(bands.map((band) => band.className)).toEqual(["bg-surface", "bg-bg-alt", "bg-surface"]);
    const aside = screen.getByRole("complementary", { name: "Liên hệ" });
    expect(aside.compareDocumentPosition(bands[0]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bands[2]!.compareDocumentPosition(screen.getByTestId("after")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Dải nằm ngoài cột `group/detail` (thẻ) và ngoài lưới có aside.
    expect(container.querySelector('[data-section-style="cards"] #location')).toBeNull();
    expect(aside.parentElement?.contains(bands[0]!)).toBe(false);
    expect(bands[0]!.firstElementChild).toHaveClass("max-w-container", "px-gutter");
  });

  it("không specBar / subNav / aside: vẫn dựng nội dung", () => {
    renderWithIntl(
      <DetailPageShell hero={<h1>Hero</h1>}>
        <p>Nội dung</p>
      </DetailPageShell>,
    );
    expect(screen.getByText("Nội dung")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("belowSpecBar: ngay sau thanh thông số, trước tab, cùng khối pb-8", () => {
    renderWithIntl(
      <DetailPageShell hero={<h1>Hero</h1>} specBar={<div data-testid="spec" />} belowSpecBar={<div data-testid="below" />} subNav={{ items: [{ id: "overview", label: "Tổng quan" }], label: "Mục" }}>
        <DetailSection id="overview" title="Tổng quan">
          <p>x</p>
        </DetailSection>
      </DetailPageShell>,
    );
    const below = screen.getByTestId("below");
    expect(screen.getByTestId("spec").compareDocumentPosition(below) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(below.compareDocumentPosition(screen.getByRole("navigation", { name: "Mục" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(below.parentElement?.className).toBe("pb-8");
  });
});

describe("SimilarCarousel", () => {
  it("rỗng → không dựng", () => {
    const { container } = renderWithIntl(<SimilarCarousel items={[]} title="Dự án" labels={labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("đầu khối eyebrow + h2 hai màu + link Xem tất cả; carousel đặt tên theo h2", () => {
    renderWithIntl(
      <SimilarCarousel
        items={[<article key="a">A</article>, <article key="b">B</article>]}
        eyebrow="Có thể bạn quan tâm"
        title="Dự án"
        titleAccent="tương tự"
        viewAll={{ href: "/du-an", label: "Xem tất cả dự án" }}
        labels={labels}
      />,
    );
    const heading = screen.getByRole("heading", { level: 2, name: "Dự án tương tự" });
    expect(within(heading).getByText("tương tự")).toHaveClass("text-accent-text");
    expect(screen.getByRole("link", { name: "Xem tất cả dự án" })).toHaveAttribute("href", "/du-an");
    const carousel = screen.getAllByRole("region", { name: "Dự án tương tự" }).find((node) => node.getAttribute("aria-roledescription") === "carousel");
    expect(carousel).toBeDefined();
    expect(screen.getAllByRole("group", { name: /^Dự án \d \/ 2$/ })).toHaveLength(2);
  });
});
