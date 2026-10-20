import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
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
const provinces = [province("p1", "Hà Nội", "ha-noi"), province("p2", "Hồ Chí Minh", "ho-chi-minh")];
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
  publishedAt: now,
  ...extra,
});
const cards = [card("1", "Studio Ba Đình"), card("2", "Căn hộ 2PN", { bedrooms: 2, priceMonthlyVnd: null, priceNegotiable: true }), card("3", "Nhà phố rộng", { bedrooms: null })];

const search = vi.hoisted(() => vi.fn<(params: RentalSearchParams) => Promise<RentalSearchResult>>());
const wardsFind = vi.hoisted(() => vi.fn());
const findPublicList = vi.hoisted(() => vi.fn());
const findPublicBySlug = vi.hoisted(() => vi.fn());
const findByID = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const replace = vi.hoisted(() => vi.fn());
const loadPageBanner = vi.hoisted(() => vi.fn<(locale: string, key: string) => Promise<{ url: string; width: number } | undefined>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({ find: wardsFind, findByID }) }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ replace }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageBanner }));
vi.mock("@/lib/content/public-queries", () => ({ findPublicList, findPublicBySlug }));
vi.mock("@/lib/projects/project-queries", () => ({ listProvinces: async () => provinces }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/search/search-service", () => ({
  PostgresRentalSearch: class {
    search = search;
  },
  sqlExecutorOf: () => ({}),
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

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  search.mockResolvedValue(result(cards));
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
  for (const mock of [search, wardsFind, findPublicList, findPublicBySlug, findByID, notFound, replace]) mock.mockReset();
});

async function render(locale: "vi" | "en", searchParams: Record<string, string | string[]> = {}, categorySlug?: string) {
  const ui = await RentalListPage({ locale, searchParams, ...(categorySlug ? { categorySlug } : {}) });
  return renderWithIntl(ui, locale);
}
const cardTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const chipNav = () => screen.getByRole("navigation", { name: /Loại hình|Property type/ });
const lastParams = (): RentalSearchParams => search.mock.calls.at(-1)![0];

describe("S04 /cho-thue: render", () => {
  it("không lọc: một h1, thẻ là h2, đếm kết quả aria-live, gọi SearchService chỉ tin còn trống 12/trang theo ngôn ngữ", async () => {
    await render("vi");
    expect(screen.getByRole("heading", { level: 1, name: "Cho thuê" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Studio Ba Đình", "Căn hộ 2PN", "Nhà phố rộng"]);
    const count = screen.getByText("Có 3 kết quả");
    expect(count).toHaveAttribute("role", "status");
    expect(count).toHaveAttribute("aria-live", "polite");
    expect(lastParams()).toMatchObject({ locale: "vi", limit: 12, page: 1, sort: "newest", available: true });
    expect(screen.getByRole("link", { name: /Studio Ba Đình/ })).toHaveAttribute("href", "/cho-thue/slug-1");
    expect(screen.queryByText(/Đang lọc/)).toBeNull();
  });

  it("bố cục market: banner compact 240px, băng tìm kiếm đè mép banner, breadcrumb rồi 'Có N kết quả' + Sắp xếp cùng hàng, lưới 1/2/3/4 cột", async () => {
    loadPageBanner.mockResolvedValueOnce({ url: "/api/media/file/banner.jpg", width: 1600 });
    const { container } = await render("vi");
    expect(container.querySelector("section")?.className).toContain("h-60");
    const form = screen.getByRole("search");
    expect(form.parentElement?.className).toContain("-mt-12");
    const breadcrumb = screen.getByRole("navigation", { name: /Breadcrumb|đường dẫn/i });
    expect(form.compareDocumentPosition(breadcrumb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const count = screen.getByRole("status", { name: "" });
    expect(count.parentElement).toContainElement(screen.getByLabelText("Sắp xếp"));
    expect(breadcrumb.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const grid = screen.getAllByRole("list").find((list) => list.className.includes("grid"))!;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("sm:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
    expect(grid.className).toContain("xl:grid-cols-4");
  });

  it("không có kết quả thì không hiện ô Sắp xếp", async () => {
    search.mockResolvedValue(result([]));
    await render("vi");
    expect(screen.queryByLabelText("Sắp xếp")).toBeNull();
  });

  it("thẻ: giá rút gọn /tháng, 'Thoả thuận' khi không giá, diện tích + phòng ngủ", async () => {
    await render("vi");
    const first = screen.getByRole("link", { name: /Studio Ba Đình/ });
    expect(first).toHaveTextContent("8,5 triệu/tháng");
    expect(first).toHaveTextContent("45 m²");
    expect(first).toHaveTextContent("1 PN");
    expect(screen.getByRole("link", { name: /Căn hộ 2PN/ })).toHaveTextContent("Thoả thuận");
    expect(screen.getByRole("link", { name: /Nhà phố rộng/ })).toHaveTextContent("45 m²");
    expect(screen.getByRole("link", { name: /Nhà phố rộng/ })).not.toHaveTextContent("PN");
  });

  it("mọi bộ lọc từ URL đến SearchService; tham số lạ bị bỏ qua; ô lọc phản ánh URL", async () => {
    await render("vi", {
      q: "studio quan 1",
      category: "can-ho",
      province: "ha-noi",
      ward: "ba-dinh",
      priceMin: "5000000",
      priceMax: "15000000",
      areaMin: "25",
      bedrooms: "2",
      furnishing: "full",
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
      category: "can-ho",
      province: "ha-noi",
      ward: "ba-dinh",
      priceMin: 5_000_000,
      priceMax: 15_000_000,
      areaMin: 25,
      bedrooms: 2,
      furnishing: "full",
      sort: "price_asc",
    });
    expect(screen.getByRole("heading", { level: 2, name: "Kết quả cho “studio quan 1”" })).toBeInTheDocument();
    // Băng tìm kiếm phản ánh URL: từ khoá, Loại, Khoảng giá (5-15 triệu không trùng mốc nào → "tuỳ chọn"); lọc phụ nằm trong form dưới dạng tham số giữ lại + huy hiệu (gồm cả khoảng giá tự nhập).
    expect(screen.getByLabelText("Từ khoá")).toHaveValue("studio quan 1");
    expect(screen.getByLabelText("Danh mục")).toHaveTextContent("Căn hộ");
    expect(screen.getByLabelText("Giá/tháng (VNĐ)")).toHaveTextContent("Khoảng giá tuỳ chọn");
    expect(screen.getByRole("button", { name: "Bộ lọc (6)" })).toBeInTheDocument();
    const form = screen.getByRole("search");
    expect(form.querySelector("input[name=province]")).toHaveValue("ha-noi");
    expect(form.querySelector("input[name=ward]")).toHaveValue("ba-dinh");
  });

  it("phường chỉ tải của tỉnh trên URL; phường không thuộc tỉnh, slug danh mục/tỉnh lạ bị bỏ (danh sách không lọc, không 404)", async () => {
    await render("vi", { province: "ha-noi", ward: "khong-co", category: "khong-co" });
    expect(lastParams()).not.toHaveProperty("ward");
    expect(lastParams()).not.toHaveProperty("category");
    expect(lastParams()).toMatchObject({ province: "ha-noi" });
    expect(wardsFind).toHaveBeenCalledTimes(1);
    expect(wardsFind.mock.calls[0]![0]).toMatchObject({ collection: "wards", where: { province: { equals: "p1" } }, overrideAccess: false });
  });

  it("tỉnh lạ: bỏ tỉnh và phường, không tải phường", async () => {
    await render("vi", { province: "khong-co", ward: "ba-dinh" });
    expect(lastParams()).not.toHaveProperty("province");
    expect(lastParams()).not.toHaveProperty("ward");
    expect(wardsFind).not.toHaveBeenCalled();
  });

  it("ô Loại của băng gồm danh mục con (thụt vào)", async () => {
    await render("vi");
    await userEvent.setup().click(screen.getByLabelText("Danh mục", { selector: "#rental-bar-category" }));
    const options = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(options).toEqual(["Tất cả danh mục", "Căn hộ", "– Căn hộ dịch vụ", "Nhà phố"]);
  });

  it("chip Loại hình là link tới TRANG DANH MỤC giữ bộ lọc khác và bỏ trang; chip cha sáng khi đang lọc danh mục con", async () => {
    await render("vi", { province: "ha-noi", category: "can-ho-dich-vu", page: "1" });
    const links = within(chipNav()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/cho-thue?province=ha-noi"],
      ["Căn hộ", "/cho-thue/danh-muc/can-ho?province=ha-noi"],
      ["Nhà phố", "/cho-thue/danh-muc/nha-pho?province=ha-noi"],
    ]);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Căn hộ"]);
  });

  it("?q= (link từ nút tìm kiếm của header): danh sách không lọc và con trỏ vào ô từ khoá; ?q=studio thì không tự focus", async () => {
    const { unmount } = await render("vi", { q: "" });
    expect(lastParams()).not.toHaveProperty("q");
    expect(document.activeElement).toHaveAttribute("type", "search");
    unmount();
    (document.activeElement as HTMLElement | null)?.blur();
    await render("vi", { q: "studio" });
    expect(lastParams()).toMatchObject({ q: "studio" });
    expect(document.body).toHaveFocus();
  });

  it("hàng 'Đang lọc': chip từng điều kiện có nhãn 'Bỏ lọc <tên>' trỏ tới URL đã bỏ điều kiện đó; Xoá tất cả về /cho-thue", async () => {
    await render("vi", { province: "ha-noi", ward: "ba-dinh", priceMin: "5000000", bedrooms: "2", sort: "price_asc" });
    expect(screen.getByRole("link", { name: "Bỏ lọc Hà Nội" })).toHaveAttribute("href", "/cho-thue?priceMin=5000000&bedrooms=2&sort=price_asc");
    expect(screen.getByRole("link", { name: "Bỏ lọc Phường Ba Đình" })).toHaveAttribute("href", "/cho-thue?province=ha-noi&priceMin=5000000&bedrooms=2&sort=price_asc");
    expect(screen.getByRole("link", { name: "Bỏ lọc Giá: từ 5 triệu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bỏ lọc Phòng ngủ: 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/cho-thue");
  });

  it("Tiện ích (BL-044): ?amenities=pool,gym → SearchService nhận mảng; 'Đang lọc' một chip mỗi tiện ích bỏ riêng; huy hiệu Bộ lọc đếm 2", async () => {
    await render("vi", { amenities: "pool,gym,foo" });
    expect(search.mock.calls.at(-1)?.[0].amenities).toEqual(["pool", "gym"]);
    expect(screen.getByRole("link", { name: "Bỏ lọc Tiện ích: Hồ bơi" })).toHaveAttribute("href", "/cho-thue?amenities=gym");
    expect(screen.getByRole("link", { name: "Bỏ lọc Tiện ích: Phòng gym" })).toHaveAttribute("href", "/cho-thue?amenities=pool");
    expect(screen.getByRole("button", { name: "Bộ lọc (2)" })).toBeInTheDocument();
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

  it("/en: nhãn tiếng Anh, link /en/for-rent, danh mục chỉ có bản EN, 'listing(s)'", async () => {
    search.mockResolvedValue(result([cards[0]!]));
    await render("en", { category: "can-ho" });
    expect(lastParams()).toMatchObject({ locale: "en" });
    expect(screen.getByRole("heading", { level: 1, name: "For rent" })).toBeInTheDocument();
    expect(screen.getByText("1 result")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Studio Ba Đình/ })).toHaveAttribute("href", "/en/for-rent/slug-1");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en/for-rent", "/en/for-rent/category/can-ho"]);
  });
});

describe("S04 /cho-thue: trạng thái", () => {
  it("không có kết quả khi lọc: trạng thái trống + Xoá bộ lọc + Nhận tư vấn + tối đa 3 gợi ý bỏ điều kiện; bộ lọc vẫn hiện; ẩn lưới", async () => {
    search.mockResolvedValue(result([]));
    await render("vi", { province: "ha-noi", priceMin: "5000000", bedrooms: "3", furnishing: "full", q: "x" });
    expect(screen.getByRole("heading", { name: "Không tìm thấy tin phù hợp" })).toBeInTheDocument();
    const empty = screen.getAllByRole("status").find((node) => node.textContent?.includes("Không tìm thấy"))!;
    expect(within(empty).getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/cho-thue");
    expect(within(empty).getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    const suggestions = within(screen.getByTestId("empty-suggestions")).getAllByRole("link");
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toHaveAttribute("href", "/cho-thue?province=ha-noi&priceMin=5000000&bedrooms=3&furnishing=full");
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByText("Có 0 kết quả")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Studio Ba Đình/ })).toBeNull();
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

  it("lỗi truy vấn: khung lỗi role=alert + Thử lại về cùng URL, bộ lọc vẫn hiện, không sập trang", async () => {
    search.mockRejectedValue(new Error("db down"));
    await render("vi", { province: "ha-noi" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Chưa tải được danh sách tin cho thuê.");
    expect(within(alert).getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", "/cho-thue?province=ha-noi");
    expect(screen.getByRole("search")).toBeInTheDocument();
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

  it("tổ hợp lọc sâu hoặc đổi sắp xếp: noindex, follow và canonical về trang sạch; ô rỗng của form không tính", async () => {
    const deep: Array<Record<string, string>> = [{ q: "studio" }, { priceMax: "5000000" }, { sort: "price_asc" }, { province: "ha-noi", ward: "ba-dinh" }, { bedrooms: "2", page: "3" }];
    for (const searchParams of deep) {
      const result = await meta(searchParams);
      expect(result.robots, JSON.stringify(searchParams)).toEqual({ index: false, follow: true });
      expect(result.alternates?.canonical).toBe("https://tami.example/cho-thue");
    }
    const withCategory = await meta({ category: "can-ho", province: "ha-noi" });
    expect(withCategory.robots).toEqual({ index: false, follow: true });
    expect(withCategory.alternates?.canonical).toBe("https://tami.example/cho-thue/danh-muc/can-ho");
    expect((await meta({ q: "", province: "" })).robots).toEqual({ index: true, follow: true });
    expect((await meta({ utm_source: "fb" })).robots).toEqual({ index: true, follow: true });
  });
});

describe("S05 /cho-thue/danh-muc/[category]", () => {
  it("lọc tin theo danh mục khoá (SearchService nhận slug, gồm con ở tầng SQL); h1 là tên danh mục; đúng một h1", async () => {
    await render("vi", {}, "can-ho");
    expect(lastParams()).toMatchObject({ category: "can-ho", locale: "vi", limit: 12, page: 1, available: true });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Căn hộ" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Studio Ba Đình", "Căn hộ 2PN", "Nhà phố rộng"]);
  });

  it("danh mục con: tin lọc theo slug con, chip của cha sáng", async () => {
    await render("vi", {}, "can-ho-dich-vu");
    expect(lastParams()).toMatchObject({ category: "can-ho-dich-vu" });
    expect(screen.getByRole("heading", { level: 1, name: "Căn hộ dịch vụ" })).toBeInTheDocument();
    const current = within(chipNav()).getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.getAttribute("href"))).toEqual(["/cho-thue/danh-muc/can-ho"]);
  });

  it("danh mục khoá: không có ô lọc Danh mục, ?category= trên URL bị bỏ qua; bộ lọc khác giữ và trỏ về chính trang danh mục", async () => {
    await render("vi", { category: "nha-pho", province: "ha-noi", page: "1" }, "can-ho");
    expect(lastParams()).toMatchObject({ category: "can-ho", province: "ha-noi" });
    expect(screen.queryByLabelText("Danh mục")).toBeNull();
    expect(screen.getByRole("link", { name: "Bỏ lọc Hà Nội" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    expect(screen.getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/cho-thue/danh-muc/can-ho");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/cho-thue?province=ha-noi",
      "/cho-thue/danh-muc/can-ho?province=ha-noi",
      "/cho-thue/danh-muc/nha-pho?province=ha-noi",
    ]);
  });

  it("phân trang theo đường dẫn danh mục; trang vượt số trang → notFound", async () => {
    search.mockResolvedValue(result(cards, { total: 30, page: 2, totalPages: 3 }));
    await render("vi", { page: "2", sort: "price_desc" }, "can-ho");
    const pagination = screen.getAllByRole("navigation").find((nav) => nav.getAttribute("aria-label")?.includes("Phân trang"))!;
    expect(within(pagination).getAllByRole("link").map((link) => link.getAttribute("href"))).toContain("/cho-thue/danh-muc/can-ho?sort=price_desc&page=3");
    search.mockResolvedValue(result(cards, { total: 3, page: 9, totalPages: 1 }));
    await expect(render("vi", { page: "9" }, "can-ho")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("slug lạ / xoá mềm / chưa có bản EN → notFound, không truy vấn tin", async () => {
    await expect(render("vi", {}, "khong-co")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(render("en", {}, "nha-pho")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(search).not.toHaveBeenCalled();
  });

  it("/en: link chip theo /en/for-rent/category/...", async () => {
    await render("en", {}, "can-ho");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en/for-rent", "/en/for-rent/category/can-ho"]);
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
    const noisy: Array<Record<string, string>> = [{ province: "ha-noi" }, { q: "studio" }, { sort: "price_asc" }];
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

describe("ảnh banner trang danh sách (FR-ADM-20)", () => {
  afterEach(() => loadPageBanner.mockReset());

  it("có ảnh → biến thể Ảnh (scrim riêng), loader gọi đúng key \"rentals\"", async () => {
    loadPageBanner.mockResolvedValue({ url: "/api/media/file/banner.jpg", width: 1600 });
    const { container } = await render("vi");
    expect(loadPageBanner).toHaveBeenCalledWith("vi", "rentals");
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
    expect(container.querySelector("section.bg-dark-deep img")).not.toBeNull();
  });

  it("không có ảnh (hoặc đọc lỗi) → banner chữ như trước", async () => {
    loadPageBanner.mockResolvedValue(undefined);
    const { container } = await render("vi");
    expect(container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(container.querySelector("section.bg-bg-alt")).not.toBeNull();
  });
});
