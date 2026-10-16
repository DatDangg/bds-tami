import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Gallery } from "./Gallery";
import { fakeMedia, renderWithIntl } from "./test-utils";

afterEach(() => vi.unstubAllGlobals());

function stubViewport(belowMd: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: belowMd, media: query, addEventListener: () => {}, removeEventListener: () => {} }));
}

const images = Array.from({ length: 7 }, (_, index) => fakeMedia(`p${index + 1}`));

describe("Gallery", () => {
  it("chỉ ảnh đầu được ưu tiên khi priorityFirst, ảnh còn lại lazy", () => {
    const { container } = renderWithIntl(<Gallery images={images} priorityFirst />);
    const [first, ...rest] = Array.from(container.querySelectorAll("img"));
    expect(first).toHaveAttribute("fetchpriority", "high");
    expect(first).not.toHaveAttribute("loading", "lazy");
    for (const image of rest) expect(image).toHaveAttribute("loading", "lazy");
  });

  it("không ưu tiên ảnh nào khi không phải LCP", () => {
    const { container } = renderWithIntl(<Gallery images={images} />);
    for (const image of Array.from(container.querySelectorAll("img"))) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).not.toHaveAttribute("fetchpriority", "high");
    }
  });

  it("dùng đúng cỡ đã sinh và alt từ media, không gọi bộ tối ưu của Next", () => {
    const { container } = renderWithIntl(<Gallery images={images} />);
    const first = container.querySelector("img");
    expect(first).toHaveAttribute("alt", "Ảnh p1");
    expect(first?.getAttribute("srcset")).toContain("/api/media/file/p1-");
    expect(first?.getAttribute("srcset")).not.toContain("/_next/image");
  });

  it("giữ chỗ bằng tỉ lệ cố định cho từng ô để CLS = 0", () => {
    renderWithIntl(<Gallery images={images} />);
    const slot = screen.getByRole("button", { name: "Phóng to ảnh 1 / 7" });
    expect(slot.parentElement?.className).toContain("aspect-4/3");
  });

  it("có từ 6 ảnh thì ảnh thứ 5 phủ '+n ảnh' và ảnh thứ 6 trở đi ẩn ở bố cục bento", () => {
    renderWithIntl(<Gallery images={images} />);
    expect(within(screen.getByRole("button", { name: "Phóng to ảnh 5 / 7" })).getByText("+2 ảnh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phóng to ảnh 6 / 7" }).parentElement?.className).toContain("md:hidden");
  });

  it("mobile hiển thị bộ đếm dạng 1/7", () => {
    renderWithIntl(<Gallery images={images} />);
    expect(screen.getByText("1/7")).toBeInTheDocument();
  });

  it("dưới 3 ảnh chỉ hiện ảnh đầu, ẩn lưới và bộ đếm", () => {
    renderWithIntl(<Gallery images={images.slice(0, 2)} />);
    expect(screen.getAllByRole("button", { name: /Phóng to ảnh/ })).toHaveLength(1);
    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
  });

  it("không có ảnh thì không render gì", () => {
    const { container } = renderWithIntl(<Gallery images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("nhãn theo locale en", () => {
    renderWithIntl(<Gallery images={images} />, "en");
    expect(screen.getByRole("region", { name: "Photo gallery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enlarge photo 1 of 7" })).toBeInTheDocument();
  });

  it("bấm ảnh mở lightbox đúng ảnh", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Gallery images={images} />);
    await user.click(screen.getByRole("button", { name: "Phóng to ảnh 3 / 7" }));
    const dialog = await screen.findByRole("dialog", { name: "Xem ảnh" });
    expect(within(dialog).getByText("Ảnh 3 / 7")).toBeInTheDocument();
    expect(within(dialog).getByText("Ảnh p3")).toBeInTheDocument();
  });

  it("mobile: vùng là carousel, mỗi slide là group có nhãn 'n / total'", () => {
    stubViewport(true);
    renderWithIntl(<Gallery images={images} />);
    const region = screen.getByRole("region", { name: "Thư viện ảnh" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(region).getAllByRole("group");
    expect(slides).toHaveLength(7);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAccessibleName("1 / 7");
    expect(slides[6]).toHaveAccessibleName("7 / 7");
  });

  it("từ md (bento): không gắn ngữ nghĩa carousel/slide cho ô lưới", () => {
    stubViewport(false);
    renderWithIntl(<Gallery images={images} />);
    expect(screen.getByRole("region", { name: "Thư viện ảnh" })).not.toHaveAttribute("aria-roledescription");
    expect(screen.queryAllByRole("group")).toHaveLength(0);
  });

  it("3 và 4 ảnh: các ô phủ kín lưới 4x2, không để ô trống", () => {
    const totalCells = (count: number) => {
      const { unmount } = renderWithIntl(<Gallery images={images.slice(0, count)} />);
      let cells = 0;
      for (let index = 1; index <= count; index += 1) {
        const slot = screen.getByRole("button", { name: `Phóng to ảnh ${index} / ${count}` }).parentElement as HTMLElement;
        if (slot.className.includes("md:row-span-2")) cells += 4;
        else cells += slot.className.includes("md:col-span-2") ? 2 : 1;
      }
      unmount();
      return cells;
    };
    expect(totalCells(3)).toBe(8);
    expect(totalCells(4)).toBe(8);
  });
});
