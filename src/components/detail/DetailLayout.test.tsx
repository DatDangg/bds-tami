import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { DetailLayout } from "./DetailLayout";
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
