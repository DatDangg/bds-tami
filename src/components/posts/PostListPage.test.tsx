import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { PostCardData } from "@/lib/posts/post-view";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const loadPostListing = vi.hoisted(() => vi.fn());
const loadPostCategoryContext = vi.hoisted(() => vi.fn(async () => null as unknown));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageBanner: async () => ({ url: "/api/media/file/banner.jpg", width: 1600, alt: "" }) }));
vi.mock("@/lib/posts/post-listing", () => ({
  loadPostListing,
  loadPostCategoryContext,
  postCategoryFilterIds: () => [],
  buildPostChips: async () => [
    { label: "Tất cả", href: "/tin-bds", current: true },
    { label: "Khuyến mãi", href: "/tin-bds/danh-muc/khuyen-mai" },
  ],
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import { PostListPage } from "./PostListPage";

const card = (id: string): PostCardData => ({
  id,
  title: `Tin ${id}`,
  href: `/tin-bds/tin-${id}`,
  excerpt: "",
  publishedAt: null,
  dateLabel: null,
  categoryName: null,
  cover: null,
  priceLabel: null,
  badge: null,
  endLabel: null,
});

const listing = (overrides: Record<string, unknown> = {}) => ({ featured: null, items: [card("1"), card("2")], totalPages: 3, totalDocs: 25, outOfRange: false, isEmpty: false, ...overrides });

afterEach(() => {
  loadPostListing.mockReset();
  loadPostCategoryContext.mockReset();
  loadPostCategoryContext.mockResolvedValue(null);
  notFound.mockClear();
});

describe("/tin-bds (BL-020 P3-T02): banner gọn, đếm kết quả, lưới 4 cột, tham số URL không đổi", () => {
  it("banner gọn 240px, 'Có N kết quả', lưới 1/2/3/4 cột, không có băng tìm kiếm (trang chưa có bộ lọc)", async () => {
    loadPostListing.mockResolvedValue(listing());
    const { container } = renderWithIntl(await PostListPage({ locale: "vi", rawPage: undefined }));
    expect(container.querySelector("section[data-hero-size=short]")).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Có 25 kết quả");
    expect(container.querySelector("ul.grid")?.className).toContain("grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4");
    expect(screen.queryByRole("search")).toBeNull();
  });

  it("golden: chip danh mục là link đường dẫn (không thêm tham số); phân trang chỉ dùng ?page= (trang 1 sạch)", async () => {
    loadPostListing.mockResolvedValue(listing());
    renderWithIntl(await PostListPage({ locale: "vi", rawPage: "2" }));
    expect(loadPostListing).toHaveBeenCalledWith({}, "vi", expect.objectContaining({ page: 2 }));
    const chips = within(screen.getByRole("navigation", { name: "Danh mục đăng tin" })).getAllByRole("link");
    expect(chips.map((link) => link.getAttribute("href"))).toEqual(["/tin-bds", "/tin-bds/danh-muc/khuyen-mai"]);
    const pager = within(screen.getByRole("navigation", { name: "Phân trang" }));
    const hrefs = pager.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/tin-bds");
    expect(hrefs).toContain("/tin-bds?page=3");
  });

  it("danh sách trống: tiêu đề riêng, không link về chính trang này", async () => {
    loadPostListing.mockResolvedValue(listing({ items: [], isEmpty: true, totalDocs: 0, totalPages: 0 }));
    renderWithIntl(await PostListPage({ locale: "vi", rawPage: undefined }));
    expect(screen.getByRole("heading", { name: "Chưa có tin đăng." })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Về danh sách" })).not.toBeInTheDocument();
  });

  it("danh mục trống: tiêu đề theo mục, vẫn link về /tin-bds", async () => {
    loadPostCategoryContext.mockResolvedValue({ category: { id: "c1", name: "Voucher", slug: "voucher" }, parent: null });
    loadPostListing.mockResolvedValue(listing({ items: [], isEmpty: true, totalDocs: 0, totalPages: 0 }));
    renderWithIntl(await PostListPage({ locale: "vi", rawPage: undefined, categorySlug: "voucher" }));
    expect(screen.getByRole("heading", { name: "Chưa có tin đăng trong mục này." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về danh sách" })).toHaveAttribute("href", "/tin-bds");
  });

  it("trang vượt số trang → notFound", async () => {
    loadPostListing.mockResolvedValue(listing({ outOfRange: true }));
    await expect(PostListPage({ locale: "vi", rawPage: "9" })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
