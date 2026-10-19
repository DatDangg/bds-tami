import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { PostCardData } from "@/lib/posts/post-view";
import { FeaturedOffers } from "./FeaturedOffers";

const card = (n: number, overrides: Partial<PostCardData> = {}): PostCardData => ({
  id: `o${n}`,
  title: `Ưu đãi ${n}`,
  href: `/tin-bds/uu-dai-${n}`,
  excerpt: `Tóm tắt ${n}`,
  publishedAt: "2026-10-01T03:00:00.000Z",
  dateLabel: "01/10/2026",
  categoryName: "Voucher",
  cover: fakeMedia(`o${n}`),
  priceLabel: "3,5 tỷ",
  badge: null,
  endLabel: null,
  ...overrides,
});

describe("FeaturedOffers (slider)", () => {
  it("vùng carousel có tên, mỗi thẻ là slide có nhãn, link về chi tiết, 'Xem thêm' → /tin-bds", () => {
    renderWithIntl(<FeaturedOffers title="Mua từ chủ đầu tư" cards={[card(1), card(2), card(3)]} />);
    const region = screen.getByRole("region", { name: "Mua từ chủ đầu tư" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("list", { name: "Mua từ chủ đầu tư" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("group", { name: "Ưu đãi 2 / 3" })).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getByRole("link", { name: /Ưu đãi 1/ })).toHaveAttribute("href", "/tin-bds/uu-dai-1");
    expect(screen.getAllByText("3,5 tỷ")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Xem thêm" })).toHaveAttribute("href", "/tin-bds");
  });

  it("nút trước/sau cuộn ~90% bề rộng vùng nhìn thấy; chỉ có khi ≥ 2 thẻ", () => {
    const scrollBy = vi.fn();
    Element.prototype.scrollBy = scrollBy;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
    const { unmount } = renderWithIntl(<FeaturedOffers title="Mua từ chủ đầu tư" cards={[card(1), card(2)]} />);
    fireEvent.click(screen.getByRole("button", { name: "Ưu đãi sau" }));
    fireEvent.click(screen.getByRole("button", { name: "Ưu đãi trước" }));
    expect(scrollBy).toHaveBeenCalledTimes(2);
    expect(scrollBy.mock.calls[0]?.[0]).toMatchObject({ left: 900 });
    expect(scrollBy.mock.calls[1]?.[0]).toMatchObject({ left: -900 });
    unmount();
    vi.restoreAllMocks();
    renderWithIntl(<FeaturedOffers title="Mua từ chủ đầu tư" cards={[card(1)]} />);
    expect(screen.queryByRole("button", { name: "Ưu đãi sau" })).toBeNull();
  });

  it("EN: link 'See more' theo tiền tố ngôn ngữ", () => {
    renderWithIntl(<FeaturedOffers title="Buy direct" cards={[card(1, { href: "/en/property-news/x" })]} />, "en");
    expect(screen.getByRole("link", { name: "See more" })).toHaveAttribute("href", "/en/property-news");
  });
});
