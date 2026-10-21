import { screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import vi_messages from "@/i18n/messages/vi.json";
import { buildPredicates, compareByPrice, computeFacets, matcher } from "@/lib/projects/project-list-facets";
import type { ProjectPageQuery } from "@/lib/projects/project-queries";
import type { Category, Media, Project, Province } from "@/payload-types";

const now = "2026-01-01T00:00:00.000Z";
const category = (id: string, name: string, slug: string, overrides: Partial<Category> = {}): Category => ({ id, name, slug, scope: "project", hasEnglish: false, updatedAt: now, createdAt: now, ...overrides });
const province = (id: string, name: string, slug: string, sortOrder: number): Province => ({ id, code: id, name, shortName: name, slug, sortOrder, updatedAt: now, createdAt: now });
const media = (id: string): Media => ({ id, alt: id, url: `/api/media/file/${id}.webp`, width: 1600, updatedAt: now, createdAt: now });

const apartments = category("c1", "Căn hộ chung cư", "can-ho-chung-cu", { hasEnglish: true });
const urban = category("c2", "Khu đô thị", "khu-do-thi");
const luxury = category("c3", "Căn hộ cao cấp", "can-ho-cao-cap", { parent: apartments });
const hanoi = province("p1", "Hà Nội", "ha-noi", 1);
const danang = province("p2", "Đà Nẵng", "da-nang", 2);
const hue = province("p3", "Huế", "hue", 3);

interface Fixture {
  doc: Project;
  hasEnglish: boolean;
}
const fixture = (id: string, title: string, extra: Partial<Project>, hasEnglish = true): Fixture => ({
  hasEnglish,
  doc: { id, title, slug: `slug-${id}`, summary: "s", status: "published", salesStatus: "selling", gallery: [media(`m${id}`)], author: "a", updatedAt: now, createdAt: now, ...extra } as Project,
});
const fixtures: Fixture[] = [
  fixture("1", "Sông Sài Gòn", { category: apartments, province: hanoi, productTypes: ["apartment"], featuredAmenities: ["near_school"], priceFromVnd: 3e9, developer: "dev1" }),
  fixture("2", "Tây Hồ", { category: urban, province: hanoi, salesStatus: "upcoming", productTypes: ["villa", "townhouse"], priceFromVnd: 9e9 }),
  fixture("3", "Biển Đà Nẵng", { category: luxury, province: danang, productTypes: ["apartment"], featuredAmenities: ["near_school", "water_view"] }, false),
  fixture("4", "Crown Bắc Ninh", { category: apartments, province: danang, isFeatured: true, priceFromVnd: 5.4e9, address: "P. Hương Trà" }),
];

const listPublicProjects = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const loadPageHero = vi.hoisted(() => vi.fn());
const loadProjectStrengths = vi.hoisted(() => vi.fn<(locale: string) => Promise<unknown>>());
const loadListingPageContent = vi.hoisted(() => vi.fn());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageHero }));
vi.mock("@/lib/content/load-project-strengths", () => ({ loadProjectStrengths }));
vi.mock("@/lib/content/load-listing-page", () => ({ loadListingPageContent }));
// ConsultBanner là Server Component bất đồng bộ đọc homepage (server-only): đã có test riêng.
vi.mock("@/components/layout/ConsultBanner", () => ({ ConsultBanner: () => <aside data-testid="consult-banner" /> }));
vi.mock("@/lib/projects/project-queries", () => ({
  listProvinces: async () => [hanoi, danang, hue],
  listRootProjectCategories: async (_payload: unknown, locale: string) => ({ docs: [apartments, urban].filter((item) => locale === "vi" || item.hasEnglish) }),
  listChildProjectCategories: async (_payload: unknown, _locale: string, parentId: string) => ({ docs: parentId === "c1" ? [luxury] : [] }),
  listDevelopersWithPublicProjects: async () => [{ id: "dev1", name: "Vinhomes" }, { id: "dev2", name: "Ecopark" }],
  findProjectCategoryBySlug: async (_payload: unknown, locale: string, slug: string) => {
    const found = [apartments, urban, luxury].find((item) => item.slug === slug);
    return found && (locale === "vi" || found.hasEnglish) ? found : null;
  },
  listPublicProjects,
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) => createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import { ProjectListPage, buildProjectListMetadata } from "./ProjectListPage";

/** Ngữ nghĩa `listPublicProjects` thật (lọc / đếm / nổi bật dùng chính `project-list-facets`; truy vấn DB kiểm ở tests/integration/projects.test.ts). */
listPublicProjects.mockImplementation(async (_payload: unknown, locale: string, query: ProjectPageQuery) => {
  const scanned = fixtures.filter((item) => locale === "vi" || item.hasEnglish).map((item) => item.doc);
  const predicates = buildPredicates(query);
  const matched = scanned.filter(matcher(predicates));
  const featured = matched.filter((doc) => doc.isFeatured);
  const rest = matched.filter((doc) => !doc.isFeatured);
  const ordered = query.sort && query.sort !== "newest" ? [...rest].sort(compareByPrice(query.sort)) : rest;
  return {
    docs: ordered,
    page: query.page,
    limit: 12,
    totalDocs: matched.length,
    totalPages: Math.max(1, Math.ceil(ordered.length / 12)),
    hasNextPage: false,
    hasPrevPage: false,
    featured: query.page === 1 ? featured : [],
    facets: computeFacets(scanned, predicates),
  };
});

const EMPTY_CONTENT = { quickSearch: [], learnMore: null, faqs: [], showStrengths: true };

async function render(locale: "vi" | "en", searchParams: Record<string, string> = {}) {
  return renderWithIntl(await ProjectListPage({ locale, searchParams }), locale);
}
const grid = () => screen.getByRole("region", { name: /Danh sách dự án|Project list/ });
const gridTitles = () => within(grid()).getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const tabs = () => within(screen.getByRole("navigation", { name: /Danh mục dự án|Project categories/ })).getAllByRole("link");
const sidebar = () => screen.getByRole("complementary", { name: /Bộ lọc|Filters/ });
const lastQuery = () => listPublicProjects.mock.lastCall?.[2];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  loadPageHero.mockImplementation(async (locale: string) => ({ title: locale === "vi" ? "Dự án" : "Projects", description: "Mô tả hero", image: undefined }));
  loadProjectStrengths.mockResolvedValue(null);
  loadListingPageContent.mockResolvedValue(EMPTY_CONTENT);
});
afterEach(() => {
  vi.unstubAllEnvs();
  listPublicProjects.mockClear();
  notFound.mockClear();
});

describe("S02 /du-an (BL-052): bố cục", () => {
  it("hero (1 h1, ô tìm q) → tab danh mục (icon + số) → cột lọc → nổi bật → 'N dự án phù hợp' → lưới 3 cột → banner tư vấn", async () => {
    const { container } = await render("vi");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const search = screen.getByRole("search", { name: "Tìm kiếm trong danh sách" });
    expect(search).toHaveAttribute("action", "/du-an");
    expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
      ["Tất cả4 dự án", "/du-an"],
      ["Căn hộ chung cư3 dự án", "/du-an?category=can-ho-chung-cu"],
      ["Khu đô thị1 dự án", "/du-an?category=khu-do-thi"],
    ]);
    expect(tabs()[0]).toHaveAttribute("aria-current", "page");
    const spotlight = screen.getByRole("region", { name: "Dự án nổi bật" });
    expect(within(spotlight).getByRole("heading", { name: "Crown Bắc Ninh" })).toBeInTheDocument();
    expect(gridTitles()).toEqual(["Sông Sài Gòn", "Tây Hồ", "Biển Đà Nẵng"]);
    const results = screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "4 dự án phù hợp");
    expect(results).toHaveAttribute("aria-live", "polite");
    expect(container.querySelector("[data-grid-max-cols]")).toHaveClass("md:grid-cols-2", "lg:grid-cols-3");
    const order = [search, tabs()[0]!, sidebar(), spotlight, results, grid(), screen.getByTestId("consult-banner")];
    order.slice(1).forEach((element, index) => expect(order[index]!.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
  });

  it("cột lọc: Tình trạng (chip) · Tỉnh/thành (ô tích + số, tỉnh có dự án) · Chủ đầu tư · Mức giá · Loại hình · Tiện ích; 'Xoá tất cả' → /du-an", async () => {
    await render("vi");
    const aside = sidebar();
    const groups = within(aside).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent);
    expect(groups).toEqual(["Tình trạng", "Tỉnh / thành", "Chủ đầu tư", "Mức giá", "Loại hình", "Tiện ích nổi bật"]);
    expect(within(aside).getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual(["Tất cả", "Đang mở bán", "Sắp mở bán", "Đã bàn giao"]);
    const provinces = within(aside).getByRole("list", { name: "Tỉnh / thành" });
    expect(within(provinces).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Hà Nội(2)", "Đà Nẵng(2)"]);
    expect(within(aside).getByRole("checkbox", { name: /Căn hộ/ }).closest("label")).toHaveTextContent("Căn hộ(2)");
    expect(within(aside).getAllByRole("slider")).toHaveLength(2);
    expect(within(aside).getByRole("link", { name: "Xoá tất cả" })).toHaveAttribute("href", "/du-an");
  });

  it("dải Điểm mạnh (khi loader trả khối) sau lưới, trước banner; Tìm hiểu thêm + FAQ nằm trước dải; FAQ JSON-LD chỉ ở trang sạch", async () => {
    loadProjectStrengths.mockResolvedValue({ kind: "strengths", items: [{ icon: "shield-check", title: "Pháp lý rõ ràng", description: null }, { icon: "headset", title: "Tư vấn", description: null }] });
    loadListingPageContent.mockResolvedValue({ ...EMPTY_CONTENT, quickSearch: ["Đông Anh"], learnMore: { title: "Chọn dự án", eyebrow: "Tìm hiểu thêm" }, faqs: [{ question: "Hỏi?", answer: "Đáp." }] });
    const { container, unmount } = await render("vi");
    const strengths = screen.getByRole("region", { name: "Điểm mạnh" });
    const faq = screen.getByRole("heading", { level: 2, name: "Câu hỏi thường gặp" });
    expect(screen.getByRole("heading", { level: 2, name: "Chọn dự án" })).toBeInTheDocument();
    expect(grid().compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(faq.compareDocumentPosition(strengths) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(strengths.compareDocumentPosition(screen.getByTestId("consult-banner")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Đông Anh" })).toHaveAttribute("href", "/du-an?q=%C4%90%C3%B4ng+Anh");
    expect([...container.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent?.includes("FAQPage"))).toBe(true);
    expect(loadListingPageContent).toHaveBeenCalledWith("vi", "projects");
    unmount();
    const filtered = await render("vi", { province: "ha-noi" });
    expect([...filtered.container.querySelectorAll('script[type="application/ld+json"]')].some((script) => script.textContent?.includes("FAQPage"))).toBe(false);
  });

  it("trang 2: không thẻ nổi bật; trang vượt số trang → notFound; ?page=abc về trang 1", async () => {
    await expect(render("vi", { page: "5" })).rejects.toThrow("NEXT_NOT_FOUND");
    await render("vi", { page: "abc" });
    expect(lastQuery()).toEqual({ page: 1 });
  });
});

describe("S02 /du-an (BL-052): tham số URL", () => {
  it("lọc nhiều tham số: truy vấn nhận đúng giá trị đã đối chiếu; ô tích / chip / badge theo URL; tỉnh lạ bị bỏ", async () => {
    await render("vi", { province: "ha-noi,khong-co", status: "selling", type: "apartment", feature: "near_school", priceMin: "2", priceMax: "8", developer: "dev1" });
    expect(lastQuery()).toEqual({ page: 1, provinceIds: ["p1"], salesStatus: "selling", developerId: "dev1", types: ["apartment"], features: ["near_school"], priceMin: 2, priceMax: 8 });
    expect(gridTitles()).toEqual(["Sông Sài Gòn"]);
    const aside = sidebar();
    expect(within(aside).getByRole("checkbox", { name: /Hà Nội/ })).toBeChecked();
    expect(within(aside).getByRole("radio", { name: "Đang mở bán" })).toBeChecked();
    expect(within(aside).getByRole("checkbox", { name: /Gần trường học/ })).toBeChecked();
    expect(within(aside).getAllByRole("slider").map((slider) => slider.getAttribute("aria-valuetext"))).toEqual(["2 tỷ", "8 tỷ"]);
    // Badge < lg: tỉnh 1 + tình trạng + chủ đầu tư + loại + tiện ích + khoảng giá = 6.
    expect(screen.getByRole("button", { name: "Bộ lọc (6)" })).toBeInTheDocument();
    // Số đếm "trừ chính chiều đó": Đà Nẵng đếm theo các lọc khác, không theo tỉnh đang chọn.
    expect(within(aside).getByRole("checkbox", { name: /Đà Nẵng/ }).closest("label")).toHaveTextContent("(0)");
  });

  it("link /du-an?category=<slug> (trang chủ / link cũ) → tab đó được đánh dấu; tab giữ lọc khác, bỏ trang", async () => {
    await render("vi", { category: "khu-do-thi", province: "ha-noi", page: "1" });
    expect(lastQuery()).toEqual({ page: 1, categoryIds: ["c2"], provinceIds: ["p1"] });
    expect(tabs().filter((tab) => tab.getAttribute("aria-current") === "page").map((tab) => tab.textContent)).toEqual(["Khu đô thị1 dự án"]);
    expect(tabs().map((tab) => tab.getAttribute("href"))).toEqual(["/du-an?province=ha-noi", "/du-an?category=can-ho-chung-cu&province=ha-noi", "/du-an?category=khu-do-thi&province=ha-noi"]);
  });

  it("danh mục cấp 1 gồm danh mục con; cấp 2 đánh dấu tab cha, chỉ lọc chính nó; slug lạ bị bỏ", async () => {
    (await render("vi", { category: "can-ho-chung-cu" })).unmount();
    expect(lastQuery()).toEqual({ page: 1, categoryIds: ["c1", "c3"] });
    const second = await render("vi", { category: "can-ho-cao-cap" });
    expect(lastQuery()).toEqual({ page: 1, categoryIds: ["c3"] });
    expect(tabs().find((tab) => tab.getAttribute("aria-current") === "page")).toHaveTextContent("Căn hộ chung cư");
    second.unmount();
    await render("vi", { category: "khong-co" });
    expect(lastQuery()).toEqual({ page: 1 });
  });

  it("q, sort, developer lạ: q + sort xuống truy vấn, developer lạ bỏ; ô tìm hero giữ q; sắp xếp giữ lọc", async () => {
    const { container } = await render("vi", { q: "sông", sort: "price_desc", developer: "khong-co", category: "can-ho-chung-cu" });
    expect(lastQuery()).toEqual({ page: 1, categoryIds: ["c1", "c3"], q: "sông", sort: "price_desc" });
    expect(screen.getByRole("searchbox", { name: "Từ khoá" })).toHaveValue("sông");
    // Form hero giữ danh mục + sắp xếp bằng input ẩn; form bộ lọc giữ q + sort + danh mục.
    expect([...screen.getByRole("search").querySelectorAll<HTMLInputElement>("input[type=hidden]")].map((input) => `${input.name}=${input.value}`)).toEqual(["category=can-ho-chung-cu", "sort=price_desc"]);
    const filterForm = sidebar().querySelector("form")!;
    expect([...filterForm.querySelectorAll<HTMLInputElement>(":scope > input[type=hidden]")].map((input) => input.name)).toEqual(["category", "q", "sort"]);
    expect(screen.getByLabelText("Sắp xếp theo")).toHaveTextContent("Giá giảm dần");
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("lọc không ra: EmptyState có 'Xoá bộ lọc' + 'Nhận tư vấn', bộ lọc vẫn hiện, không lưới / sắp xếp", async () => {
    await render("vi", { province: "da-nang", status: "upcoming" });
    expect(screen.getByText("Chưa có dự án phù hợp.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    expect(sidebar()).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Danh sách dự án" })).toBeNull();
    expect(screen.queryByLabelText("Sắp xếp theo")).toBeNull();
  });

  it("/en: chỉ dự án có EN, tab chỉ danh mục có EN, nhãn tiếng Anh, link /en/projects", async () => {
    await render("en");
    expect(lastQuery()).toEqual({ page: 1 });
    expect(gridTitles()).toEqual(["Sông Sài Gòn", "Tây Hồ"]);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
      ["All3 projects", "/en/projects"],
      ["Căn hộ chung cư2 projects", "/en/projects?category=can-ho-chung-cu"],
    ]);
    expect(within(sidebar()).getAllByRole("group").map((group) => group.querySelector("legend")?.textContent)).toEqual(["Status", "Province / city", "Developer", "Price", "Property type", "Key amenities"]);
    expect(screen.getByRole("region", { name: "Featured projects" })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "3 projects found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sông Sài Gòn/ })).toHaveAttribute("href", "/en/projects/slug-1");
  });
});

describe("S02 /du-an (BL-052): không JS", () => {
  it("HTML server: form GET bộ lọc có ô name (status, province, developer, priceMin/priceMax, type, feature) + input ẩn + nút 'Áp dụng'; < lg là details", async () => {
    const ui = await ProjectListPage({ locale: "vi", searchParams: { q: "vin", province: "ha-noi" } });
    const host = document.createElement("div");
    host.innerHTML = renderToString(
      <NextIntlClientProvider locale="vi" messages={vi_messages}>
        {ui}
      </NextIntlClientProvider>,
    );
    const form = host.querySelector<HTMLFormElement>("aside form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/du-an");
    for (const name of ["status", "province", "developer", "priceMin", "priceMax", "type", "feature", "q"]) expect(form.querySelector(`[name=${name}]`)).not.toBeNull();
    expect(form.querySelector('input[name=province][value="ha-noi"]')).toHaveAttribute("checked");
    expect(form.querySelector("button[type=submit]")).toHaveTextContent("Áp dụng");
    expect(host.querySelector("details form[method=get]")).not.toBeNull();
    expect(host.querySelectorAll("h1")).toHaveLength(1);
  });
});

describe("generateMetadata /du-an", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));

  it("không lọc: indexable, canonical chính nó, hreflang; trang 2 canonical kèm ?page=2", async () => {
    const meta = await buildProjectListMetadata({ locale: "vi", searchParams: {} });
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/du-an");
    expect(meta.alternates?.languages).toMatchObject({ vi: "https://tami.example/du-an", en: "https://tami.example/en/projects" });
    expect((await buildProjectListMetadata({ locale: "vi", searchParams: { page: "2" } })).alternates?.canonical).toBe("https://tami.example/du-an?page=2");
  });

  it("mọi tham số lọc BL-045 + BL-052 (cả giá trị lạ): noindex, follow + canonical trang sạch; tham số rỗng / sort=newest thì index", async () => {
    const filtered = [{ category: "khong-co" }, { province: "ha-noi,da-nang" }, { status: "selling" }, { q: "crown" }, { developer: "d1" }, { sort: "price_asc" }, { type: "villa" }, { feature: "near_metro" }, { priceMin: "3" }, { priceMax: "8", page: "2" }];
    for (const searchParams of filtered) {
      const meta = await buildProjectListMetadata({ locale: "vi", searchParams });
      expect(meta.robots, JSON.stringify(searchParams)).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe("https://tami.example/du-an");
    }
    for (const searchParams of [{ province: "", status: "" }, { sort: "newest" }]) expect((await buildProjectListMetadata({ locale: "vi", searchParams })).robots).toEqual({ index: true, follow: true });
    expect((await buildProjectListMetadata({ locale: "en", searchParams: { type: "villa" } })).alternates?.canonical).toBe("https://tami.example/en/projects");
  });
});
