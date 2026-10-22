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
  cover: { ...fakeMedia("cover"), id: "m1", caption: "Phối cảnh dự án" },
  tags: ["Hà Nội", "Căn hộ"],
  // Bài có người viết (staff) — trang công khai KHÔNG được đọc / hiện tên này (spec-validation F3).
  author: { id: "s1", name: "Nguyễn Văn Biên Tập", email: "bt@tami.example" },
  publishedAt: "2026-10-18T03:00:00.000Z",
  content: { root: { type: "root", children: [heading("h2", "Giá thuê giữ ổn định"), heading("h3", "Phân khúc dịch vụ")] } },
  updatedAt: now,
  createdAt: now,
} as unknown as News;
const other = (id: string): News => ({ ...doc, id, title: `Bài ${id}`, slug: `bai-${id}` }) as News;

const findPublicNewsBySlug = vi.hoisted(() => vi.fn());
const findRelatedNews = vi.hoisted(() => vi.fn());
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
vi.mock("@/components/content/RichText", () => ({ RichText: ({ className }: { className?: string }) => <div data-richtext="true" className={className} /> }));
vi.mock("@/components/news/NewsViewBeacon", () => ({ NewsViewBeacon: ({ newsId }: { newsId: string }) => <i data-beacon={newsId} /> }));
vi.mock("@/lib/news/news-queries", () => ({
  findPublicNewsBySlug,
  findRelatedNews,
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

const following = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  findPublicNewsBySlug.mockResolvedValue(doc);
  findRelatedNews.mockResolvedValue([other("r1"), other("r2"), other("r3")]);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("S11 /tin-tuc/[slug] (BL-054, design chi-tiet-tin-tuc.webp)", () => {
  it("đầu bài: breadcrumb → badge danh mục (link) → 1 h1 → sapo → tác giả = nhãn thương hiệu (không tên staff) · ngày · phút đọc + chia sẻ icon", async () => {
    const { container } = await render();
    expect(container.querySelector("[data-detail-page]")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Thị trường căn hộ quý III");
    const header = h1.closest("header") as HTMLElement;
    const crumbs = screen.getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" });
    expect(within(crumbs).getByRole("link", { name: "Tin tức" })).toHaveAttribute("href", "/tin-tuc");
    expect(following(crumbs, header)).toBe(true);
    const badge = within(header).getByRole("link", { name: "Thị trường" });
    expect(badge).toHaveAttribute("href", "/tin-tuc/danh-muc/thi-truong");
    expect(following(badge, h1)).toBe(true);
    expect(within(header).getByText("Tóm tắt")).toBeInTheDocument();
    expect(header).toHaveTextContent("Ban biên tập TAMI HOMES");
    expect(container.textContent).not.toContain("Nguyễn Văn Biên Tập");
    expect(within(header).getByText("18/10/2026").tagName).toBe("TIME");
    expect(header).toHaveTextContent("phút đọc");
    const share = within(header).getByRole("group", { name: "Chia sẻ bài viết" });
    expect(within(share).getByRole("link", { name: "Chia sẻ lên Facebook" }).getAttribute("href")).toContain(encodeURIComponent("https://tami.example/tin-tuc/thi-truong-can-ho"));
    expect(within(share).getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
  });

  it("ảnh bìa + chú thích → mục lục gập (< lg) → nội dung lớp news-prose → dòng 'Thẻ:'; beacon gửi id bài", async () => {
    const { container } = await render();
    const figure = container.querySelector("figure") as HTMLElement;
    expect(within(figure).getByText("Phối cảnh dự án").tagName).toBe("FIGCAPTION");
    const toc = container.querySelector("details") as HTMLElement;
    expect(toc.className).toContain("lg:hidden");
    const body = container.querySelector("[data-richtext]") as HTMLElement;
    expect(body.className).toContain("news-prose");
    expect(following(figure, toc)).toBe(true);
    expect(following(toc, body)).toBe(true);
    const tags = screen.getByRole("list", { name: "Từ khoá" });
    expect(following(body, tags)).toBe(true);
    expect(tags.parentElement).toHaveTextContent("Thẻ:");
    expect(within(tags).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["#Hà Nội", `/tin-tuc?${new URLSearchParams({ tag: "Hà Nội" }).toString()}`],
      ["#Căn hộ", `/tin-tuc?${new URLSearchParams({ tag: "Căn hộ" }).toString()}`],
    ]);
    expect(container.querySelectorAll("[data-beacon]")).toHaveLength(1);
    expect(container.querySelector("[data-beacon]")).toHaveAttribute("data-beacon", "n1");
  });

  it("cột trái (sau nội dung trong DOM, ≥ lg cột 1 dính): mục lục ≥ lg + thẻ 'Tư vấn miễn phí' → /lien-he, không form; không còn 'Bài viết mới'", async () => {
    const { container } = await render();
    const aside = container.querySelector("aside:not([data-consult-banner])") as HTMLElement;
    expect(aside.className).toContain("lg:sticky");
    expect(aside.className).toContain("lg:col-start-1");
    expect(following(container.querySelector("[data-richtext]") as HTMLElement, aside)).toBe(true);
    const toc = within(aside).getByRole("navigation", { name: "Mục lục" });
    expect(toc.className).toContain("lg:block");
    expect(within(toc).getAllByRole("link").map((link) => link.textContent)).toEqual(["Giá thuê giữ ổn định", "Phân khúc dịch vụ"]);
    const consult = within(aside).getByRole("region", { name: "Cần chọn dự án phù hợp với ngân sách?" });
    expect(consult).toHaveTextContent("Tư vấn miễn phí");
    expect(within(consult).getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/lien-he");
    expect(aside.querySelector("form, input")).toBeNull();
    expect(screen.queryByRole("region", { name: "Bài viết mới" })).toBeNull();
  });

  it("cuối trang: 'Bài viết liên quan' 3 thẻ lưới + 'Xem tất cả tin tức' → /tin-tuc, rồi banner tư vấn; JSON-LD Article + BreadcrumbList giữ", async () => {
    const { container } = await render();
    const related = screen.getByRole("heading", { level: 2, name: "Bài viết liên quan" });
    const section = related.closest("section") as HTMLElement;
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(within(section).getByRole("link", { name: "Xem tất cả tin tức" })).toHaveAttribute("href", "/tin-tuc");
    const banner = container.querySelector("[data-consult-banner]") as HTMLElement;
    expect(following(section, banner)).toBe(true);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((script) => script.textContent).join("");
    expect(ld).toContain('"Article"');
    expect(ld).toContain('"BreadcrumbList"');
  });

  it("không có heading → không mục lục (cả 2 bản); không bài liên quan → không khối liên quan; ảnh không caption/alt → không chú thích", async () => {
    findPublicNewsBySlug.mockResolvedValue({ ...doc, cover: { ...fakeMedia("cover"), id: "m1", alt: "", caption: null }, content: { root: { type: "root", children: [] } } });
    findRelatedNews.mockResolvedValue([]);
    const { container } = await render();
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Mục lục" })).toBeNull();
    expect(screen.getByRole("region", { name: "Cần chọn dự án phù hợp với ngân sách?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bài viết liên quan" })).toBeNull();
    expect(container.querySelector("figcaption")).toBeNull();
    expect(container.querySelector("figure img")).toHaveAttribute("alt", "Thị trường căn hộ quý III");
  });

  it("/en: nhãn tiếng Anh, ẩn dòng 'Thẻ:' (tags chưa localized); bài không có → 404", async () => {
    const { container } = await render("en");
    expect(screen.getByRole("region", { name: "Need a project that fits your budget?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).toHaveTextContent("TAMI HOMES Editorial Team");
    expect(screen.queryByRole("list", { name: "Tags" })).toBeNull();
    expect(container.textContent).not.toContain("Tags:");
    expect(container.querySelector('a[href*="tag="]')).toBeNull();
    findPublicNewsBySlug.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
