import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { PostFilters } from "@/lib/posts/post-filters";
import type { PostChip } from "@/lib/posts/post-listing";
import type { PostFacets } from "@/lib/posts/post-queries";
import type { PostCardData } from "@/lib/posts/post-view";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
// Như Next: `permanentRedirect` ném để dừng render (308).
const permanentRedirect = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
);
const loadPostListing = vi.hoisted(() => vi.fn());
const loadPostCategoryContext = vi.hoisted(() => vi.fn());
const loadListingPageContent = vi.hoisted(() => vi.fn());
const loadListingStrengths = vi.hoisted(() => vi.fn());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound, permanentRedirect, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({
  loadPageHero: async () => ({
    image: { url: "/api/media/file/banner.jpg", width: 1600, alt: "" },
    eyebrow: "Đăng tin BĐS",
    title: "Tin bất động sản",
    titleAccent: "mới nhất",
    description: "Voucher và ưu đãi từ TAMI.",
  }),
}));
vi.mock("@/lib/content/load-listing-page", () => ({ loadListingPageContent }));
vi.mock("@/lib/content/load-listing-strengths", () => ({ loadListingStrengths }));
vi.mock("@/components/layout/ConsultBanner", () => ({ ConsultBanner: () => <aside data-testid="consult-banner" /> }));
vi.mock("@/lib/projects/project-queries", () => ({
  listProvinces: async () => [
    { id: "p1", slug: "ha-noi", name: "Thành phố Hà Nội", shortName: "Hà Nội" },
    { id: "p3", slug: "hue", name: "Thành phố Huế", shortName: "Huế" },
  ],
}));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "voucher", en: "vouchers" }) }));
vi.mock("@/lib/posts/post-listing", () => ({
  loadPostListing,
  loadPostCategoryContext,
  postCategoryFilterIds: (context: { category: { id: string } }) => [context.category.id],
  // Như `buildPostChips` thật ở chế độ danh mục cấp 1: "Tất cả" + Bán nhà + Voucher, đánh dấu theo danh mục đang xem.
  buildPostChips: async (_payload: unknown, locale: string, allLabel: string, context: { category: { id: string } } | null): Promise<PostChip[]> => {
    const prefix = locale === "en" ? "/en/property-news" : "/tin-bds";
    const category = locale === "en" ? "category" : "danh-muc";
    return [
      { countId: null, slug: null, label: allLabel, href: prefix, current: context === null },
      { countId: "c1", slug: "ban-nha", label: "Bán nhà", href: `${prefix}/${category}/ban-nha`, current: context?.category.id === "c1" },
      { countId: "c2", slug: "voucher", label: "Voucher", href: `${prefix}/${category}/voucher`, current: context?.category.id === "c2" },
    ];
  },
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

import { PostListPage, buildPostListMetadata } from "./PostListPage";

const card = (id: string, overrides: Partial<PostCardData> = {}): PostCardData => ({
  id,
  title: `Tin ${id}`,
  href: `/tin-bds/tin-${id}`,
  excerpt: "",
  publishedAt: null,
  dateLabel: null,
  categoryName: null,
  cover: null,
  priceLabel: "3,5 tỷ",
  badge: null,
  endLabel: null,
  kind: "property",
  hasOffer: false,
  propertyType: null,
  placeLabel: null,
  areaM2: 80,
  bedrooms: 2,
  ...overrides,
});

const zeros = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
const FACETS: PostFacets = {
  category: { all: 25, counts: { c1: 18, c2: 7 } },
  type: { all: 25, counts: { ...zeros(["apartment", "townhouse", "villa", "shophouse", "land", "resort", "condotel", "office"] as const), apartment: 9, villa: 2 } },
  direction: { all: 25, counts: { ...zeros(["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const), SE: 4 } },
  handover: { all: 25, counts: { raw: 1, basic: 0, full: 3 } },
  provinces: [
    { id: "p2", slug: "ho-chi-minh", name: "Hồ Chí Minh", count: 12, total: 15 },
    { id: "p1", slug: "ha-noi", name: "Hà Nội", count: 6, total: 8 },
  ],
};

const listing = (overrides: Record<string, unknown> = {}) => ({
  featured: [],
  items: [card("1"), card("2"), card("3", { kind: "voucher", hasOffer: true, priceLabel: null, areaM2: null, bedrooms: null, endLabel: "30/10/2026" })],
  totalPages: 3,
  totalDocs: 25,
  outOfRange: false,
  isEmpty: false,
  facets: FACETS,
  ...overrides,
});

const EMPTY_CONTENT = { quickSearch: [], learnMore: null, faqs: [], showStrengths: true };
const voucherContext = { category: { id: "c2", name: "Voucher", slug: "voucher", description: "Mã giảm giá" }, parent: null, root: { id: "c2" }, children: [] };

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  // Như loader thật: trả về bộ lọc đã đối chiếu (ở đây giữ nguyên bộ lọc đã parse).
  loadPostListing.mockImplementation(async (_payload: unknown, _locale: string, options: { filters?: PostFilters }) => listing({ filters: options.filters ?? {} }));
  loadPostCategoryContext.mockImplementation(async (_payload: unknown, _locale: string, slug: string) => (slug === "voucher" ? voucherContext : null));
  loadListingPageContent.mockResolvedValue(EMPTY_CONTENT);
  loadListingStrengths.mockResolvedValue(null);
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [loadPostListing, loadPostCategoryContext, loadListingPageContent, loadListingStrengths, notFound]) mock.mockReset();
  permanentRedirect.mockClear();
});

async function render(locale: "vi" | "en", searchParams: Record<string, string> = {}, categorySlug?: string) {
  return renderWithIntl(await PostListPage({ locale, searchParams, ...(categorySlug ? { categorySlug } : {}) }), locale);
}
const tabs = () => within(screen.getByRole("navigation", { name: /Danh mục đăng tin|Listing categories/ })).getAllByRole("link");
const sidebar = () => screen.getByRole("complementary", { name: /Bộ lọc|Filters/ });
const grid = () => screen.getByRole("region", { name: /Danh sách tin đăng|listings/i });
const follows = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
const lastOptions = () => loadPostListing.mock.calls.at(-1)![2] as { page: number; filters: PostFilters; categoryIds?: string[] };

describe("S08 /tin-bds (BL-052): khung danh sách chung", () => {
  it("hero (1 h1, ô tìm q) → tab danh mục (số) → cột lọc → nổi bật → 'N tin phù hợp' + Sắp xếp → lưới 3 cột → phân trang → banner tư vấn", async () => {
    loadPostListing.mockResolvedValue(listing({ featured: [card("9", { title: "Biệt thự nổi bật" })], filters: {} }));
    const { container } = await render("vi");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tin bất động sản");
    const searchForm = screen.getByRole("search", { name: "Tìm kiếm trong danh sách" });
    expect(searchForm).toHaveAttribute("action", "/tin-bds");
    expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
      ["Tất cả25 tin", "/tin-bds"],
      ["Bán nhà18 tin", "/tin-bds/danh-muc/ban-nha"],
      ["Voucher7 tin", "/tin-bds/danh-muc/voucher"],
    ]);
    expect(tabs().filter((tab) => tab.getAttribute("aria-current") === "page").map((tab) => tab.textContent)).toEqual(["Tất cả25 tin"]);
    const spotlight = screen.getByRole("region", { name: "Tin nổi bật" });
    expect(within(spotlight).getByRole("heading", { level: 2, name: "Biệt thự nổi bật" })).toBeInTheDocument();
    expect(within(spotlight).getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/tin-bds/tin-9#lead-form");
    const results = screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "25 tin phù hợp");
    const sort = screen.getByLabelText("Sắp xếp theo");
    expect(container.querySelector("[data-grid-max-cols]")).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
    const pager = screen.getByRole("navigation", { name: "Phân trang" });
    const order = [searchForm, tabs()[0]!, sidebar(), spotlight, results, sort, grid(), pager, screen.getByTestId("consult-banner")];
    order.slice(1).forEach((element, index) => expect(follows(order[index]!, element)).toBe(true));
    expect(screen.queryByRole("form", { name: /tư vấn/i })).toBeNull();
    expect(loadListingPageContent).toHaveBeenCalledWith("vi", "propertyPosts");
    expect(loadListingStrengths).toHaveBeenCalledWith("vi", "propertyPosts");
  });

  it("cột lọc: Loại hình · Tỉnh/thành · Mức giá · Diện tích · Phòng ngủ · Phòng tắm · Hướng · Tình trạng bàn giao; ô tích có số, chip Phòng ngủ / Phòng tắm KHÔNG số; 'Xoá tất cả' → /tin-bds", async () => {
    await render("vi");
    const aside = sidebar();
    expect(within(aside).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual([
      "Loại hình",
      "Tỉnh / thành",
      "Mức giá",
      "Diện tích",
      "Phòng ngủ",
      "Phòng tắm",
      "Hướng",
      "Tình trạng bàn giao",
    ]);
    expect(within(aside).getByRole("checkbox", { name: "Căn hộ(9)" })).toBeInTheDocument();
    expect(within(aside).getByRole("checkbox", { name: "Nhà phố/Liền kề(0)" })).toBeInTheDocument();
    expect(within(aside).getByRole("checkbox", { name: "Hồ Chí Minh(12)" })).toBeInTheDocument();
    expect(within(aside).getByRole("checkbox", { name: "Đông Nam(4)" })).toBeInTheDocument();
    expect(within(aside).getByRole("checkbox", { name: "Nội thất đầy đủ(3)" })).toBeInTheDocument();
    expect(within(aside).getAllByRole("radio").map((radio) => radio.getAttribute("aria-label") ?? radio.closest("label")?.textContent)).toEqual(["Tất cả", "1", "2", "3", "4+", "Tất cả", "1", "2", "3", "4+"]);
    expect(within(aside).getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuetext"))).toEqual(["0 tỷ", "50+ tỷ", "0 m²", "500+ m²"]);
    expect(within(aside).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/tin-bds");
  });

  it("thẻ lưới: thẻ BĐS (giá, diện tích) và thẻ voucher (hạn ưu đãi + Còn hạn) chung lưới; mọi tiêu đề thẻ là h2", async () => {
    const { container } = await render("vi");
    expect(within(grid()).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Tin 1", "Tin 2", "Tin 3"]);
    expect([...container.querySelectorAll("[data-post-kind]")].map((node) => node.getAttribute("data-post-kind"))).toEqual(["property", "property", "voucher"]);
    expect(screen.getByRole("link", { name: /Tin 1/ })).toHaveTextContent("3,5 tỷ");
    expect(screen.getByRole("link", { name: /Tin 3/ })).toHaveTextContent("Hạn ưu đãi: 30/10/2026");
  });

  it("tham số lọc: parse + bỏ giá trị lạ → loader; tab / phân trang / form không JS giữ bộ lọc; ô tích đã chọn được tích", async () => {
    await render("vi", { type: "apartment,bogus", province: "ha-noi", priceMin: "2", bedrooms: "2", bathrooms: "3", direction: "SE", sort: "price_asc", q: "Láng", page: "2" });
    expect(lastOptions()).toMatchObject({ page: 2, filters: { q: "Láng", types: ["apartment"], provinceSlugs: ["ha-noi"], priceMin: 2, bedrooms: 2, bathrooms: 3, directions: ["SE"], sort: "price_asc" } });
    const query = "?q=L%C3%A1ng&type=apartment&province=ha-noi&priceMin=2&bedrooms=2&bathrooms=3&direction=SE&sort=price_asc";
    expect(tabs()[2]).toHaveAttribute("href", `/tin-bds/danh-muc/voucher${query}`);
    const pager = within(screen.getByRole("navigation", { name: "Phân trang" }));
    expect(pager.getAllByRole("link").map((link) => link.getAttribute("href"))).toContain(`/tin-bds${query}&page=3`);
    const form = sidebar().querySelector("form")!;
    expect(form.querySelector('input[name=type][value="apartment"]')).toHaveAttribute("checked");
    expect(form.querySelector('input[name=province][value="ha-noi"]')).toHaveAttribute("checked");
    expect(form.querySelector('input[name=bathrooms][value="3"]')).toHaveAttribute("checked");
    expect(form.querySelector('input[name=bedrooms][value="2"]')).toHaveAttribute("checked");
    expect([...form.querySelectorAll<HTMLInputElement>(":scope > input[type=hidden]")].map((input) => `${input.name}=${input.value}`)).toEqual(["q=Láng", "sort=price_asc"]);
  });

  it("BL-055 C-1: link cũ CHỈ có ?category=<slug có thật> → 308 (permanentRedirect) sang trang danh mục theo ngôn ngữ; không tải danh sách", async () => {
    await expect(PostListPage({ locale: "vi", searchParams: { category: "voucher" } })).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirect).toHaveBeenCalledWith("/tin-bds/danh-muc/voucher");
    expect(loadPostListing).not.toHaveBeenCalled();
    await expect(PostListPage({ locale: "en", searchParams: { category: "voucher" } })).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirect).toHaveBeenLastCalledWith("/en/property-news/category/voucher");
    // Khoá khác nhưng rỗng coi như không có → vẫn 308.
    await expect(PostListPage({ locale: "vi", searchParams: { category: "voucher", q: "" } })).rejects.toThrow("NEXT_REDIRECT");
  });

  it("BL-055 C-1: ?category=<slug lạ> hoặc trang danh mục có ?category= → không redirect", async () => {
    await render("vi", { category: "khong-co" });
    expect(permanentRedirect).not.toHaveBeenCalled();
    (await render("vi", { category: "ban-nha" }, "voucher")).unmount();
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it("link cũ /tin-bds?category=voucher kèm tham số khác (page): không redirect, lọc theo danh mục đó + tab Voucher aria-current; hero vẫn của /tin-bds; category giữ trong form không JS", async () => {
    await render("vi", { category: "voucher", page: "2" });
    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(loadPostCategoryContext).toHaveBeenCalledWith({}, "vi", "voucher");
    expect(lastOptions()).toMatchObject({ page: 2, categoryIds: ["c2"] });
    expect(tabs().filter((tab) => tab.getAttribute("aria-current") === "page").map((tab) => tab.textContent)).toEqual(["Voucher7 tin"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tin bất động sản");
    expect([...sidebar().querySelectorAll<HTMLInputElement>("form > input[type=hidden]")].map((input) => `${input.name}=${input.value}`)).toEqual(["category=voucher"]);
  });

  it("slug danh mục lạ ở ?category= bị bỏ (không lọc, không 404)", async () => {
    await render("vi", { category: "khong-co" });
    expect(lastOptions().categoryIds).toBeUndefined();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("trống có lọc → 'Không tìm thấy tin phù hợp' + Xoá bộ lọc về trang sạch; không ô Sắp xếp", async () => {
    loadPostListing.mockResolvedValue(listing({ items: [], isEmpty: true, totalDocs: 0, totalPages: 1, filters: { bedrooms: 4 } }));
    await render("vi", { bedrooms: "4" });
    expect(screen.getByRole("heading", { name: "Không tìm thấy tin phù hợp" })).toBeInTheDocument();
    expect(within(screen.getByRole("status")).getByRole("link", { name: /Xoá bộ lọc/ })).toHaveAttribute("href", "/tin-bds");
    expect(screen.queryByLabelText("Sắp xếp theo")).toBeNull();
  });

  it("trống không lọc: 'Chưa có tin đăng.', không link về chính trang", async () => {
    loadPostListing.mockResolvedValue(listing({ items: [], isEmpty: true, totalDocs: 0, totalPages: 1, filters: {} }));
    await render("vi");
    expect(screen.getByRole("heading", { name: "Chưa có tin đăng." })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Về danh sách" })).not.toBeInTheDocument();
  });

  it("FAQ JSON-LD chỉ ở trang sạch", async () => {
    loadListingPageContent.mockResolvedValue({ ...EMPTY_CONTENT, faqs: [{ question: "Hỏi?", answer: "Đáp." }] });
    const hasFaqJsonLd = (root: HTMLElement) => [...root.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent?.includes("FAQPage"));
    const clean = await render("vi");
    expect(hasFaqJsonLd(clean.container)).toBe(true);
    clean.unmount();
    const filtered = await render("vi", { type: "villa" });
    expect(hasFaqJsonLd(filtered.container)).toBe(false);
    filtered.unmount();
    // Slug lạ ở `?category=` bị trang bỏ qua nhưng metadata vẫn noindex → không phát FAQ (P3-T03 review r1).
    expect(hasFaqJsonLd((await render("vi", { category: "khong-co" })).container)).toBe(false);
  });

  it("trang vượt số trang → notFound", async () => {
    loadPostListing.mockResolvedValue(listing({ outOfRange: true, filters: {} }));
    await expect(PostListPage({ locale: "vi", searchParams: { page: "9" } })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("/en: nhãn tiếng Anh, link /en/property-news", async () => {
    await render("en");
    expect(screen.getByRole("search")).toHaveAttribute("action", "/en/property-news");
    expect(within(sidebar()).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual([
      "Property type",
      "Province / city",
      "Price",
      "Area",
      "Bedrooms",
      "Bathrooms",
      "Direction",
      "Handover condition",
    ]);
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "25 listings found")).toBeInTheDocument();
  });
});

describe("S05 /tin-bds/danh-muc/[category]", () => {
  it("hero = tên + mô tả danh mục, eyebrow 'Đăng tin BĐS'; form + 'Xoá tất cả' về chính trang danh mục; tab của nó aria-current", async () => {
    await render("vi", {}, "voucher");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Voucher");
    expect(screen.getByText("Mã giảm giá")).toBeInTheDocument();
    expect(screen.getByRole("search")).toHaveAttribute("action", "/tin-bds/danh-muc/voucher");
    expect(within(sidebar()).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/tin-bds/danh-muc/voucher");
    expect(tabs().filter((tab) => tab.getAttribute("aria-current") === "page").map((tab) => tab.textContent)).toEqual(["Voucher7 tin"]);
  });

  it("danh mục trống: tiêu đề theo mục + link về /tin-bds", async () => {
    loadPostListing.mockResolvedValue(listing({ items: [], isEmpty: true, totalDocs: 0, totalPages: 1, filters: {} }));
    await render("vi", {}, "voucher");
    expect(screen.getByRole("heading", { name: "Chưa có tin đăng trong mục này." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về danh sách" })).toHaveAttribute("href", "/tin-bds");
  });

  it("danh mục không có → notFound", async () => {
    await expect(PostListPage({ locale: "vi", searchParams: {}, categorySlug: "khong-co" })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("buildPostListMetadata", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));

  it("trang sạch: index, canonical chính nó (trang 2 kèm ?page=2)", async () => {
    const root = await buildPostListMetadata({ locale: "vi", searchParams: {} });
    expect(root.robots).toEqual({ index: true, follow: true });
    expect(root.alternates?.canonical).toBe("https://tami.example/tin-bds");
    expect((await buildPostListMetadata({ locale: "vi", searchParams: { page: "2" } })).alternates?.canonical).toBe("https://tami.example/tin-bds?page=2");
  });

  it("có lọc / q / sort khác mặc định / ?category= slug lạ → noindex, follow + canonical trang sạch (không ?page)", async () => {
    for (const searchParams of [{ type: "villa" }, { q: "abc", page: "2" }, { sort: "price_desc" }, { category: "khong-co" }]) {
      const meta = await buildPostListMetadata({ locale: "vi", searchParams });
      expect(meta.robots).toMatchObject({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe("https://tami.example/tin-bds");
    }
    expect((await buildPostListMetadata({ locale: "vi", searchParams: { sort: "newest" } })).robots).toEqual({ index: true, follow: true });
  });

  it("link cũ /tin-bds?category=<slug có thật> → noindex + canonical về trang danh mục, không hreflang", async () => {
    for (const searchParams of [{ category: "voucher" }, { category: "voucher", type: "villa", page: "2" }]) {
      const meta = await buildPostListMetadata({ locale: "vi", searchParams });
      expect(meta.robots).toMatchObject({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe("https://tami.example/tin-bds/danh-muc/voucher");
      expect(meta.alternates?.languages).toBeUndefined();
    }
  });

  it("trang danh mục có lọc → noindex + canonical về trang danh mục sạch", async () => {
    const meta = await buildPostListMetadata({ locale: "vi", searchParams: { bedrooms: "3", page: "2" }, categorySlug: "voucher" });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/tin-bds/danh-muc/voucher");
  });
});
