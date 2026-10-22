import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { DetailGalleryGrid } from "./DetailGalleryGrid";

const images = (count: number) => Array.from({ length: count }, (_, i) => fakeMedia(`p${i + 1}`, `Ảnh ${i + 1}`));

describe("DetailGalleryGrid", () => {
  it("0 ảnh → không dựng", () => {
    const { container } = renderWithIntl(<DetailGalleryGrid images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("nhiều ảnh: hiện 5 ô, ảnh đầu 2×2, không ảnh priority; bấm ô mở Lightbox đúng ảnh, đóng trả focus", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<DetailGalleryGrid images={images(9)} />);
    const cells = screen.getAllByRole("button", { name: /^Xem ảnh \d \/ 9$/ });
    expect(cells).toHaveLength(5);
    expect(cells[0]?.closest("li")).toHaveClass("@md/detail:row-span-2", "col-span-2");
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(0);
    await user.click(cells[3]!);
    expect(await screen.findByRole("dialog", { name: "Xem ảnh" })).toHaveTextContent("Ảnh 4 / 9");
    await user.keyboard("{Escape}");
    expect(cells[3]).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Xem tất cả hình ảnh" }));
    expect(await screen.findByRole("dialog", { name: "Xem ảnh" })).toHaveTextContent("Ảnh 1 / 9");
  });

  it("4 ảnh: ô thứ hai rộng 2 cột ≥ md, ô cuối rộng hết < md (không ô trống)", () => {
    renderWithIntl(<DetailGalleryGrid images={images(4)} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[1]).toHaveClass("@md/detail:col-span-2");
    expect(items[3]).toHaveClass("col-span-2", "@md/detail:col-span-1");
  });

  it("1 ảnh: một ô, không nút Xem tất cả", () => {
    renderWithIntl(<DetailGalleryGrid images={images(1)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Xem tất cả hình ảnh" })).toBeNull();
  });
});
