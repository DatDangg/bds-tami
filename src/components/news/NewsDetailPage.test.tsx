import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { Category, News } from "@/payload-types";

const now = "2026-01-01T00:00:00.000Z";
const category = { id: "c1", name: "Thị trường", slug: "thi-truong", scope: "news", hasEnglish: true, updatedAt: now, createdAt: now } as Category;
const heading = (tag: string, text: string) => ({ type: "heading", tag, children: [{ type: "text", text }] });
const doc = {
  id: "n1",
  title: "Thị trường căn hộ quý III",
  slug: "thi-truong-can-ho",
  excerpt: "Tóm tắt",
  status: "published",
  hasEnglish: true,
  category,
  cover: { ...fakeMedia("cover"), id: "m1" },
  tags: ["Hà Nội"],
  publishedAt: "2026-10-18T03:00:00.000Z",
  content: { root: { type: "root", children: [heading("h2", "Giá thuê giữ ổn định"), heading("h3", "Phân khúc dịch vụ")] } },
  updatedAt: now,
  createdAt: now,
} as unknown as News;
const other = (id: string): News => ({ ...doc, id, title: `Bài ${id}`, slug: `bai-${id}` }) as News;

const findPublicNewsBySlug = vi.hoisted(() => vi.fn());
const findRelatedNews = vi.hoisted(() => vi.fn());
const listPublicNews = vi.hoisted(() => vi.fn());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/components/layout/ConsultBanner", () => ({ ConsultBanner: () => <aside data-consult-banner="true" /> }));
vi.mock("@/components/content/RichText", () => ({ RichText: () => <div data-richtext="true" /> }));
vi.mock("@/lib/news/news-queries", () => ({
  LATEST_NEWS_COUNT: 3,
  findPublicNewsBySlug,
  findRelatedNews,
  listPublicNews,
  findLocalizedSlugs: async () => ({ vi: "thi-truong-can-ho", en: "market" }),
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    setRequestLocale: () => {},
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import NewsDetailPage from "@/app/(frontend)/[locale]/tin-tuc/[slug]/page";

async function render(locale: "vi" | "en" = "vi") {
  const ui = await NewsDetailPage({ params: Promise.resolve({ locale, slug: "thi-truong-can-ho" }) });
  return renderWithIntl(ui, locale);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  findPublicNewsBySlug.mockResolvedValue(doc);
  findRelatedNews.mockResolvedValue([other("r1"), other("r2")]);
  listPublicNews.mockResolvedValue({ docs: [other("l1"), other("l2"), other("l3")], totalDocs: 3, totalPages: 1, page: 1, limit: 3 });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("S11 /tin-tuc/[slug] (BL-045, mockup article)", () => {
  it("không còn DetailLayout; đúng 1 h1 canh trái; breadcrumb plain; ảnh bìa trước mục lục thu gọn trước nội dung", async () => {
    const { container } = await render();
    expect(container.querySelector("[data-detail-page]")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Thị trường căn hộ quý III");
    expect(h1.parentElement?.className).toContain("text-left");
    expect(container.innerHTML).not.toContain("text-center");
    const crumbs = screen.getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" });
    expect(within(crumbs).getByRole("link", { name: "Tin tức" })).toHaveAttribute("href", "/tin-tuc");
    expect(within(crumbs).getByRole("link", { name: "Thị trường" })).toHaveAttribute("href", "/tin-tuc/danh-muc/thi-truong");
    const toc = container.querySelector("details") as HTMLElement;
    const body = container.querySelector("[data-richtext]") as HTMLElement;
    const cover = container.querySelector("img") as HTMLElement;
    expect(cover.compareDocumentPosition(toc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toc.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toc.className).not.toContain("lg:hidden");
    expect(within(toc).getAllByRole("link").map((link) => link.textContent)).toEqual(["Giá thuê giữ ổn định", "Phân khúc dịch vụ"]);
  });

  it("cột phải: 'Bài viết mới' (≤ 3 bài, bài hiện tại bị loại) + thẻ tư vấn tối, nút → /lien-he, không form", async () => {
    const { container } = await render();
    expect(listPublicNews).toHaveBeenCalledWith({}, "vi", { page: 1, limit: 3, excludeIds: ["n1"] });
    const aside = container.querySelector("aside:not([data-consult-banner])") as HTMLElement;
    const latest = within(aside).getByRole("region", { name: "Bài viết mới" });
    expect(within(latest).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/tin-tuc/bai-l1", "/tin-tuc/bai-l2", "/tin-tuc/bai-l3"]);
    expect(within(aside).queryByText("Thị trường căn hộ quý III")).toBeNull();
    const consult = within(aside).getByRole("region", { name: "Đang tìm bất động sản phù hợp?" });
    expect(within(consult).getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/lien-he");
    expect(aside.querySelector("form, input")).toBeNull();
    expect(aside.className).toContain("lg:sticky");
  });

  it("cuối trang: 'Bài viết liên quan' đầu khối canh trái, rồi banner tư vấn; JSON-LD Article giữ", async () => {
    const { container } = await render();
    const related = screen.getByRole("heading", { level: 2, name: "Bài viết liên quan" });
    expect(related.parentElement?.className).toContain("text-left");
    const section = related.closest("section") as HTMLElement;
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    const banner = container.querySelector("[data-consult-banner]") as HTMLElement;
    expect(section.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([...container.querySelectorAll('script[type="application/ld+json"]')].map((script) => script.textContent).join("")).toContain("\"Article\"");
  });

  it("không có heading → không mục lục; không bài liên quan → không khối liên quan", async () => {
    findPublicNewsBySlug.mockResolvedValue({ ...doc, content: { root: { type: "root", children: [] } } });
    findRelatedNews.mockResolvedValue([]);
    const { container } = await render();
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Bài viết liên quan" })).toBeNull();
  });

  it("/en: nhãn tiếng Anh; bài không có → 404", async () => {
    await render("en");
    expect(screen.getByRole("region", { name: "Latest articles" })).toBeInTheDocument();
    findPublicNewsBySlug.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
