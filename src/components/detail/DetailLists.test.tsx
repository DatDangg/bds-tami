import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { DetailDistanceList } from "./DetailDistanceList";
import { DetailFeatureList } from "./DetailFeatureList";

const features = (count: number) => Array.from({ length: count }, (_, i) => ({ title: `Tiện ích ${i + 1}`, description: `Mô tả ${i + 1}` }));
const places = (count: number) => Array.from({ length: count }, (_, i) => ({ name: `Địa điểm ${i + 1}`, distance: `${i + 1} phút` }));

describe("DetailFeatureList", () => {
  it("rỗng → không dựng", () => {
    const { container } = renderWithIntl(<DetailFeatureList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("> initialCount: ẩn phần dư, nút aria-expanded mở / thu", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailFeatureList items={features(7)} expandLabel="Khám phá tất cả tiện ích" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    const toggle = screen.getByRole("button", { name: "Khám phá tất cả tiện ích" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", screen.getByRole("list").id);
    await user.click(toggle);
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "Thu gọn" })).toHaveAttribute("aria-expanded", "true");
  });

  it("≤ initialCount: không nút; có ảnh → ảnh lớn bên trái", () => {
    const { container } = renderWithIntl(<DetailFeatureList items={features(3)} image={fakeMedia("am", "Hồ bơi")} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("img", { name: "Hồ bơi" })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("md:grid-cols-2");
  });

  it("BL-056 A4: không ảnh → danh sách rộng hết, sm:2 / lg:3 cột; đúng 1 mục → 1 cột (không co thành nửa ô)", () => {
    const many = renderWithIntl(<DetailFeatureList items={features(3)} />);
    expect(many.container.querySelector("ul")).toHaveClass("sm:grid-cols-2", "lg:grid-cols-3");
    expect(many.container.firstElementChild).not.toHaveClass("md:grid-cols-2");
    const single = renderWithIntl(<DetailFeatureList items={features(1)} />);
    expect(single.container.querySelector("ul")?.className).not.toMatch(/grid-cols-/);
  });

  it("BL-056 A4: có ảnh → danh sách bên phải không dùng lớp cột của danh sách rộng", () => {
    const { container } = renderWithIntl(<DetailFeatureList items={features(3)} image={fakeMedia("am", "Hồ bơi")} />);
    expect(container.querySelector("ul")?.className).not.toMatch(/grid-cols-/);
  });
});

describe("DetailDistanceList", () => {
  it("rỗng → không dựng", () => {
    const { container } = renderWithIntl(<DetailDistanceList items={[]} title="Khoảng cách" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("tiêu đề đặt tên danh sách; > 8 hàng → Xem thêm mở phần còn lại", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DetailDistanceList items={places(10)} title="Khoảng cách đến các địa điểm quan trọng" />);
    expect(screen.getByRole("heading", { level: 3, name: "Khoảng cách đến các địa điểm quan trọng" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Khoảng cách đến các địa điểm quan trọng" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("1 phút")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xem thêm" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("≤ 8 hàng: không nút", () => {
    renderWithIntl(<DetailDistanceList items={places(8)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
