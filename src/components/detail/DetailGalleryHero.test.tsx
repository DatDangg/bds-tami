import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { DetailGalleryHero } from "./DetailGalleryHero";

const images = (count: number) => Array.from({ length: count }, (_, i) => fakeMedia(`g${i + 1}`, `Ảnh ${i + 1}`));

describe("DetailGalleryHero", () => {
  it("ảnh đầu là ảnh LCP (priority), bộ đếm 01 / N + thanh tiến trình, mũi tên, ảnh nhỏ ≤ 4, Xem tất cả ảnh", () => {
    const { container } = renderWithIntl(<DetailGalleryHero images={images(6)} breadcrumb={<nav aria-label="crumb">Trang chủ</nav>} />);
    const region = screen.getByRole("region", { name: "Thư viện ảnh" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(screen.getByRole("group", { name: "Ảnh 1 / 6" })).toBeInTheDocument();
    expect(region.textContent).toContain("01 / 06");
    expect(screen.getByRole("button", { name: "Ảnh trước" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ảnh sau" })).toBeInTheDocument();
    const thumbs = within(screen.getByRole("list", { name: "Ảnh thu nhỏ" })).getAllByRole("button");
    expect(thumbs).toHaveLength(4);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Xem tất cả ảnh" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "crumb" })).toBeInTheDocument();
    // Không chứa h1 (nằm ở DetailTitleCard).
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("nút sau / trước / ảnh nhỏ / phím ← → đổi ảnh vòng quanh, bộ đếm theo kịp; ảnh sau không còn priority", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<DetailGalleryHero images={images(3)} />);
    const region = screen.getByRole("region", { name: "Thư viện ảnh" });
    await user.click(screen.getByRole("button", { name: "Ảnh sau" }));
    expect(region.textContent).toContain("02 / 03");
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(0);
    await user.keyboard("{ArrowRight}");
    expect(region.textContent).toContain("03 / 03");
    await user.keyboard("{ArrowRight}");
    expect(region.textContent).toContain("01 / 03");
    await user.keyboard("{ArrowLeft}");
    expect(region.textContent).toContain("03 / 03");
    await user.click(screen.getByRole("button", { name: "Xem ảnh 2" }));
    expect(region.textContent).toContain("02 / 03");
  });

  it("vuốt ngang đổi ảnh; vuốt dọc thì không", () => {
    renderWithIntl(<DetailGalleryHero images={images(3)} />);
    const region = screen.getByRole("region", { name: "Thư viện ảnh" });
    const swipe = (dx: number, dy: number) => {
      act(() => {
        region.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [{ clientX: 200, clientY: 100 } as Touch] }));
        region.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [{ clientX: 200 + dx, clientY: 100 + dy } as Touch] }));
      });
    };
    swipe(-120, 5);
    expect(region.textContent).toContain("02 / 03");
    swipe(0, -200);
    expect(region.textContent).toContain("02 / 03");
    swipe(120, 0);
    expect(region.textContent).toContain("01 / 03");
  });

  it("Xem tất cả ảnh mở lightbox ở ảnh đang xem; Esc đóng", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailGalleryHero images={images(3)} />);
    await user.click(screen.getByRole("button", { name: "Ảnh sau" }));
    await user.click(screen.getByRole("button", { name: "Xem tất cả ảnh" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("1 ảnh: không mũi tên, không bộ đếm, không ảnh nhỏ nhưng vẫn có Xem tất cả ảnh", () => {
    renderWithIntl(<DetailGalleryHero images={images(1)} />);
    expect(screen.queryByRole("button", { name: "Ảnh sau" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Ảnh thu nhỏ" })).toBeNull();
    expect(screen.getByRole("region", { name: "Thư viện ảnh" }).textContent).not.toMatch(/\d\d \/ \d\d/);
    expect(screen.getByRole("button", { name: "Xem tất cả ảnh" })).toBeInTheDocument();
  });

  it("0 ảnh: nền tối cùng chiều cao, không ảnh, không nút ảnh; slot actions vẫn hiện", () => {
    const { container } = renderWithIntl(<DetailGalleryHero images={[]} actions={<button type="button">Video</button>} />);
    const region = screen.getByRole("region", { name: "Thư viện ảnh" });
    expect(container.querySelector("img")).toBeNull();
    expect(region.className).toContain("bg-dark-deep");
    expect(region.className).toContain("h-[480px]");
    expect(screen.queryByRole("button", { name: "Xem tất cả ảnh" })).toBeNull();
    expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
  });

  it("/en: nhãn tiếng Anh", () => {
    renderWithIntl(<DetailGalleryHero images={images(2)} />, "en");
    expect(screen.getByRole("region", { name: "Photo gallery" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View all photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next photo" })).toBeInTheDocument();
  });
});
