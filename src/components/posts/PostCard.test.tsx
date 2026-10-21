import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { PostCardData } from "@/lib/posts/post-view";
import { PostCard } from "./PostCard";
import { PostListBody } from "./PostListBody";

const card = (id: string, overrides: Partial<PostCardData> = {}): PostCardData => ({
  id,
  title: `Tin ${id}`,
  href: `/tin-bds/tin-${id}`,
  excerpt: `Tóm tắt ${id}`,
  publishedAt: "2026-10-01T03:00:00.000Z",
  dateLabel: "01/10/2026",
  categoryName: "Nhà đất bán",
  cover: fakeMedia(`anh-${id}`),
  priceLabel: "3,5 tỷ",
  badge: null,
  endLabel: null,
  kind: "property",
  hasOffer: false,
  propertyType: "villa",
  placeLabel: "Phường Bến Nghé, TP.HCM",
  areaM2: 120,
  bedrooms: 3,
  ...overrides,
});

const voucher = (overrides: Partial<PostCardData> = {}) =>
  card("v", { kind: "voucher", hasOffer: true, categoryName: "Voucher", priceLabel: null, propertyType: null, placeLabel: null, areaM2: null, bedrooms: null, endLabel: "30/10/2026", ...overrides });

describe("PostCard listing — thẻ BĐS (BL-052)", () => {
  it("MỘT link; tag danh mục + loại hình, tiêu đề, vị trí, giá rút gọn, diện tích · phòng ngủ, mũi tên; không tim, không ngày đăng", () => {
    const { container } = renderWithIntl(<PostCard data={card("1")} headingLevel="h2" />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    const article = container.querySelector("article");
    expect(article).toHaveAttribute("data-card-variant", "listing");
    expect(article).toHaveAttribute("data-post-kind", "property");
    const link = screen.getByRole("link");
    expect(within(link).getByRole("heading", { level: 2, name: "Tin 1" })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Phân loại" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Nhà đất bán", "Biệt thự"]);
    expect(link).toHaveTextContent("Phường Bến Nghé, TP.HCM");
    expect(link).toHaveTextContent("3,5 tỷ");
    const specs = screen.getByRole("list", { name: "Thông số" });
    expect(specs).toHaveTextContent("120 m²");
    expect(within(specs).getByText("3 phòng ngủ")).toHaveClass("sr-only");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(container.querySelector("time")).toBeNull();
    expect(container.innerHTML).not.toMatch(/heart/i);
    expect(screen.queryByText("Ưu đãi")).toBeNull();
  });

  it("không có giá lẫn ghi chú giá → 'Liên hệ'; không có thông số → không có danh sách thông số", () => {
    renderWithIntl(<PostCard data={card("1", { priceLabel: null, areaM2: null, bedrooms: null, propertyType: null, categoryName: null })} headingLevel="h3" />);
    expect(screen.getByText("Liên hệ")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Thông số" })).toBeNull();
    expect(screen.queryByRole("list", { name: "Phân loại" })).toBeNull();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("tin bán kèm ưu đãi: badge 'Ưu đãi' trên ảnh; ưu đãi đã kết thúc: badge 'Đã kết thúc' + ảnh mờ (BR-06)", () => {
    const first = renderWithIntl(<PostCard data={card("1", { hasOffer: true })} headingLevel="h2" />);
    expect(screen.getByText("Ưu đãi")).toBeInTheDocument();
    first.unmount();
    const { container } = renderWithIntl(<PostCard data={card("1", { hasOffer: true, badge: { kind: "ended" } })} headingLevel="h2" />);
    expect(screen.getByText("Đã kết thúc")).toBeInTheDocument();
    expect(container.querySelector(".opacity-70")).not.toBeNull();
  });

  it("en: nhãn loại hình + phòng ngủ tiếng Anh, 'Contact us' khi không có giá", () => {
    renderWithIntl(<PostCard data={card("1", { priceLabel: null })} headingLevel="h2" />, "en");
    expect(screen.getByText("Villa")).toBeInTheDocument();
    expect(screen.getByText("3 bedrooms")).toBeInTheDocument();
    expect(screen.getByText("Contact us")).toBeInTheDocument();
  });
});

describe("PostCard listing — thẻ voucher (BL-052)", () => {
  it("badge ưu đãi, tiêu đề, hạn ưu đãi, trạng thái 'Còn hạn', mũi tên; không giá / diện tích", () => {
    const { container } = renderWithIntl(<PostCard data={voucher()} headingLevel="h2" />);
    expect(container.querySelector("article")).toHaveAttribute("data-post-kind", "voucher");
    expect(screen.getByText("Ưu đãi")).toBeInTheDocument();
    expect(screen.getByText("Hạn ưu đãi: 30/10/2026")).toBeInTheDocument();
    expect(container.querySelector('[data-offer-status="active"]')).toHaveTextContent("Còn hạn");
    expect(screen.queryByText("Liên hệ")).toBeNull();
    expect(screen.queryByRole("list", { name: "Thông số" })).toBeNull();
    expect(container.querySelector(".opacity-70")).toBeNull();
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
  });

  it("hết hạn: trạng thái 'Đã kết thúc', ảnh mờ, thẻ vẫn là link (BR-06); sắp hết hạn: badge 'Còn n ngày'", () => {
    const first = renderWithIntl(<PostCard data={voucher({ badge: { kind: "ended" } })} headingLevel="h2" />);
    expect(first.container.querySelector('[data-offer-status="ended"]')).toHaveTextContent("Đã kết thúc");
    expect(first.container.querySelector(".opacity-70")).not.toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tin-bds/tin-v");
    first.unmount();
    const { container } = renderWithIntl(<PostCard data={voucher({ badge: { kind: "endingSoon", daysLeft: 2 } })} headingLevel="h2" />);
    expect(screen.getByText("Còn 2 ngày")).toBeInTheDocument();
    expect(container.querySelector('[data-offer-status="active"]')).toHaveTextContent("Còn hạn");
  });

  it("chỉ có mã voucher (không hạn): không dòng hạn ưu đãi; en: nhãn tiếng Anh", () => {
    renderWithIntl(<PostCard data={voucher({ endLabel: null })} headingLevel="h2" />, "en");
    expect(screen.queryByText(/Offer ends/)).toBeNull();
    expect(screen.getByText("Offer")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});

describe("PostListBody với nhiều tin nổi bật (tạm tới P3-T03)", () => {
  it("tin nổi bật đầu là thẻ ngang, các tin nổi bật còn lại đứng đầu lưới; không lặp", () => {
    const { container } = renderWithIntl(<PostListBody featured={[card("1"), card("2")]} items={[card("3")]} />);
    expect(container.querySelector("[data-post-featured] a")).toHaveAttribute("href", "/tin-bds/tin-1");
    expect([...container.querySelectorAll("ul.grid > li h2")].map((heading) => heading.textContent)).toEqual(["Tin 2", "Tin 3"]);
  });
});
