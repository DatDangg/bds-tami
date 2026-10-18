import { screen, within } from "@testing-library/react";
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
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const replace = vi.hoisted(() => vi.fn());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({ find: wardsFind }) }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ replace }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/public-queries", () => ({ findPublicList }));
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
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [search, wardsFind, findPublicList, notFound, replace]) mock.mockReset();
});

async function render(locale: "vi" | "en", searchParams: Record<string, string | string[]> = {}) {
  const ui = await RentalListPage({ locale, searchParams });
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
    const count = screen.getByText("3 tin phù hợp");
    expect(count).toHaveAttribute("role", "status");
    expect(count).toHaveAttribute("aria-live", "polite");
    expect(lastParams()).toMatchObject({ locale: "vi", limit: 12, page: 1, sort: "newest", available: true });
    expect(screen.getByRole("link", { name: /Studio Ba Đình/ })).toHaveAttribute("href", "/cho-thue/slug-1");
    expect(screen.queryByText(/Đang lọc/)).toBeNull();
  });

  it("thẻ: giá rút gọn /tháng, 'Thoả thuận' khi không giá, diện tích + phòng ngủ", async () => {
    await render("vi");
    const first = screen.getByRole("link", { name: /Studio Ba Đình/ });
    expect(first).toHaveTextContent("8,5 triệu/tháng");
    expect(first).toHaveTextContent("45 m² · 1 PN");
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
    expect(screen.getByLabelText("Tỉnh/thành", { selector: "#rental-panel-province" })).toHaveValue("ha-noi");
    expect(screen.getByLabelText("Phường/xã", { selector: "#rental-panel-ward" })).toHaveValue("ba-dinh");
    expect(screen.getByLabelText("Giá từ", { selector: "#rental-panel-priceMin" })).toHaveValue(5_000_000);
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

  it("lọc phường phụ thuộc tỉnh: chưa chọn tỉnh thì ô phường bị khoá; danh mục gồm danh mục con (thụt vào)", async () => {
    await render("vi");
    expect(screen.getByLabelText("Phường/xã", { selector: "#rental-panel-ward" })).toBeDisabled();
    const options = within(screen.getByLabelText("Danh mục", { selector: "#rental-panel-category" })).getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["Tất cả danh mục", "Căn hộ", "– Căn hộ dịch vụ", "Nhà phố"]);
  });

  it("chip Loại hình là link ?category= giữ bộ lọc khác và bỏ trang; chip cha sáng khi đang lọc danh mục con", async () => {
    await render("vi", { province: "ha-noi", category: "can-ho-dich-vu", page: "1" });
    const links = within(chipNav()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/cho-thue?province=ha-noi"],
      ["Căn hộ", "/cho-thue?category=can-ho&province=ha-noi"],
      ["Nhà phố", "/cho-thue?category=nha-pho&province=ha-noi"],
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
    expect(screen.getByText("1 listing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Studio Ba Đình/ })).toHaveAttribute("href", "/en/for-rent/slug-1");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en/for-rent", "/en/for-rent?category=can-ho"]);
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
    expect(screen.getByLabelText("Tỉnh/thành", { selector: "#rental-panel-province" })).toBeInTheDocument();
    expect(screen.getByText("0 tin phù hợp")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Tỉnh/thành", { selector: "#rental-panel-province" })).toBeInTheDocument();
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

  it("lọc đúng MỘT danh mục hoặc MỘT tỉnh vẫn index, canonical là chính nó, không khai hreflang (slug khác nhau theo ngôn ngữ)", async () => {
    const single: Array<Record<string, string>> = [{ category: "can-ho" }, { province: "ha-noi" }];
    for (const searchParams of single) {
      const result = await meta(searchParams);
      expect(result.robots).toEqual({ index: true, follow: true });
      expect(result.alternates?.canonical).toBe(`https://tami.example/cho-thue?${new URLSearchParams(searchParams)}`);
      expect(result.alternates?.languages).toBeUndefined();
    }
    expect((await meta({ category: "can-ho" }, "en")).alternates?.canonical).toBe("https://tami.example/en/for-rent?category=can-ho");
  });

  it("tổ hợp lọc sâu hoặc đổi sắp xếp: noindex, follow và canonical về trang sạch; ô rỗng của form không tính", async () => {
    const deep: Array<Record<string, string>> = [{ category: "can-ho", province: "ha-noi" }, { q: "studio" }, { priceMax: "5000000" }, { sort: "price_asc" }, { province: "ha-noi", ward: "ba-dinh" }, { bedrooms: "2", page: "3" }];
    for (const searchParams of deep) {
      const result = await meta(searchParams);
      expect(result.robots, JSON.stringify(searchParams)).toEqual({ index: false, follow: true });
      expect(result.alternates?.canonical).toBe("https://tami.example/cho-thue");
    }
    expect((await meta({ q: "", province: "" })).robots).toEqual({ index: true, follow: true });
    expect((await meta({ utm_source: "fb" })).robots).toEqual({ index: true, follow: true });
  });
});
