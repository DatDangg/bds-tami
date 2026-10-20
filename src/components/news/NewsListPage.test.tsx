import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { Category, News } from "@/payload-types";

const now = "2026-01-01T00:00:00.000Z";
const category = (id: string, name: string, slug: string, hasEnglish = true): Category => ({
  id,
  name,
  slug,
  scope: "news",
  hasEnglish,
  updatedAt: now,
  createdAt: now,
});
const market = category("c1", "Thị trường", "thi-truong");
const life = category("c2", "Đời sống", "doi-song", false);
const empty = category("c3", "Chưa có bài", "chua-co-bai");
const roots = [market, life, empty];

/** 20 bài, mới nhất là n1; n2 và n9 đánh dấu nổi bật; chẵn thuộc "Thị trường", lẻ thuộc "Đời sống"; n1 không có bản EN. */
const docs: News[] = Array.from({ length: 20 }, (_, index) => {
  const id = `n${index + 1}`;
  return {
    id,
    title: `Bài ${id}`,
    slug: `bai-${id}`,
    excerpt: `Tóm tắt ${id}`,
    status: "published",
    isFeatured: id === "n2" || id === "n9",
    hasEnglish: id !== "n1",
    category: index % 2 === 1 ? market : life,
    publishedAt: new Date(Date.UTC(2026, 5, 30 - index)).toISOString(),
    author: "a",
    updatedAt: now,
    createdAt: now,
  } as News;
});

interface Query {
  page: number;
  limit?: number;
  categoryIds?: string[];
  excludeIds?: string[];
  featuredOnly?: boolean;
}
const listPublicNews = vi.hoisted(() => vi.fn());
const listRootNewsCategories = vi.hoisted(() => vi.fn());
const listChildNewsCategoriesOf = vi.hoisted(() => vi.fn());
const listChildNewsCategories = vi.hoisted(() => vi.fn());
const leadFormRenders = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageBanner: async () => ({ url: "/api/media/file/banner.jpg", width: 1600 }) }));
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: (props: { source: string; turnstileSiteKey?: string }) => {
    leadFormRenders(props);
    return <form aria-label="Form lead" data-source={props.source} />;
  },
}));
vi.mock("@/lib/news/news-queries", () => ({
  NEWS_FEATURED_COUNT: 4,
  NEWS_PAGE_SIZE: 12,
  listPublicNews,
  listRootNewsCategories,
  listChildNewsCategoriesOf,
  listChildNewsCategories,
  findNewsCategoryBySlug: async (_payload: unknown, locale: string, slug: string) => {
    const found = roots.find((item) => item.slug === slug);
    return found && (locale === "vi" || found.hasEnglish) ? found : null;
  },
  findLocalizedSlugs: async () => ({ vi: "thi-truong", en: "market" }),
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

import { NewsListPage, buildNewsListMetadata } from "./NewsListPage";

const visible = (locale: string) => docs.filter((doc) => locale === "vi" || doc.hasEnglish);
const categoryIdOf = (category: unknown) => (category as Category | undefined)?.id;

/** Ngữ nghĩa `listPublicNews` thật (đã kiểm bằng DB ở tests/integration/news.test.ts) trên fixture: lọc, loại trùng, phân trang, mới nhất trước. */
listPublicNews.mockImplementation(async (_payload: unknown, locale: string, query: Query) => {
  const matched = visible(locale)
    .filter((doc) => !query.categoryIds || query.categoryIds.includes(categoryIdOf(doc.category) ?? ""))
    .filter((doc) => !query.excludeIds || !query.excludeIds.includes(doc.id))
    .filter((doc) => !query.featuredOnly || doc.isFeatured);
  const limit = query.limit ?? 12;
  return {
    docs: matched.slice((query.page - 1) * limit, query.page * limit),
    page: query.page,
    limit,
    totalDocs: matched.length,
    totalPages: Math.max(1, Math.ceil(matched.length / limit)),
    hasNextPage: false,
    hasPrevPage: false,
  };
});
listRootNewsCategories.mockImplementation(async (_payload: unknown, locale: string) => ({ docs: roots.filter((item) => locale === "vi" || item.hasEnglish) }));
listChildNewsCategoriesOf.mockResolvedValue({ docs: [] });
listChildNewsCategories.mockResolvedValue({ docs: [] });

async function render(locale: "vi" | "en", rawPage?: string, categorySlug?: string) {
  const ui = await NewsListPage({ locale, rawPage, ...(categorySlug ? { categorySlug } : {}) });
  return renderWithIntl(ui, locale);
}
const headingTexts = (level: number) => screen.getAllByRole("heading", { level }).map((heading) => heading.textContent);
const h3Titles = (region: HTMLElement) => within(region).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [listPublicNews, listRootNewsCategories, listChildNewsCategoriesOf, listChildNewsCategories, leadFormRenders, notFound]) mock.mockClear();
});

describe("S10 /tin-tuc trang 1 (BL-020 P3-T03)", () => {
  it("banner gọn không đệm đáy; tab danh mục là link, 'Tất cả' đang chọn", async () => {
    const { container } = await render("vi");
    expect(container.querySelector("[data-hero-size=short]")).not.toBeNull();
    expect(container.querySelector("[data-search-overlay], [data-filter-card]")).toBeNull();
    const tabs = screen.getByRole("navigation", { name: "Danh mục tin tức" });
    expect(within(tabs).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/tin-tuc"],
      ["Thị trường", "/tin-tuc/danh-muc/thi-truong"],
      ["Đời sống", "/tin-tuc/danh-muc/doi-song"],
      ["Chưa có bài", "/tin-tuc/danh-muc/chua-co-bai"],
    ]);
    expect(within(tabs).getByRole("link", { name: "Tất cả" })).toHaveAttribute("aria-current", "page");
  });

  it("Tin nổi bật: bài đánh dấu nổi bật trước rồi bài mới nhất; không trùng; 1 lớn + 4", async () => {
    await render("vi");
    const featured = screen.getByRole("region", { name: "Tin nổi bật" });
    expect(h3Titles(featured)).toEqual(["Bài n2", "Bài n9", "Bài n1", "Bài n3", "Bài n4"]);
  });

  it("mỗi danh mục một hàng ≤ 4 bài mới nhất + Xem thêm tới trang danh mục; danh mục không có bài thì không có hàng", async () => {
    await render("vi");
    expect(headingTexts(2)).toEqual(["Tin nổi bật", "Thị trường", "Đời sống", "Tin khác", "Tư vấn nhu cầu"]);
    const marketRow = screen.getByRole("region", { name: "Thị trường" });
    expect(h3Titles(marketRow)).toEqual(["Bài n2", "Bài n4", "Bài n6", "Bài n8"]);
    expect(within(marketRow).getByRole("link", { name: "Xem thêm tin Thị trường" })).toHaveAttribute("href", "/tin-tuc/danh-muc/thi-truong");
    expect(h3Titles(screen.getByRole("region", { name: "Đời sống" }))).toEqual(["Bài n1", "Bài n3", "Bài n5", "Bài n7"]);
    expect(screen.queryByRole("region", { name: "Chưa có bài" })).toBeNull();
  });

  it("số truy vấn cố định, không N+1: danh mục cấp 1 một lần, con một lần, mỗi hàng một truy vấn", async () => {
    await render("vi");
    expect(listRootNewsCategories).toHaveBeenCalledTimes(1);
    expect(listChildNewsCategoriesOf).toHaveBeenCalledTimes(1);
    // 2 (đầu trang + lưới, cho phân trang) + 2 (nổi bật) + 3 hàng (3 danh mục cấp 1).
    expect(listPublicNews).toHaveBeenCalledTimes(7);
  });

  it("Tin khác: lưới phân trang trang 1 (n5-n16, bỏ n9 đã ở Tin nổi bật) sau các hàng danh mục, trước phân trang; n5-n20 đều hiện ở trang 1 hoặc trang 2", async () => {
    await render("vi");
    const more = screen.getByRole("region", { name: "Tin khác" });
    expect(h3Titles(more)).toEqual(docs.slice(4, 16).filter((doc) => doc.id !== "n9").map((doc) => doc.title));
    const lastRow = screen.getByRole("region", { name: "Đời sống" });
    expect(lastRow.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    expect(more.compareDocumentPosition(pagination) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    cleanup();
    await render("vi", "2");
    const page2 = headingTexts(2).map((text) => text ?? "");
    const onPage1 = new Set(docs.slice(4, 16).map((doc) => doc.title)); // gồm n9 (ở Tin nổi bật)
    for (const doc of docs.slice(4)) expect(onPage1.has(doc.title) || page2.includes(doc.title ?? "")).toBe(true);
  });

  it("≥ 5 bài cũ nổi bật + n1-n4 không danh mục: n1-n20 đều hiện ở trang 1 hoặc 2, không trùng giữa Tin nổi bật và Tin khác", async () => {
    const saved = docs.map((doc) => [doc.isFeatured, doc.category] as const);
    docs.forEach((doc, index) => {
      doc.isFeatured = index >= 9 && index <= 13;
      if (index < 4) doc.category = undefined;
    });
    try {
      await render("vi");
      const featuredTitles = h3Titles(screen.getByRole("region", { name: "Tin nổi bật" }));
      const moreTitles = h3Titles(screen.getByRole("region", { name: "Tin khác" }));
      expect(featuredTitles.filter((title) => moreTitles.includes(title))).toEqual([]);
      for (const title of ["Bài n1", "Bài n2", "Bài n3", "Bài n4"]) expect(moreTitles.slice(0, 4)).toContain(title);
      const onPage1 = new Set([...featuredTitles, ...moreTitles, ...headingTexts(3)]);
      cleanup();
      await render("vi", "2");
      const page2 = new Set(headingTexts(2));
      for (const doc of docs) expect(onPage1.has(doc.title ?? "") || page2.has(doc.title ?? "")).toBe(true);
    } finally {
      docs.forEach((doc, index) => {
        [doc.isFeatured, doc.category] = saved[index] ?? [];
      });
    }
  });

  it("form Tư vấn nhu cầu cuối trang: đúng một form, nguồn contact, sau phân trang", async () => {
    await render("vi");
    expect(screen.getAllByRole("form", { name: "Form lead" })).toHaveLength(1);
    expect(leadFormRenders).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("form", { name: "Form lead" })).toHaveAttribute("data-source", "contact");
    const consult = screen.getByRole("heading", { level: 2, name: "Tư vấn nhu cầu" });
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    expect(pagination.compareDocumentPosition(consult) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(consult.closest("section")).toContainElement(screen.getByRole("form", { name: "Form lead" }));
  });

  it("phân trang không đổi: trang 1 chỉ trỏ /tin-tuc?page=2, rel=next, không rel=prev", async () => {
    await render("vi");
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    const hrefs = within(pagination).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(new Set(hrefs)).toEqual(new Set(["/tin-tuc?page=2"]));
    expect(pagination.querySelector("a[rel=next]")).toHaveAttribute("href", "/tin-tuc?page=2");
    expect(pagination.querySelector("a[rel=prev]")).toBeNull();
  });

  it("/en: chỉ bài + danh mục có bản EN, tiêu đề form tiếng Anh", async () => {
    await render("en");
    expect(screen.getByRole("heading", { level: 2, name: "Get a consultation" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Đời sống" })).toBeNull();
    expect(screen.queryByText("Bài n1")).toBeNull();
    const marketRow = screen.getByRole("region", { name: "Thị trường" });
    expect(within(marketRow).getByRole("link", { name: "View more Thị trường news" })).toBeInTheDocument();
  });
});

describe("S10 /tin-tuc trang 2+ và S05 danh mục", () => {
  it("trang 2: lưới 4 cột phân trang như cũ (bỏ 4 bài mới nhất, 12 bài/trang: trang 2 còn n17-n20), không có Tin nổi bật/hàng danh mục; vẫn có form tư vấn", async () => {
    const { container } = await render("vi", "2");
    expect(screen.queryByRole("region", { name: "Tin nổi bật" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Thị trường" })).toBeNull();
    expect(headingTexts(2)).toEqual([...docs.slice(16, 20).map((doc) => doc.title), "Tư vấn nhu cầu"]);
    expect(container.querySelector("[data-grid-max-cols='4']")).not.toBeNull();
    expect(listPublicNews).toHaveBeenCalledWith({}, "vi", { page: 2, excludeIds: ["n1", "n2", "n3", "n4"] });
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    expect(pagination.querySelector("a[rel=prev]")).toHaveAttribute("href", "/tin-tuc");
    expect(screen.getAllByRole("form", { name: "Form lead" })).toHaveLength(1);
  });

  it("trang vượt số trang → 404", async () => {
    await expect(render("vi", "9")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("trang danh mục: banner gọn + lưới 4 cột, không form tư vấn, không hàng danh mục", async () => {
    const { container } = await render("vi", undefined, "thi-truong");
    expect(container.querySelector("[data-hero-size=short]")).not.toBeNull();
    expect(container.querySelector("[data-grid-max-cols='4']")).not.toBeNull();
    expect(screen.queryByRole("form", { name: "Form lead" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Tin nổi bật" })).toBeNull();
    expect(headingTexts(2)).toEqual(["Bài n2", "Bài n4", "Bài n6", "Bài n8", "Bài n10", "Bài n12", "Bài n14", "Bài n16", "Bài n18", "Bài n20"]);
  });
});

describe("SEO: canonical + phân trang không đổi (BL-020 P3-T03 F3)", () => {
  it("canonical trang 1 sạch, trang n có ?page=n; hreflang vi/en cùng quy tắc", async () => {
    const page1 = await buildNewsListMetadata({ locale: "vi", rawPage: undefined });
    expect(page1.alternates?.canonical).toBe("https://tami.example/tin-tuc");
    expect(page1.alternates?.languages).toMatchObject({ vi: "https://tami.example/tin-tuc", en: "https://tami.example/en/news" });
    const page2 = await buildNewsListMetadata({ locale: "vi", rawPage: "2" });
    expect(page2.alternates?.canonical).toBe("https://tami.example/tin-tuc?page=2");
    expect(page2.alternates?.languages).toMatchObject({ vi: "https://tami.example/tin-tuc?page=2", en: "https://tami.example/en/news?page=2" });
    const en3 = await buildNewsListMetadata({ locale: "en", rawPage: "3" });
    expect(en3.alternates?.canonical).toBe("https://tami.example/en/news?page=3");
  });

  it("canonical trang danh mục kèm ?page", async () => {
    const meta = await buildNewsListMetadata({ locale: "vi", rawPage: "2", categorySlug: "thi-truong" });
    expect(meta.alternates?.canonical).toBe("https://tami.example/tin-tuc/danh-muc/thi-truong?page=2");
  });
});
