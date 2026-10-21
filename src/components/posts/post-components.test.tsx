import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { PostCardData, PostOfferView } from "@/lib/posts/post-view";
import { OfferBox } from "./OfferBox";
import { PostCard } from "./PostCard";
import { PostSpotlightContent } from "./PostSpotlightContent";

const card = (id: string, overrides: Partial<PostCardData> = {}): PostCardData => ({
  id,
  title: `Tin ${id}`,
  href: `/tin-bds/tin-${id}`,
  excerpt: `Tóm tắt ${id}`,
  publishedAt: "2026-10-01T03:00:00.000Z",
  dateLabel: "01/10/2026",
  categoryName: "Voucher",
  cover: fakeMedia(`anh-${id}`),
  priceLabel: null,
  badge: null,
  endLabel: null,
  kind: "property",
  hasOffer: false,
  propertyType: null,
  placeLabel: null,
  areaM2: null,
  bedrooms: null,
  ...overrides,
});

const offer = (overrides: Partial<PostOfferView> = {}): PostOfferView => ({
  badge: null,
  ended: false,
  price: null,
  areaLabel: null,
  period: null,
  voucherCode: null,
  terms: null,
  related: [],
  ...overrides,
});

afterEach(() => vi.unstubAllGlobals());

describe("PostCard home (slider Ưu đãi trang chủ, thẻ BL-045 giữ nguyên)", () => {
  it("cả thẻ là MỘT link, tiêu đề đúng cấp heading, giá và hạn ưu đãi", () => {
    const { container } = renderWithIntl(<PostCard data={card("1", { priceLabel: "3,5 tỷ", endLabel: "30/10/2026" })} variant="home" headingLevel="h2" />);
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(within(screen.getByRole("link")).getByRole("heading", { level: 2, name: "Tin 1" })).toBeInTheDocument();
    expect(screen.getByText("3,5 tỷ")).toBeInTheDocument();
    expect(screen.getByText("Đến 30/10/2026")).toBeInTheDocument();
  });

  it("ưu đãi đã kết thúc: badge 'Đã kết thúc' + ảnh mờ; vẫn là link", () => {
    const { container } = renderWithIntl(<PostCard data={card("1", { badge: { kind: "ended" } })} variant="home" headingLevel="h2" />);
    expect(screen.getByText("Đã kết thúc")).toBeInTheDocument();
    expect(container.querySelector(".opacity-70")).not.toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tin-bds/tin-1");
  });

  it("sắp hết hạn: 'Còn n ngày' / 'Hết hạn hôm nay'; không hết hạn: không badge, ảnh không mờ", () => {
    const first = renderWithIntl(<PostCard data={card("1", { badge: { kind: "endingSoon", daysLeft: 2 } })} variant="home" headingLevel="h2" />);
    expect(screen.getByText("Còn 2 ngày")).toBeInTheDocument();
    first.unmount();
    const second = renderWithIntl(<PostCard data={card("1", { badge: { kind: "endingSoon", daysLeft: 0 } })} variant="home" headingLevel="h2" />);
    expect(screen.getByText("Hết hạn hôm nay")).toBeInTheDocument();
    second.unmount();
    const { container } = renderWithIntl(<PostCard data={card("1")} variant="home" headingLevel="h2" />);
    expect(screen.queryByText(/Còn|Đã kết thúc|Hết hạn/)).toBeNull();
    expect(container.querySelector(".opacity-70")).toBeNull();
  });

  it("kiểu thẻ như ProjectCard: ảnh 11:10, tiêu đề 2 dòng font-display, mũi tên tròn, không tóm tắt", () => {
    const { container } = renderWithIntl(<PostCard data={card("1")} variant="home" headingLevel="h2" />);
    expect(container.querySelector('[class*="aspect-[11/10]"]')).not.toBeNull();
    expect(container.querySelector('[class*="aspect-[16/10]"]')).toBeNull();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("line-clamp-2");
    expect(heading.className).toContain("font-display text-h4");
    expect(heading.className).toContain("min-h-[2lh]");
    expect(container.querySelector("[aria-hidden=true].rounded-full")).not.toBeNull();
    expect(screen.queryByText("Tóm tắt 1")).toBeNull();
    expect(heading).toHaveClass("group-hover:text-accent-text", "group-focus-visible:text-accent-text");
    expect(heading).not.toHaveClass("group-hover:underline");
  });

  it("en: nhãn tiếng Anh", () => {
    renderWithIntl(<PostCard data={card("1", { badge: { kind: "ended" } })} variant="home" headingLevel="h2" />, "en");
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });
});

describe("PostSpotlightContent (thẻ nổi bật /tin-bds, BL-052)", () => {
  it("thẻ BĐS: tag danh mục + loại hình + Ưu đãi, h2, khu vực, Giá · Diện tích · Phòng ngủ; nút Xem chi tiết + Nhận tư vấn (#lead-form)", () => {
    const { container } = renderWithIntl(
      <PostSpotlightContent data={card("1", { priceLabel: "5,4 tỷ", areaM2: 80, bedrooms: 2, propertyType: "apartment", placeLabel: "Phường Láng, Hà Nội", hasOffer: true })} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Tin 1" })).toBeInTheDocument();
    expect(container).toHaveTextContent("Căn hộ");
    expect(container).toHaveTextContent("Ưu đãi");
    expect(container).toHaveTextContent("Phường Láng, Hà Nội");
    const facts = [...container.querySelectorAll("dt")].map((node) => node.textContent);
    expect(facts).toEqual(["Giá", "Diện tích", "Phòng ngủ"]);
    expect(container.querySelector("dl")).toHaveTextContent("5,4 tỷ");
    expect(screen.getByRole("link", { name: "Xem chi tiết: Tin 1" })).toHaveAttribute("href", "/tin-bds/tin-1");
    expect(screen.getByRole("link", { name: "Nhận tư vấn: Tin 1" })).toHaveAttribute("href", "/tin-bds/tin-1#lead-form");
  });

  it("thẻ BĐS không giá: \"Liên hệ\"; ô trống bị bỏ", () => {
    const { container } = renderWithIntl(<PostSpotlightContent data={card("1")} />);
    expect([...container.querySelectorAll("dt")].map((node) => node.textContent)).toEqual(["Giá"]);
    expect(container.querySelector("dd")).toHaveTextContent("Liên hệ");
  });

  it("thẻ voucher: Hạn ưu đãi · Trạng thái thay giá / diện tích; đã kết thúc → \"Đã kết thúc\"", () => {
    const { container } = renderWithIntl(<PostSpotlightContent data={card("1", { kind: "voucher", hasOffer: true, endLabel: "30/10/2026", badge: { kind: "ended" } })} />);
    expect([...container.querySelectorAll("dt")].map((node) => node.textContent)).toEqual(["Hạn ưu đãi", "Trạng thái"]);
    expect(container.querySelector("dl")).toHaveTextContent("30/10/2026");
    expect(container.querySelector("dl")).toHaveTextContent("Đã kết thúc");
  });

  it("en: nhãn tiếng Anh", () => {
    renderWithIntl(<PostSpotlightContent data={card("1", { kind: "voucher", hasOffer: true, endLabel: "30/10/2026" })} />, "en");
    expect(screen.getByText("Offer ends")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get advice: Tin 1" })).toBeInTheDocument();
  });
});

describe("OfferBox", () => {
  it("ưu đãi còn hạn: mã voucher + nút sao chép; bấm → ghi clipboard và báo qua aria-live", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderWithIntl(<OfferBox offer={offer({ voucherCode: "TAMI500", period: { startLabel: "01/10/2026", endLabel: "30/10/2026" } })} />);
    expect(screen.getByText("TAMI500")).toBeInTheDocument();
    expect(screen.getByText("Từ 01/10/2026 đến 30/10/2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sao chép" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Đã sao chép mã"));
    expect(writeText).toHaveBeenCalledWith("TAMI500");
  });

  it("ưu đãi hết hạn: badge 'Đã kết thúc', dòng 'Ưu đãi đã kết thúc', KHÔNG có mã và KHÔNG có nút sao chép", () => {
    const { container } = renderWithIntl(<OfferBox offer={offer({ ended: true, badge: { kind: "ended" }, voucherCode: null, period: { startLabel: null, endLabel: "17/10/2026" } })} />);
    expect(screen.getByText("Ưu đãi đã kết thúc")).toBeInTheDocument();
    expect(screen.getAllByText("Đã kết thúc").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Sao chép" })).toBeNull();
    expect(container.textContent).not.toContain("TAMI500");
    expect(screen.getByText("Đến 17/10/2026")).toBeInTheDocument();
  });

  it("giá, khu vực dạng dl; điều khoản là accordion đóng; liên quan là link có ảnh", () => {
    const { container } = renderWithIntl(
      <OfferBox
        offer={offer({
          price: "5.500.000 ₫",
          areaLabel: "Phường Sài Gòn, TP.HCM",
          terms: "Áp dụng 1 lần",
          related: [
            { kind: "project", title: "Dự án A", href: "/du-an/du-an-a", image: fakeMedia("pa") },
            { kind: "rental", title: "Căn hộ B", href: "/cho-thue/can-ho-b", image: null },
          ],
        })}
      />,
    );
    expect(container.querySelector("dl")).toHaveTextContent("5.500.000 ₫");
    expect(container.querySelector("dl")).toHaveTextContent("Phường Sài Gòn, TP.HCM");
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByRole("link", { name: /Dự án A/ })).toHaveAttribute("href", "/du-an/du-an-a");
    expect(screen.getByRole("link", { name: /Căn hộ B/ })).toHaveAttribute("href", "/cho-thue/can-ho-b");
  });
});
