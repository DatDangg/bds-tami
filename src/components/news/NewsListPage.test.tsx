import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { RawNewsParams } from "@/lib/news/news-filters";
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
  ids?: string[];
  sort?: "newest" | "oldest";
}
const listPublicNews = vi.hoisted(() => vi.fn());
const listRootNewsCategories = vi.hoisted(() => vi.fn());
const listChildNewsCategories = vi.hoisted(() => vi.fn());
const findFilteredNewsIds = vi.hoisted(() => vi.fn());
const listTopNewsTags = vi.hoisted(() => vi.fn());
const loadMostReadNews = vi.hoisted(() => vi.fn());
const leadFormRenders = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());
const fakePayload = vi.hoisted(() => ({ logger: { error: logError, warn: vi.fn() } }));
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => fakePayload }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({
  loadPageHero: async () => ({
    image: { url: "/api/media/file/banner.jpg", width: 1600 },
    eyebrow: "Tin tức TAMI HOMES",
    title: "Tin tức &",
    titleAccent: "thị trường",
    description: "Cập nhật từ TAMI HOMES.",
  }),
}));
vi.mock("@/components/layout/ConsultBanner", () => ({ ConsultBanner: () => <aside data-consult-banner="true" /> }));
vi.mock("@/components/news/NewsletterSignup", () => ({ NewsletterSignup: () => <section aria-label="Bản tin thị trường" data-newsletter="true" /> }));
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: (props: { source: string; turnstileSiteKey?: string }) => {
    leadFormRenders(props);
    return <form aria-label="Form lead" data-source={props.source} />;
  },
}));
vi.mock("@/lib/news/most-read", () => ({ loadMostReadNews }));
vi.mock("@/lib/news/news-search", () => ({ findFilteredNewsIds, listTopNewsTags }));
vi.mock("@/lib/news/news-queries", () => ({
  NEWS_PAGE_SIZE: 12,
  listPublicNews,
  listRootNewsCategories,
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
const titlesOf = (ids: string[]) => ids.map((id) => `Bài ${id}`);

/** Ngữ nghĩa `listPublicNews` thật (đã kiểm bằng DB ở tests/integration/news.test.ts) trên fixture: lọc, loại trùng, id, sắp xếp, phân trang. */
listPublicNews.mockImplementation(async (_payload: unknown, locale: string, query: Query) => {
  const matched = visible(locale)
    .filter((doc) => !query.categoryIds || query.categoryIds.includes(categoryIdOf(doc.category) ?? ""))
    .filter((doc) => !query.excludeIds || !query.excludeIds.includes(doc.id))
    .filter((doc) => !query.ids || query.ids.includes(doc.id))
    .filter((doc) => !query.featuredOnly || doc.isFeatured);
  const ordered = query.sort === "oldest" ? [...matched].reverse() : matched;
  const limit = query.limit ?? 12;
  return {
    docs: ordered.slice((query.page - 1) * limit, query.page * limit),
    page: query.page,
    limit,
    totalDocs: ordered.length,
    totalPages: Math.max(1, Math.ceil(ordered.length / limit)),
    hasNextPage: false,
    hasPrevPage: false,
  };
});
listRootNewsCategories.mockImplementation(async (_payload: unknown, locale: string) => ({ docs: roots.filter((item) => locale === "vi" || item.hasEnglish) }));
listChildNewsCategories.mockResolvedValue({ docs: [] });
const mostReadItems = [
  { id: "n5", title: "Bài n5", href: "/tin-tuc/bai-n5", cover: null, publishedAt: docs[4]!.publishedAt, dateLabel: "26/06/2026" },
  { id: "n7", title: "Bài n7", href: "/tin-tuc/bai-n7", cover: null, publishedAt: docs[6]!.publishedAt, dateLabel: "24/06/2026" },
];

function resetMocks() {
  findFilteredNewsIds.mockReset().mockResolvedValue(null);
  listTopNewsTags.mockReset().mockImplementation(async (_payload: unknown, locale: string) => (locale === "en" ? [] : ["thị trường", "dự án"]));
  loadMostReadNews.mockReset().mockResolvedValue(mostReadItems);
}

async function render(locale: "vi" | "en", searchParams: RawNewsParams = {}, categorySlug?: string) {
  const ui = await NewsListPage({ locale, searchParams, ...(categorySlug ? { categorySlug } : {}) });
  return renderWithIntl(ui, locale);
}
const gridTitles = (container: HTMLElement) => [...container.querySelectorAll("ul[data-grid-max-cols='3'] article")].map((card) => card.querySelector("h2, h3")?.textContent);
const featuredTitles = (container: HTMLElement) => [...container.querySelectorAll("[data-news-featured] h2")].map((heading) => heading.textContent);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  resetMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const mock of [listPublicNews, listRootNewsCategories, listChildNewsCategories, leadFormRenders, notFound, logError]) mock.mockClear();
});

describe("S10 /tin-tuc trang 1 (BL-054, design tin-tuc.webp)", () => {
  it("hero danh sách (ảnh + chữ admin, h1 hai phần) + ô tìm q (form GET về /tin-tuc), không hàng 'Tìm nhanh'", async () => {
    const { container } = await render("vi");
    expect(container.querySelector("[data-hero-size=list]")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Tin tức &\s*thị trường/);
    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("action", "/tin-tuc");
    expect(within(search).getByRole("searchbox")).toHaveAttribute("placeholder", "Tìm bài viết…");
    expect(screen.queryByText("Tìm nhanh:")).toBeNull();
  });

  it("chip danh mục là link: 'Tất cả' (aria-current) + danh mục cấp 1", async () => {
    await render("vi");
    const tabs = screen.getByRole("navigation", { name: "Danh mục tin tức" });
    expect(within(tabs).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/tin-tuc"],
      ["Thị trường", "/tin-tuc/danh-muc/thi-truong"],
      ["Đời sống", "/tin-tuc/danh-muc/doi-song"],
      ["Chưa có bài", "/tin-tuc/danh-muc/chua-co-bai"],
    ]);
    expect(within(tabs).getByRole("link", { name: "Tất cả" })).toHaveAttribute("aria-current", "page");
  });

  it("khối nổi bật = isFeatured mới nhất (n2, n9) rồi bài mới nhất (n1, n3); lưới 'Bài viết mới nhất' loại 4 bài đó", async () => {
    const { container } = await render("vi");
    expect(featuredTitles(container)).toEqual(titlesOf(["n2", "n9", "n1", "n3"]));
    expect(screen.getByRole("heading", { level: 2, name: "Bài viết mới nhất" })).toBeInTheDocument();
    const expected = docs.filter((doc) => !["n2", "n9", "n1", "n3"].includes(doc.id)).slice(0, 12).map((doc) => doc.title);
    expect(gridTitles(container)).toEqual(expected);
    expect(screen.getByRole("combobox", { name: "Sắp xếp theo" })).toBeInTheDocument();
  });

  it("số truy vấn cố định: nổi bật + mới nhất (limit 4, song song) + lưới; không gọi tìm id khi không lọc", async () => {
    await render("vi");
    expect(listPublicNews).toHaveBeenCalledTimes(3);
    expect(listPublicNews).toHaveBeenCalledWith(fakePayload, "vi", { page: 1, limit: 4, featuredOnly: true });
    expect(listPublicNews).toHaveBeenCalledWith(fakePayload, "vi", { page: 1, limit: 4 });
    expect(findFilteredNewsIds).not.toHaveBeenCalled();
    expect(listRootNewsCategories).toHaveBeenCalledTimes(1);
  });

  it("mọi bài hiện ở trang 1 hoặc trang 2, không trùng, không mất (khối nổi bật chỉ ở trang 1)", async () => {
    const first = await render("vi");
    const page1 = [...featuredTitles(first.container), ...gridTitles(first.container)];
    cleanup();
    const second = await render("vi", { page: "2" });
    expect(second.container.querySelector("[data-news-featured]")).toBeNull();
    const all = [...page1, ...gridTitles(second.container)];
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(docs.map((doc) => doc.title).sort());
  });

  it("cột phải: Đọc nhiều (top từ loadMostReadNews) + Bản tin + Chủ đề (#tag → ?tag=)", async () => {
    await render("vi");
    const aside = screen.getByRole("complementary", { name: "Đọc thêm" });
    const mostRead = within(aside).getByRole("region", { name: "Đọc nhiều" });
    expect(within(mostRead).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/tin-tuc/bai-n5", "/tin-tuc/bai-n7"]);
    expect(aside.querySelector("[data-newsletter]")).not.toBeNull();
    const topics = within(aside).getByRole("region", { name: "Chủ đề" });
    expect(within(topics).getAllByRole("link").map((link) => link.textContent)).toEqual(["#thị trường", "#dự án"]);
    expect(within(topics).getByRole("link", { name: "#dự án" })).toHaveAttribute("href", `/tin-tuc?tag=${encodeURIComponent("dự án").replace("%20", "+")}`);
  });

  it("Đọc nhiều / Chủ đề lỗi DB → ẩn khối, trang vẫn render, lỗi vào log", async () => {
    loadMostReadNews.mockRejectedValue(new Error("db down"));
    listTopNewsTags.mockRejectedValue(new Error("db down"));
    const { container } = await render("vi");
    expect(screen.queryByRole("region", { name: "Đọc nhiều" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Chủ đề" })).toBeNull();
    expect(gridTitles(container)).toHaveLength(12);
    expect(logError).toHaveBeenCalledTimes(2);
  });

  it("form Tư vấn nhu cầu (nguồn contact) sau danh sách, banner tư vấn cuối", async () => {
    const { container } = await render("vi");
    expect(screen.getAllByRole("form", { name: "Form lead" })).toHaveLength(1);
    expect(screen.getByRole("form", { name: "Form lead" })).toHaveAttribute("data-source", "contact");
    const consult = screen.getByRole("heading", { level: 2, name: "Tư vấn nhu cầu" });
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    expect(pagination.compareDocumentPosition(consult) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const banner = container.querySelector("[data-consult-banner]") as HTMLElement;
    expect(consult.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("phân trang không đổi: trang 1 chỉ trỏ /tin-tuc?page=2, rel=next", async () => {
    await render("vi");
    const pagination = screen.getByRole("navigation", { name: "Phân trang" });
    expect(new Set(within(pagination).getAllByRole("link").map((link) => link.getAttribute("href")))).toEqual(new Set(["/tin-tuc?page=2"]));
    expect(pagination.querySelector("a[rel=next]")).toHaveAttribute("href", "/tin-tuc?page=2");
  });
});

describe("Tìm q / lọc tag / sắp xếp (BL-054)", () => {
  it("q: id từ findFilteredNewsIds, không khối nổi bật, 'N bài viết phù hợp', thẻ h2, ô tìm giữ từ khoá", async () => {
    findFilteredNewsIds.mockResolvedValue(["n5", "n7"]);
    const { container } = await render("vi", { q: "dong anh" });
    expect(findFilteredNewsIds).toHaveBeenCalledWith(fakePayload, "vi", { q: "dong anh", sort: "newest" });
    expect(listPublicNews).toHaveBeenCalledTimes(1);
    expect(listPublicNews).toHaveBeenCalledWith(fakePayload, "vi", { page: 1, sort: "newest", ids: ["n5", "n7"] });
    expect(container.querySelector("[data-news-featured]")).toBeNull();
    expect(screen.getByText("2 bài viết")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bài viết mới nhất" })).toBeNull();
    expect(screen.getAllByRole("heading", { level: 2 }).slice(0, 2).map((heading) => heading.textContent)).toEqual(titlesOf(["n5", "n7"]));
    expect(within(screen.getByRole("search")).getByRole("searchbox")).toHaveValue("dong anh");
  });

  it("q không khớp: trạng thái trống có nút về /tin-tuc, không truy vấn lưới", async () => {
    findFilteredNewsIds.mockResolvedValue([]);
    await render("vi", { q: "khong co" });
    expect(listPublicNews).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Chưa có bài viết phù hợp." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/tin-tuc");
    expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
  });

  it("sort=oldest: cũ nhất trước, không khối nổi bật; ô tìm giữ sort bằng input ẩn; phân trang giữ sort", async () => {
    const { container } = await render("vi", { sort: "oldest" });
    expect(container.querySelector("[data-news-featured]")).toBeNull();
    expect(gridTitles(container).slice(0, 2)).toEqual(titlesOf(["n20", "n19"]));
    expect(screen.getByRole("search").querySelector("input[type=hidden][name=sort]")).toHaveAttribute("value", "oldest");
    expect(screen.getByRole("navigation", { name: "Phân trang" }).querySelector("a[rel=next]")).toHaveAttribute("href", "/tin-tuc?sort=oldest&page=2");
  });

  it("sort lạ / sort=newest bị bỏ qua (như trang thường)", async () => {
    const { container } = await render("vi", { sort: "price_asc" });
    expect(featuredTitles(container)).toHaveLength(4);
  });

  it("tag (vi): truyền vào findFilteredNewsIds, chip Chủ đề tương ứng aria-current", async () => {
    findFilteredNewsIds.mockResolvedValue(["n4"]);
    await render("vi", { tag: "dự án" });
    expect(findFilteredNewsIds).toHaveBeenCalledWith(fakePayload, "vi", { tag: "dự án", sort: "newest" });
    expect(screen.getByRole("link", { name: "#dự án" })).toHaveAttribute("aria-current", "true");
  });
});

describe("/en", () => {
  it("chỉ bài + danh mục có bản EN; tiêu đề form + chữ tiếng Anh; ẩn 'Chủ đề'", async () => {
    await render("en");
    expect(screen.getByRole("heading", { level: 2, name: "Get a consultation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Latest articles" })).toBeInTheDocument();
    expect(screen.queryByText("Bài n1")).toBeNull();
    const tabs = screen.getByRole("navigation", { name: "News categories" });
    expect(within(tabs).queryByRole("link", { name: "Đời sống" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Topics" })).toBeNull();
    expect(screen.getByRole("search")).toHaveAttribute("action", "/en/news");
  });

  it("?tag= bị bỏ qua ở /en (tags chưa có bản EN): như trang thường, có khối nổi bật", async () => {
    const { container } = await render("en", { tag: "dự án" });
    expect(findFilteredNewsIds).not.toHaveBeenCalled();
    expect(featuredTitles(container)).toHaveLength(4);
  });
});

describe("S05 trang danh mục + 404", () => {
  it("cùng khung: hero tên danh mục, khối nổi bật trong danh mục, không form tư vấn, vẫn banner + cột phải", async () => {
    const { container } = await render("vi", {}, "thi-truong");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thị trường");
    expect(featuredTitles(container)).toEqual(titlesOf(["n2", "n4", "n6", "n8"]));
    expect(gridTitles(container)).toEqual(titlesOf(["n10", "n12", "n14", "n16", "n18", "n20"]));
    expect(screen.queryByRole("form", { name: "Form lead" })).toBeNull();
    expect(container.querySelector("[data-consult-banner]")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Đọc nhiều" })).toBeInTheDocument();
    expect(screen.getByRole("search")).toHaveAttribute("action", "/tin-tuc/danh-muc/thi-truong");
  });

  it("trang vượt số trang → 404; danh mục không có / chưa có EN → 404", async () => {
    await expect(render("vi", { page: "9" })).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(render("vi", {}, "khong-co")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(render("en", {}, "doi-song")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("SEO: canonical + noindex (BL-020 P3-T03 F3, BL-054)", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));

  it("canonical trang 1 sạch, trang n có ?page=n; hreflang vi/en cùng quy tắc; index", async () => {
    const page1 = await buildNewsListMetadata({ locale: "vi", searchParams: {} });
    expect(page1.alternates?.canonical).toBe("https://tami.example/tin-tuc");
    expect(page1.alternates?.languages).toMatchObject({ vi: "https://tami.example/tin-tuc", en: "https://tami.example/en/news" });
    expect(page1.robots).toEqual({ index: true, follow: true });
    const page2 = await buildNewsListMetadata({ locale: "vi", searchParams: { page: "2" } });
    expect(page2.alternates?.canonical).toBe("https://tami.example/tin-tuc?page=2");
    const en3 = await buildNewsListMetadata({ locale: "en", searchParams: { page: "3" } });
    expect(en3.alternates?.canonical).toBe("https://tami.example/en/news?page=3");
  });

  it.each<RawNewsParams>([{ q: "dong anh" }, { tag: "dự án" }, { sort: "oldest" }, { q: "x", page: "2" }])("%j → noindex, follow + canonical sạch", async (searchParams) => {
    const meta = await buildNewsListMetadata({ locale: "vi", searchParams });
    expect(meta.robots).toMatchObject({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/tin-tuc");
  });

  it("sort=newest / sort lạ / ?tag= ở /en không tính là lọc", async () => {
    expect((await buildNewsListMetadata({ locale: "vi", searchParams: { sort: "newest" } })).robots).toEqual({ index: true, follow: true });
    expect((await buildNewsListMetadata({ locale: "vi", searchParams: { sort: "bad" } })).robots).toEqual({ index: true, follow: true });
    expect((await buildNewsListMetadata({ locale: "en", searchParams: { tag: "x" } })).robots).toEqual({ index: true, follow: true });
  });

  it("trang danh mục: canonical kèm ?page; có q → noindex + canonical danh mục sạch", async () => {
    const meta = await buildNewsListMetadata({ locale: "vi", searchParams: { page: "2" }, categorySlug: "thi-truong" });
    expect(meta.alternates?.canonical).toBe("https://tami.example/tin-tuc/danh-muc/thi-truong?page=2");
    const filtered = await buildNewsListMetadata({ locale: "vi", searchParams: { q: "a", page: "2" }, categorySlug: "thi-truong" });
    expect(filtered.robots).toMatchObject({ index: false, follow: true });
    expect(filtered.alternates?.canonical).toBe("https://tami.example/tin-tuc/danh-muc/thi-truong");
  });
});
