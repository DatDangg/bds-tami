import { screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import vi_messages from "@/i18n/messages/vi.json";
import type { RentalListingFacets } from "@/lib/search/search-service";
import type { RentalCard, RentalSearchParams, RentalSearchResult } from "@/shared/types/api";

const now = "2026-01-01T00:00:00.000Z";
const category = (id: string, name: string, slug: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  slug,
  scope: "rental",
  hasEnglish: true,
  updatedAt: now,
  createdAt: now,
  ...extra,
});
const categories = [category("c1", "Căn hộ", "can-ho"), category("c1b", "Căn hộ dịch vụ", "can-ho-dich-vu", { parent: "c1" }), category("c2", "Nhà phố", "nha-pho", { hasEnglish: false })];
const province = (id: string, name: string, slug: string) => ({ id, code: id, name, shortName: name, slug, updatedAt: now, createdAt: now });
const provinces = [province("p1", "Hà Nội", "ha-noi"), province("p2", "Hồ Chí Minh", "ho-chi-minh"), province("p3", "Huế", "hue")];
const wardsOfHanoi = [
  { id: "w1", name: "Phường Ba Đình", slug: "ba-dinh" },
  { id: "w2", name: "Phường Cầu Giấy", slug: "cau-giay" },
];

const card = (id: string, title: string, extra: Partial<RentalCard> = {}): RentalCard => ({
  id,
  code: `CT-00000${id}`,
  title,
  slug: `slug-${id}`,
  status: "published",
  thumbnail: { url: `/api/media/file/${id}-800.webp`, alt: `Ảnh ${id}` },
  priceMonthlyVnd: 8_500_000,
  priceNegotiable: false,
  areaM2: 45,
  bedrooms: 1,
  bathrooms: 1,
  furnishing: "full",
  province: { name: "Hà Nội", slug: "ha-noi" },
  ward: { name: "Phường Ba Đình", slug: "ba-dinh" },
  category: null,
  publishedAt: now,
  ...extra,
});
const cards = [card("1", "Studio Ba Đình"), card("2", "Căn hộ 2PN", { bedrooms: 2, priceMonthlyVnd: null, priceNegotiable: true }), card("3", "Nhà phố rộng", { bedrooms: null })];
const featuredCard = card("9", "Penthouse nổi bật", { category: { name: "Căn hộ", slug: "can-ho" }, bedrooms: 3, bathrooms: 2, priceMonthlyVnd: 45_000_000 });

/** Số đếm theo chiều (P2-T01): tab theo id danh mục cấp 1, tỉnh theo id (`total` = không lọc). */
const FACETS: RentalListingFacets = {
  category: { all: 7, counts: { c1: 5, c2: 2 } },
  provinces: [
    { provinceId: "p2", count: 2, total: 4 },
    { provinceId: "p1", count: 5, total: 6 },
  ],
  // P2-T04: ô Tiện ích "trừ chiều tiện ích".
  amenities: { pool: 3, gym: 1, elevator: 4, parking: 0, security: 2, balcony: 0, washing_machine: 0, air_conditioner: 5, pet_friendly: 0, kitchen: 0 },
};

const search = vi.hoisted(() => vi.fn<(params: RentalSearchParams) => Promise<RentalSearchResult>>());
const listingExtras = vi.hoisted(() => ({ featured: [] as RentalCard[], facets: null as unknown }));
const projectRows = vi.hoisted(() => ({ rows: [] as Array<{ slug: string; title: string }> }));
const wardsFind = vi.hoisted(() => vi.fn());
const findPublicList = vi.hoisted(() => vi.fn());
const findPublicBySlug = vi.hoisted(() => vi.fn());
const findByID = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
interface HeroStub {
  title: string;
  description: string | undefined;
  image?: { url: string; width: number } | undefined;
  eyebrow?: string | undefined;
  titleAccent?: string | undefined;
}
const loadPageHero = vi.hoisted(() => vi.fn<(locale: string, key: string) => Promise<HeroStub>>());
const loadListingPageContent = vi.hoisted(() => vi.fn());
const loadListingStrengths = vi.hoisted(() => vi.fn<(locale: string, key: string) => Promise<unknown>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({ find: wardsFind, findByID }) }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageHero }));
vi.mock("@/lib/content/load-listing-page", () => ({ loadListingPageContent }));
vi.mock("@/lib/content/load-listing-strengths", () => ({ loadListingStrengths }));
// ConsultBanner là Server Component bất đồng bộ đọc homepage (server-only): đã có test riêng, ở đây chỉ cần biết nó được dựng ở cuối trang.
vi.mock("@/components/layout/ConsultBanner", () => ({ ConsultBanner: () => <aside data-testid="consult-banner" /> }));
vi.mock("@/lib/content/public-queries", () => ({ findPublicList, findPublicBySlug }));
vi.mock("@/lib/projects/project-queries", () => ({ listProvinces: async () => provinces }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/search/search-service", () => ({
  PostgresRentalSearch: class {
    search = search;
    // `listing` = lưới (`search`, đã bỏ tin nổi bật ở SQL) + thẻ nổi bật (chỉ trang 1) + số đếm theo chiều; ngữ nghĩa SQL kiểm ở tests/integration/rental-search.test.ts.
    listing = async (params: RentalSearchParams) => ({
      ...(await search(params)),
      featured: params.page === 1 ? listingExtras.featured : [],
      facets: listingExtras.facets ?? { category: { all: 0, counts: {} }, provinces: [] },
    });
  },
  // Ô "Dự án" (BL-052) đọc SQL trực tiếp.
  sqlExecutorOf: () => ({ execute: async () => projectRows }),
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

import { RentalListPage, buildRentalListMetadata } from "./RentalListPage";

function result(items: RentalCard[], overrides: Partial<RentalSearchResult> = {}): RentalSearchResult {
  return { items, total: items.length, page: 1, totalPages: Math.max(1, Math.ceil(items.length / 12)), ...overrides };
}

const EMPTY_CONTENT = { quickSearch: [], learnMore: null, faqs: [], showStrengths: true };

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  // Mặc định như `loadPageHero` thật khi admin chưa nhập gì: chữ i18n, không ảnh.
  loadPageHero.mockImplementation(async (locale) => ({ title: locale === "vi" ? "Cho thuê" : "For rent", description: "Mô tả hero", image: undefined, eyebrow: undefined, titleAccent: undefined }));
  loadListingPageContent.mockResolvedValue(EMPTY_CONTENT);
  loadListingStrengths.mockResolvedValue(null);
  search.mockResolvedValue(result(cards));
  listingExtras.featured = [];
  listingExtras.facets = FACETS;
  projectRows.rows = [];
  wardsFind.mockResolvedValue({ docs: wardsOfHanoi });
  findPublicList.mockImplementation(async (_payload: unknown, _collection: string, locale: string) => ({
    docs: categories.filter((item) => locale === "vi" || item.hasEnglish),
  }));
  // Như truy vấn thật: slug của ĐÚNG ngôn ngữ; ở /en chỉ danh mục hasEnglish. Cha được populate (depth 1).
  findPublicBySlug.mockImplementation(async (_payload: unknown, _collection: string, locale: string, slug: string) => {
    const found = categories.find((item) => item.slug === slug && (locale === "vi" || item.hasEnglish));
    if (!found) return null;
    const parent = categories.find((item) => item.id === (found as { parent?: string }).parent);
    return parent ? { ...found, parent } : found;
  });
  findByID.mockResolvedValue({ slug: { vi: "can-ho", en: "apartment" } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [search, wardsFind, findPublicList, findPublicBySlug, findByID, notFound, loadPageHero, loadListingPageContent, loadListingStrengths]) mock.mockReset();
});

async function render(locale: "vi" | "en", searchParams: Record<string, string | string[]> = {}, categorySlug?: string) {
  const ui = await RentalListPage({ locale, searchParams, ...(categorySlug ? { categorySlug } : {}) });
  return renderWithIntl(ui, locale);
}
const grid = () => screen.getByRole("region", { name: /Danh sách tin cho thuê|rental listings/i });
const gridTitles = () => within(grid()).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const tabNav = () => screen.getByRole("navigation", { name: /Loại hình|Property type/ });
const tabs = () => within(tabNav()).getAllByRole("link");
const currentTabs = () => tabs().filter((tab) => tab.getAttribute("aria-current") === "page");
const sidebar = () => screen.getByRole("complementary", { name: /Bộ lọc|Filters/ });
const resultsText = (text: string) => screen.getByText((_, element) => element?.tagName === "P" && element.textContent === text);
const lastParams = (): RentalSearchParams => search.mock.calls.at(-1)![0];
const follows = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe("S04 /cho-thue (BL-052): bố cục", () => {
  it("hero (1 h1, ô tìm q) → tab danh mục (icon + số) → cột lọc → nổi bật → 'N căn phù hợp' + Sắp xếp → lưới 3 cột → phân trang → banner tư vấn", async () => {
    listingExtras.featured = [featuredCard];
    search.mockResolvedValue(result(cards, { total: 4 }));
    const { container } = await render("vi");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const searchForm = screen.getByRole("search", { name: "Tìm kiếm trong danh sách" });
    expect(searchForm).toHaveAttribute("action", "/cho-thue");
    expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
      ["Tất cả7 căn", "/cho-thue"],
      ["Căn hộ5 căn", "/cho-thue/danh-muc/can-ho"],
      ["Nhà phố2 căn", "/cho-thue/danh-muc/nha-pho"],
    ]);
    expect(currentTabs().map((tab) => tab.textContent)).toEqual(["Tất cả7 căn"]);
    const spotlight = screen.getByRole("region", { name: "Tin cho thuê nổi bật" });
    expect(within(spotlight).getByRole("heading", { level: 2, name: "Penthouse nổi bật" })).toBeInTheDocument();
    expect(within(spotlight).getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/cho-thue/slug-9#lead-form");
    expect(within(spotlight).getByRole("link", { name: /Nhận tư vấn/ })).toHaveClass("border-text", "text-text"); // BL-056: outline
    expect(within(spotlight).getByRole("link", { name: /Nhận tư vấn/ })).not.toHaveClass("border-transparent");
    expect(spotlight).toHaveTextContent("45 triệu/tháng");
    expect(spotlight).toHaveTextContent("3 phòng ngủ · 2 phòng tắm");
    // "N phù hợp" gồm cả tin nổi bật; tin nổi bật không lặp trong lưới.
    const results = resultsText("4 căn phù hợp");
    expect(results).toHaveAttribute("aria-live", "polite");
    expect(gridTitles()).toEqual(["Studio Ba Đình", "Căn hộ 2PN", "Nhà phố rộng"]);
    expect(container.querySelector("[data-grid-max-cols]")).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
    const sort = screen.getByLabelText("Sắp xếp theo");
    const order = [searchForm, tabs()[0]!, sidebar(), spotlight, results, sort, grid(), screen.getByTestId("consult-banner")];
    order.slice(1).forEach((element, index) => expect(follows(order[index]!, element)).toBe(true));
    expect(lastParams()).toMatchObject({ locale: "vi", limit: 12, page: 1, sort: "newest", available: true });
  });

  it("cột lọc: Tỉnh/thành (chọn một + số, chỉ tỉnh có tin, theo số tin) · Dự án · Giá thuê · Diện tích · Phòng ngủ · Nội thất · Tiện ích; không ô Loại hình; 'Xoá tất cả' → /cho-thue", async () => {
    projectRows.rows = [{ slug: "vinhomes", title: "Vinhomes Ocean Park" }];
    await render("vi");
    const aside = sidebar();
    expect(within(aside).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual(["Tỉnh/thành", "Dự án", "Giá thuê", "Diện tích", "Phòng ngủ", "Nội thất", "Tiện ích"]);
    const provinceList = within(aside).getByRole("list", { name: "Tỉnh/thành" });
    expect(within(provinceList).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Tất cả tỉnh/thành", "Hà Nội(5)", "Hồ Chí Minh(2)"]);
    expect(within(provinceList).getByRole("radio", { name: "Tất cả tỉnh/thành" })).toBeChecked();
    expect(within(aside).queryByRole("group", { name: /Phường/ })).toBeNull();
    expect(within(aside).getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuetext"))).toEqual(["0 triệu", "100+ triệu", "0 m²", "300+ m²"]);
    expect(within(aside).getAllByRole("radio", { name: /^(1|2|3|4\+)$/ })).toHaveLength(4);
    expect(within(aside).getByRole("radio", { name: "Đầy đủ" })).toBeInTheDocument();
    expect(within(aside).getByRole("checkbox", { name: "Hồ bơi(3)" })).toBeInTheDocument();
    expect(within(aside).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/cho-thue");
    expect(screen.queryByText(/Đang lọc/)).toBeNull();
  });

  it("thẻ: giá rút gọn /tháng, 'Thương lượng' khi tick thương lượng (cùng chữ chi tiết), diện tích + phòng ngủ; thẻ là h2", async () => {
    await render("vi");
    const first = screen.getByRole("link", { name: /Studio Ba Đình/ });
    expect(first).toHaveAttribute("href", "/cho-thue/slug-1");
    expect(first).toHaveTextContent("8,5 triệu/tháng");
    expect(first).toHaveTextContent("45 m²");
    expect(first).toHaveTextContent("1 PN");
    expect(screen.getByRole("link", { name: /Căn hộ 2PN/ })).toHaveTextContent("Thương lượng");
    expect(screen.getByRole("link", { name: /Nhà phố rộng/ })).not.toHaveTextContent("PN");
  });

  it("không có tin nổi bật hoặc trang 2: không thẻ nổi bật; không có kết quả thì không ô Sắp xếp", async () => {
    listingExtras.featured = [featuredCard];
    search.mockResolvedValue(result(cards, { total: 30, page: 2, totalPages: 3 }));
    (await render("vi", { page: "2" })).unmount();
    expect(screen.queryByRole("region", { name: "Tin cho thuê nổi bật" })).toBeNull();
    search.mockResolvedValue(result([]));
    await render("vi", { province: "ha-noi" });
    expect(screen.queryByLabelText("Sắp xếp theo")).toBeNull();
  });

  it("Tìm hiểu thêm + FAQ (listingPages.rentals) sau lưới → dải Điểm mạnh → banner; FAQ JSON-LD chỉ ở trang sạch; Tìm nhanh là link ?q=", async () => {
    loadListingStrengths.mockResolvedValue({ kind: "strengths", items: [{ icon: "shield-check", title: "Pháp lý rõ ràng", description: null }, { icon: "headset", title: "Tư vấn", description: null }] });
    loadListingPageContent.mockResolvedValue({ ...EMPTY_CONTENT, quickSearch: ["Studio"], learnMore: { title: "Thuê nhà cùng TAMI", eyebrow: "Tìm hiểu thêm" }, faqs: [{ question: "Hỏi?", answer: "Đáp." }] });
    const { container, unmount } = await render("vi");
    expect(loadListingPageContent).toHaveBeenCalledWith("vi", "rentals");
    expect(loadListingStrengths).toHaveBeenCalledWith("vi", "rentals");
    const faq = screen.getByRole("heading", { level: 2, name: "Câu hỏi thường gặp" });
    const strengths = screen.getByRole("region", { name: "Điểm mạnh" });
    expect(follows(grid(), faq)).toBe(true);
    expect(follows(faq, strengths)).toBe(true);
    expect(follows(strengths, screen.getByTestId("consult-banner"))).toBe(true);
    expect(screen.getByRole("link", { name: "Studio" })).toHaveAttribute("href", "/cho-thue?q=Studio");
    const hasFaqJsonLd = (root: HTMLElement) => [...root.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent?.includes("FAQPage"));
    expect(hasFaqJsonLd(container)).toBe(true);
    unmount();
    const filtered = await render("vi", { bedrooms: "2" });
    expect(hasFaqJsonLd(filtered.container)).toBe(false);
    filtered.unmount();
    // Dự án lạ bị trang bỏ nhưng metadata vẫn noindex → không phát FAQ (P3-T03 review r1).
    expect(hasFaqJsonLd((await render("vi", { project: "khong-co" })).container)).toBe(false);
  });

  it("/en: nhãn tiếng Anh, link /en/for-rent, tab chỉ danh mục có EN, 'listing(s)'", async () => {
    search.mockResolvedValue(result([cards[0]!]));
    await render("en");
    expect(lastParams()).toMatchObject({ locale: "en" });
    expect(screen.getByRole("heading", { level: 1, name: "For rent" })).toBeInTheDocument();
    expect(resultsText("1 listing found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Studio Ba Đình/ })).toHaveAttribute("href", "/en/for-rent/slug-1");
    expect(tabs().map((tab) => tab.getAttribute("href"))).toEqual(["/en/for-rent", "/en/for-rent/category/can-ho"]);
    expect(within(sidebar()).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual(["Province/city", "Monthly rent", "Floor area", "Bedrooms", "Furnishing", "Amenities"]);
    expect(within(sidebar()).getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuetext"))).toEqual(["VND 0M", "VND 100M+", "0 m²", "300+ m²"]);
    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
  });
});

describe("S04 /cho-thue (BL-052): tham số URL", () => {
  it("mọi bộ lọc từ URL đến SearchService; tham số lạ bị bỏ; ô lọc + badge phản ánh URL; số tỉnh 'trừ chiều tỉnh'", async () => {
    projectRows.rows = [{ slug: "vinhomes", title: "Vinhomes Ocean Park" }];
    await render("vi", {
      q: "studio quan 1",
      province: "ha-noi",
      ward: "ba-dinh",
      project: "vinhomes",
      priceMin: "5000000",
      priceMax: "15000000",
      areaMin: "25",
      bedrooms: "2",
      furnishing: "full",
      amenities: "pool,gym,foo",
      sort: "price_asc",
      utm_source: "fb",
      limit: "48",
    });
    expect(lastParams()).toEqual({
      locale: "vi",
      limit: 12,
      page: 1,
      available: true,
      q: "studio quan 1",
      province: "ha-noi",
      ward: "ba-dinh",
      project: "vinhomes",
      priceMin: 5_000_000,
      priceMax: 15_000_000,
      areaMin: 25,
      bedrooms: 2,
      furnishing: "full",
      amenities: ["pool", "gym"],
      sort: "price_asc",
    });
    expect(screen.getByRole("searchbox", { name: "Từ khoá" })).toHaveValue("studio quan 1");
    const aside = sidebar();
    expect(within(aside).getByRole("radio", { name: /Hà Nội/ })).toBeChecked();
    expect(within(aside).getByRole("group", { name: "Phường/xã" })).toBeInTheDocument();
    expect(within(aside).getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuetext"))).toEqual(["5 triệu", "15 triệu", "25 m²", "300+ m²"]);
    expect(within(aside).getByRole("radio", { name: "2" })).toBeChecked();
    expect(within(aside).getByRole("radio", { name: "Đầy đủ" })).toBeChecked();
    expect(within(aside).getByRole("checkbox", { name: "Hồ bơi(3)" })).toBeChecked();
    expect(within(aside).getByRole("checkbox", { name: "Phòng gym(1)" })).toBeChecked();
    // Badge < lg: tỉnh + phường + dự án + phòng ngủ + nội thất + giá + diện tích + 2 tiện ích = 9 (từ khoá, sắp xếp không tính).
    expect(screen.getByRole("button", { name: "Bộ lọc (9)" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sắp xếp theo")).toHaveTextContent("Giá tăng dần");
  });

  it("phường chỉ tải của tỉnh trên URL; phường / danh mục / tỉnh / dự án lạ bị bỏ (danh sách không lọc, không 404); tỉnh lạ không tải phường", async () => {
    (await render("vi", { province: "ha-noi", ward: "khong-co", category: "khong-co", project: "khong-co" })).unmount();
    expect(lastParams()).not.toHaveProperty("ward");
    expect(lastParams()).not.toHaveProperty("category");
    expect(lastParams()).not.toHaveProperty("project");
    expect(lastParams()).toMatchObject({ province: "ha-noi" });
    expect(wardsFind).toHaveBeenCalledTimes(1);
    expect(wardsFind.mock.calls[0]![0]).toMatchObject({ collection: "wards", where: { province: { equals: "p1" } }, overrideAccess: false });
    wardsFind.mockClear();
    await render("vi", { province: "khong-co", ward: "ba-dinh" });
    expect(lastParams()).not.toHaveProperty("province");
    expect(wardsFind).not.toHaveBeenCalled();
  });

  it("tỉnh đang chọn không còn tin vẫn hiện (đếm 0, mờ) để bỏ chọn", async () => {
    await render("vi", { province: "hue" });
    const item = within(within(sidebar()).getByRole("list", { name: "Tỉnh/thành" })).getByRole("radio", { name: /Huế/ }).closest("li")!;
    expect(item).toHaveTextContent("Huế(0)");
    expect(item).toHaveAttribute("data-empty", "true");
  });

  it("ô Tiện ích có số đếm (P2-T04); tiện ích đang chọn mà đếm 0 vẫn hiện (0, mờ) và bỏ tích được; chip Phòng ngủ / Nội thất không số", async () => {
    await render("vi", { amenities: "pool,kitchen" });
    const aside = sidebar();
    const list = within(aside).getByRole("list", { name: "Tiện ích" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Hồ bơi(3)",
      "Phòng gym(1)",
      "Thang máy(4)",
      "Chỗ đậu xe(0)",
      "Bảo vệ 24/7(2)",
      "Ban công(0)",
      "Máy giặt(0)",
      "Điều hoà(5)",
      "Cho nuôi thú cưng(0)",
      "Bếp riêng(0)",
    ]);
    const kitchen = within(list).getByRole("checkbox", { name: "Bếp riêng(0)" });
    expect(kitchen).toBeChecked();
    expect(kitchen).toBeEnabled();
    expect(kitchen.closest("li")).toHaveAttribute("data-empty", "true");
    expect(within(aside).getByRole("radio", { name: "Đầy đủ" }).closest("label")).toHaveTextContent(/^Đầy đủ$/);
    expect(within(aside).getByRole("radio", { name: "2" }).closest("label")).toHaveTextContent(/^2$/);
  });

  it("link cũ /cho-thue?category=<slug> (ô tìm kiếm trang chủ): lọc đúng danh mục, tab đó aria-current; tab giữ lọc khác, bỏ danh mục + trang; form giữ category", async () => {
    await render("vi", { category: "can-ho", province: "ha-noi", page: "1" });
    expect(lastParams()).toMatchObject({ category: "can-ho", province: "ha-noi" });
    expect(currentTabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue/danh-muc/can-ho?province=ha-noi"]);
    expect(tabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue?province=ha-noi", "/cho-thue/danh-muc/can-ho?province=ha-noi", "/cho-thue/danh-muc/nha-pho?province=ha-noi"]);
    expect([...screen.getByRole("search").querySelectorAll<HTMLInputElement>("input[type=hidden]")].map((input) => `${input.name}=${input.value}`)).toEqual(["category=can-ho", "province=ha-noi"]);
    expect([...sidebar().querySelectorAll<HTMLInputElement>("form > input[type=hidden]")].map((input) => `${input.name}=${input.value}`)).toEqual(["category=can-ho"]);
  });

  it("link cũ ?category=<danh mục con>: tab của cha được đánh dấu", async () => {
    await render("vi", { category: "can-ho-dich-vu" });
    expect(lastParams()).toMatchObject({ category: "can-ho-dich-vu" });
    expect(currentTabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue/danh-muc/can-ho"]);
  });

  it("?q= rỗng (nút tìm kiếm của header): danh sách không lọc và con trỏ vào ô từ khoá; ?q=studio thì không tự focus", async () => {
    const { unmount } = await render("vi", { q: "" });
    expect(lastParams()).not.toHaveProperty("q");
    expect(document.activeElement).toHaveAttribute("name", "q");
    unmount();
    (document.activeElement as HTMLElement | null)?.blur();
    await render("vi", { q: "studio" });
    expect(lastParams()).toMatchObject({ q: "studio" });
    expect(document.body).toHaveFocus();
  });

  it("phân trang giữ bộ lọc và sắp xếp, trang ≥ 2 có ?page=", async () => {
    search.mockResolvedValue(result(cards, { total: 30, page: 2, totalPages: 3 }));
    await render("vi", { category: "can-ho", sort: "price_desc", page: "2" });
    expect(lastParams()).toMatchObject({ page: 2 });
    const pagination = screen.getAllByRole("navigation").find((nav) => nav.getAttribute("aria-label")?.includes("Phân trang"))!;
    const hrefs = within(pagination).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/cho-thue?category=can-ho&sort=price_desc");
    expect(hrefs).toContain("/cho-thue?category=can-ho&sort=price_desc&page=3");
  });
});

describe("S04 /cho-thue (BL-052): trạng thái", () => {
  it("không có kết quả khi lọc: trạng thái trống + Xoá bộ lọc + Nhận tư vấn + tối đa 3 gợi ý bỏ điều kiện; bộ lọc vẫn hiện; ẩn lưới", async () => {
    search.mockResolvedValue(result([]));
    projectRows.rows = [{ slug: "vinhomes", title: "Vinhomes Ocean Park" }];
    await render("vi", { province: "ha-noi", project: "vinhomes", priceMin: "5000000", bedrooms: "3", q: "x" });
    expect(screen.getByRole("heading", { name: "Không tìm thấy tin phù hợp" })).toBeInTheDocument();
    const empty = screen.getAllByRole("status").find((node) => node.textContent?.includes("Không tìm thấy"))!;
    expect(within(empty).getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/cho-thue");
    expect(within(empty).getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    const suggestions = within(screen.getByTestId("empty-suggestions")).getAllByRole("link");
    expect(suggestions.map((link) => link.textContent)).toEqual(["Từ khoá: “x”", "Hà Nội", "Dự án: Vinhomes Ocean Park"]);
    expect(suggestions[0]).toHaveAttribute("href", "/cho-thue?province=ha-noi&project=vinhomes&priceMin=5000000&bedrooms=3");
    expect(sidebar()).toBeInTheDocument();
    expect(resultsText("0 căn phù hợp")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Danh sách tin cho thuê" })).toBeNull();
  });

  it("chưa có tin nào và không lọc: trạng thái trống thật (không nút xoá bộ lọc)", async () => {
    search.mockResolvedValue(result([]));
    await render("vi");
    expect(screen.getByRole("heading", { name: "Chưa có tin cho thuê nào được đăng." })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("trang vượt số trang → notFound; ?page=abc về trang 1", async () => {
    search.mockResolvedValue(result(cards, { total: 3, page: 5, totalPages: 1 }));
    await expect(render("vi", { page: "5" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    search.mockResolvedValue(result(cards));
    await render("vi", { page: "abc" });
    expect(lastParams()).toMatchObject({ page: 1 });
  });

  it("lỗi truy vấn: khung lỗi role=alert + Thử lại về cùng URL, bộ lọc + tab vẫn hiện (không số đếm), không sập trang", async () => {
    search.mockRejectedValue(new Error("db down"));
    await render("vi", { province: "ha-noi" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Chưa tải được danh sách tin cho thuê.");
    expect(within(alert).getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", "/cho-thue?province=ha-noi");
    expect(sidebar()).toBeInTheDocument();
    expect(tabs().map((tab) => tab.textContent)).toEqual(["Tất cả", "Căn hộ", "Nhà phố"]);
    expect(within(within(sidebar()).getByRole("list", { name: "Tiện ích" })).getAllByRole("listitem")[0]).toHaveTextContent(/^Hồ bơi$/);
  });
});

describe("S04 /cho-thue (BL-052): không JS", () => {
  it("HTML server: form GET bộ lọc có ô name (province, project, priceMin/priceMax, areaMin/areaMax, bedrooms, furnishing, amenities) + input ẩn q/sort + nút 'Áp dụng'; < lg là details", async () => {
    projectRows.rows = [{ slug: "vinhomes", title: "Vinhomes Ocean Park" }];
    const ui = await RentalListPage({ locale: "vi", searchParams: { q: "studio", province: "ha-noi", sort: "price_desc", amenities: "pool" } });
    const host = document.createElement("div");
    host.innerHTML = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        {ui}
      </NextIntlClientProvider>,
    );
    const form = host.querySelector<HTMLFormElement>("aside form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/cho-thue");
    for (const name of ["province", "ward", "project", "priceMin", "priceMax", "areaMin", "areaMax", "bedrooms", "furnishing", "amenities", "q", "sort"]) expect(form.querySelector(`[name=${name}]`), name).not.toBeNull();
    expect(form.querySelector('input[name=province][value="ha-noi"]')).toHaveAttribute("checked");
    expect(form.querySelector('input[name=amenities][value="pool"]')).toHaveAttribute("checked");
    expect(form.querySelector("input[type=number][name=priceMin]")).not.toBeNull();
    expect(form.querySelector("button[type=submit]")).toHaveTextContent("Áp dụng");
    expect(host.querySelector("details form[method=get]")).not.toBeNull();
    expect(host.querySelector("form[role=search]")).toHaveAttribute("action", "/cho-thue");
    expect(host.querySelectorAll("h1")).toHaveLength(1);
  });
});

describe("generateMetadata", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));
  const meta = (searchParams: Record<string, string>, locale: "vi" | "en" = "vi") => buildRentalListMetadata({ locale, searchParams });

  it("trang gốc: index, canonical là chính nó, hreflang vi/en; trang 2 canonical kèm ?page=2", async () => {
    const root = await meta({});
    expect(root.robots).toEqual({ index: true, follow: true });
    expect(root.alternates?.canonical).toBe("https://tami.example/cho-thue");
    expect(root.alternates?.languages).toMatchObject({ vi: "https://tami.example/cho-thue", en: "https://tami.example/en/for-rent" });
    expect((await meta({ page: "2" })).alternates?.canonical).toBe("https://tami.example/cho-thue?page=2");
  });

  it("lọc đúng MỘT tỉnh vẫn index, canonical là chính nó, không khai hreflang (slug khác nhau theo ngôn ngữ)", async () => {
    const result = await meta({ province: "ha-noi" });
    expect(result.robots).toEqual({ index: true, follow: true });
    expect(result.alternates?.canonical).toBe("https://tami.example/cho-thue?province=ha-noi");
    expect(result.alternates?.languages).toBeUndefined();
  });

  it("?category=<slug có thật>: canonical về TRANG DANH MỤC (vi và en), index, không hreflang; slug lạ coi như không có danh mục", async () => {
    const vi = await meta({ category: "can-ho" });
    expect(vi.robots).toEqual({ index: true, follow: true });
    expect(vi.alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho");
    expect(vi.alternates?.languages).toBeUndefined();
    expect((await meta({ category: "can-ho", page: "2" })).alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho?page=2");
    expect((await meta({ category: "can-ho" }, "en")).alternates?.canonical).toBe("https://tami.example/en/for-rent/category/can-ho");
    expect((await meta({ category: "khong-co" })).alternates?.canonical).toBe("https://tami.example/cho-thue");
  });

  it("tổ hợp lọc sâu, tham số mới (dự án, tiện ích) hoặc đổi sắp xếp: noindex, follow và canonical về trang sạch; ô rỗng của form không tính", async () => {
    const deep: Array<Record<string, string>> = [{ q: "studio" }, { priceMax: "5000000" }, { sort: "price_asc" }, { province: "ha-noi", ward: "ba-dinh" }, { bedrooms: "2", page: "3" }, { project: "vinhomes" }, { amenities: "pool" }, { areaMin: "30" }];
    for (const searchParams of deep) {
      const result = await meta(searchParams);
      expect(result.robots, JSON.stringify(searchParams)).toEqual({ index: false, follow: true });
      expect(result.alternates?.canonical).toBe("https://tami.example/cho-thue");
    }
    const withCategory = await meta({ category: "can-ho", province: "ha-noi" });
    expect(withCategory.robots).toEqual({ index: false, follow: true });
    expect(withCategory.alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho");
    expect((await meta({ q: "", province: "", bedrooms: "", priceMin: "" })).robots).toEqual({ index: true, follow: true });
    expect((await meta({ utm_source: "fb" })).robots).toEqual({ index: true, follow: true });
  });
});

describe("S05 /cho-thue/danh-muc/[category]", () => {
  it("lọc tin theo danh mục khoá (SearchService nhận slug, gồm con ở tầng SQL); h1 là tên danh mục; tab của nó aria-current; đúng một h1", async () => {
    await render("vi", {}, "can-ho");
    expect(lastParams()).toMatchObject({ category: "can-ho", locale: "vi", limit: 12, page: 1, available: true });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Căn hộ" })).toBeInTheDocument();
    expect(gridTitles()).toEqual(["Studio Ba Đình", "Căn hộ 2PN", "Nhà phố rộng"]);
    expect(currentTabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue/danh-muc/can-ho"]);
  });

  it("danh mục con: tin lọc theo slug con, tab của cha sáng", async () => {
    await render("vi", {}, "can-ho-dich-vu");
    expect(lastParams()).toMatchObject({ category: "can-ho-dich-vu" });
    expect(screen.getByRole("heading", { level: 1, name: "Căn hộ dịch vụ" })).toBeInTheDocument();
    expect(currentTabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue/danh-muc/can-ho"]);
  });

  it("danh mục khoá: ?category= trên URL bị bỏ qua; bộ lọc + tìm kiếm + Xoá tất cả trỏ về chính trang danh mục; tab giữ lọc khác", async () => {
    await render("vi", { category: "nha-pho", province: "ha-noi", page: "1" }, "can-ho");
    expect(lastParams()).toMatchObject({ category: "can-ho", province: "ha-noi" });
    expect(sidebar().querySelector("form")).toHaveAttribute("action", "/cho-thue/danh-muc/can-ho");
    expect(sidebar().querySelector("input[name=category]")).toBeNull();
    expect(screen.getByRole("search")).toHaveAttribute("action", "/cho-thue/danh-muc/can-ho");
    expect(within(sidebar()).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    expect(tabs().map((tab) => tab.getAttribute("href"))).toEqual(["/cho-thue?province=ha-noi", "/cho-thue/danh-muc/can-ho?province=ha-noi", "/cho-thue/danh-muc/nha-pho?province=ha-noi"]);
  });

  it("phân trang theo đường dẫn danh mục; trang vượt số trang → notFound", async () => {
    search.mockResolvedValue(result(cards, { total: 30, page: 2, totalPages: 3 }));
    await render("vi", { page: "2", sort: "price_desc" }, "can-ho");
    const nav = screen.getAllByRole("navigation").find((item) => item.getAttribute("aria-label")?.includes("Phân trang"))!;
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toContain("/cho-thue/danh-muc/can-ho?sort=price_desc&page=3");
    search.mockResolvedValue(result(cards, { total: 3, page: 9, totalPages: 1 }));
    await expect(render("vi", { page: "9" }, "can-ho")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("slug lạ / xoá mềm / chưa có bản EN → notFound, không truy vấn tin", async () => {
    await expect(render("vi", {}, "khong-co")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(render("en", {}, "nha-pho")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(search).not.toHaveBeenCalled();
  });

  it("/en: tab theo /en/for-rent/category/...", async () => {
    await render("en", {}, "can-ho");
    expect(tabs().map((tab) => tab.getAttribute("href"))).toEqual(["/en/for-rent", "/en/for-rent/category/can-ho"]);
  });

  it("trống thật: 'trong mục này' + link về /cho-thue; trống khi lọc: nút xoá bộ lọc về trang danh mục", async () => {
    search.mockResolvedValue(result([]));
    const { unmount } = await render("vi", {}, "can-ho");
    expect(screen.getByRole("heading", { name: "Chưa có tin cho thuê trong mục này." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Về danh sách" })).toHaveAttribute("href", "/cho-thue");
    unmount();
    await render("vi", { province: "ha-noi" }, "can-ho");
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
  });

  it("FAQ hiện nhưng không phát FAQPage JSON-LD lặp ở trang danh mục", async () => {
    loadListingPageContent.mockResolvedValue({ ...EMPTY_CONTENT, faqs: [{ question: "Hỏi?", answer: "Đáp." }] });
    const { container } = await render("vi", {}, "can-ho");
    expect(screen.getByRole("heading", { level: 2, name: "Câu hỏi thường gặp" })).toBeInTheDocument();
    expect([...container.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent?.includes("FAQPage"))).toBe(false);
  });

  it("lỗi truy vấn: khung lỗi + Thử lại về cùng trang danh mục", async () => {
    search.mockRejectedValue(new Error("db down"));
    await render("vi", { province: "ha-noi" }, "can-ho");
    expect(within(screen.getByRole("alert")).getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho?province=ha-noi");
  });
});

describe("generateMetadata của trang danh mục", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));
  const meta = (searchParams: Record<string, string>, categorySlug: string, locale: "vi" | "en" = "vi") =>
    buildRentalListMetadata({ locale, searchParams, categorySlug });

  it("index, canonical chính nó (kèm ?page=n), hreflang vi/en khi danh mục có EN, title theo tên danh mục", async () => {
    const root = await meta({}, "can-ho");
    expect(root.robots).toEqual({ index: true, follow: true });
    expect(root.title).toBe("Căn hộ | TAMI");
    expect(root.alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho");
    expect(root.alternates?.languages).toMatchObject({
      vi: "https://tami.example/cho-thue/danh-muc/can-ho",
      en: "https://tami.example/en/for-rent/category/apartment",
    });
    expect((await meta({ page: "2" }, "can-ho")).alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho?page=2");
    expect((await meta({}, "can-ho", "en")).alternates?.canonical).toBe("https://tami.example/en/for-rent/category/apartment");
  });

  it("danh mục chưa có bản EN: không khai hreflang", async () => {
    findByID.mockResolvedValue({ slug: { vi: "nha-pho" } });
    expect((await meta({}, "nha-pho")).alternates?.languages).toBeUndefined();
  });

  it("thêm bộ lọc ngoài page hoặc đổi sắp xếp: noindex, follow, canonical về trang danh mục sạch, không hreflang", async () => {
    const noisy: Array<Record<string, string>> = [{ province: "ha-noi" }, { q: "studio" }, { sort: "price_asc" }, { project: "vinhomes" }];
    for (const searchParams of noisy) {
      const result = await meta(searchParams, "can-ho");
      expect(result.robots, JSON.stringify(searchParams)).toEqual({ index: false, follow: true });
      expect(result.alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho");
      expect(result.alternates?.languages).toBeUndefined();
    }
  });

  it("danh mục seo.noindex → noindex; danh mục không có → metadata rỗng (trang tự 404)", async () => {
    findPublicBySlug.mockResolvedValueOnce({ ...categories[0], seo: { noindex: true } });
    expect((await meta({}, "can-ho")).robots).toEqual({ index: false, follow: true });
    expect(await meta({}, "khong-co")).toEqual({});
  });
});

describe("hero trang danh sách (BL-052 ListingHero, ảnh + chữ pageHeroes.rentals)", () => {
  it("có ảnh → biến thể Ảnh (scrim), breadcrumb trong hero, h1 hai dòng; loader gọi đúng key \"rentals\"", async () => {
    loadPageHero.mockResolvedValue({ title: "Căn hộ cho thuê", titleAccent: "sẵn sàng vào ở", description: undefined, image: { url: "/api/media/file/banner.jpg", width: 1600 } });
    const { container } = await render("vi");
    expect(loadPageHero).toHaveBeenCalledWith("vi", "rentals");
    const hero = container.querySelector("[data-hero-size=list]")!;
    expect(hero.contains(screen.getByRole("navigation", { name: /Breadcrumb|đường dẫn/i }))).toBe(true);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Căn hộ cho thuêsẵn sàng vào ở");
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
  });

  it("không có ảnh → hero nền tối cùng chiều cao, không vỡ trang", async () => {
    const { container } = await render("vi");
    expect(container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(container.querySelector("section[data-hero-size=list].bg-dark-deep")).not.toBeNull();
  });

  it("trang danh mục: hero dùng ảnh Cho thuê, eyebrow 'Cho thuê', tiêu đề = tên danh mục, mô tả = mô tả danh mục (không lấy chữ hero của /cho-thue)", async () => {
    loadPageHero.mockResolvedValue({ title: "Chữ hero admin", titleAccent: "dòng vàng", description: "Mô tả hero admin", image: { url: "/api/media/file/banner.jpg", width: 1600 } });
    findPublicBySlug.mockImplementation(async () => ({ ...categories[0], description: "Mô tả danh mục căn hộ" }));
    const { container } = await render("vi", {}, "can-ho");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Căn hộ$/);
    expect(screen.getByText("Mô tả danh mục căn hộ")).toBeInTheDocument();
    expect(screen.queryByText("Mô tả hero admin")).toBeNull();
    expect(screen.getByText("Cho thuê", { selector: "p" })).toBeInTheDocument();
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
  });
});
