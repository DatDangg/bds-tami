import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { DetailHeroMosaic } from "./DetailHeroMosaic";

const images = (count: number) => Array.from({ length: count }, (_, i) => fakeMedia(`h${i + 1}`, `Ảnh ${i + 1}`));
const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("DetailHeroMosaic", () => {
  it("nhiều ảnh: h1 đặt tên vùng, ảnh 1 priority, ≤ 3 ảnh nhỏ, ảnh nhỏ đầu = Xem tất cả N ảnh, breadcrumb + badge + địa chỉ + mô tả", () => {
    const { container } = renderWithIntl(
      <DetailHeroMosaic
        images={images(6)}
        title="The Crown"
        breadcrumb={<nav aria-label="crumb">Trang chủ</nav>}
        badges={<span>Đang mở bán</span>}
        address="Phường Tân Tiến, Bắc Ninh"
        summary="Khu đô thị tích hợp"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "The Crown" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "The Crown" })).toBeInTheDocument();
    expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "crumb" })).toBeInTheDocument();
    expect(screen.getByText("Đang mở bán")).toBeInTheDocument();
    expect(screen.getByText("Phường Tân Tiến, Bắc Ninh")).toBeInTheDocument();
    expect(screen.getByText("Khu đô thị tích hợp")).toBeInTheDocument();
    const thumbs = within(screen.getByRole("list", { name: "Ảnh khác" })).getAllByRole("button");
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAccessibleName("Xem tất cả 6 ảnh");
    expect(thumbs[1]).toHaveAccessibleName("Xem ảnh 3");
    // Nút < lg (ẩn ≥ lg bằng CSS) cùng nhãn.
    expect(screen.getAllByRole("button", { name: "Xem tất cả 6 ảnh" })).toHaveLength(2);
  });

  it("bấm ảnh nhỏ mở Lightbox đúng ảnh; Esc đóng và trả focus về nút đã bấm", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailHeroMosaic images={images(4)} title="Dự án" />);
    const third = screen.getByRole("button", { name: "Xem ảnh 3" });
    await user.click(third);
    expect(await screen.findByRole("dialog", { name: "Xem ảnh" })).toHaveTextContent("Ảnh 3 / 4");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(third).toHaveFocus();

    await user.click(within(screen.getByRole("list", { name: "Ảnh khác" })).getByRole("button", { name: "Xem tất cả 4 ảnh" }));
    expect(await screen.findByRole("dialog", { name: "Xem ảnh" })).toHaveTextContent("Ảnh 1 / 4");
  });

  it("1 ảnh: không ảnh nhỏ, không nút Xem tất cả; không video → không nút video", () => {
    renderWithIntl(<DetailHeroMosaic images={images(1)} title="Một ảnh" />);
    expect(screen.queryByRole("list", { name: "Ảnh khác" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Xem tất cả/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Xem video giới thiệu" })).toBeNull();
  });

  it("0 ảnh: vẫn dựng h1 trên nền tối, không ảnh / Lightbox", () => {
    const { container } = renderWithIntl(<DetailHeroMosaic images={[]} title="Không ảnh" summary={null} address={null} />);
    expect(screen.getByRole("heading", { level: 1, name: "Không ảnh" })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("có video: nút mở Dialog chứa VideoFacade (chưa tạo iframe trước khi bấm phát)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailHeroMosaic images={images(2)} title="Có video" videoUrl={VIDEO} />);
    await user.click(screen.getByRole("button", { name: "Xem video giới thiệu" }));
    const dialog = await screen.findByRole("dialog", { name: "Video giới thiệu" });
    expect(dialog.querySelector("iframe")).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Đóng video" })).toBeInTheDocument();
  });

  it("tiếng Anh", () => {
    renderWithIntl(<DetailHeroMosaic images={images(3)} title="Crown" videoUrl={VIDEO} />, "en");
    expect(screen.getAllByRole("button", { name: "View all 3 photos" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Watch the intro video" })).toBeInTheDocument();
  });
});
