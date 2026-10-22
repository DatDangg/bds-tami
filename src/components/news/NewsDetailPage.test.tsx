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
const loadNewsContactNote = vi.hoisted(() => vi.fn());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-news-contact-note", () => ({ loadNewsContactNote }));
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
/** Lưới thân bài: phần tử cha của nội dung `news-prose` ở cấp lưới (cột bài). */
const bodyGrid = (container: HTMLElement) => (container.querySelector("[data-richtext]") as HTMLElement).closest(".grid") as HTMLElement;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  findPublicNewsBySlug.mockResolvedValue(doc);
  findRelatedNews.mockResolvedValue([other("r1"), other("r2"), other("r3")]);
  loadNewsContactNote.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("S11 /tin-tuc/[slug] v2 (BL-062, design chi-tiet-tin-tuc-v2.webp)", () => {
  it("hero ảnh bìa: breadcrumb → chip danh mục (link) → 1 h1 → sapo → tác giả 'Bài viết bởi TAMI REAL ESTATE' (không tên staff) · Ngày đăng · phút đọc + chia sẻ", async () => {
    const { container } = await render();
    expect(container.querySelector("[data-detail-page]")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Thị trường căn hộ quý III");
    const hero = h1.closest("[data-news-hero]") as HTMLElement;
    expect(hero).not.toBeNull();
    // Ảnh bìa nằm TRONG hero (nền trang trí, alt rỗng), không còn figure ảnh bìa trong thân.
    expect(hero.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("figure")).toBeNull();
    const crumbs = within(hero).getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" });
    expect(within(crumbs).getByRole("link", { name: "Tin tức" })).toHaveAttribute("href", "/tin-tuc");
    const header = h1.closest("header") as HTMLElement;
    expect(following(crumbs, header)).toBe(true);
    const chip = within(header).getByRole("link", { name: "Thị trường" });
    expect(chip).toHaveAttribute("href", "/tin-tuc/danh-muc/thi-truong");
    expect(following(chip, h1)).toBe(true);
    expect(within(header).getByText("Tóm tắt")).toBeInTheDocument();
    expect(header).toHaveTextContent("Bài viết bởi TAMI REAL ESTATE");
    expect(container.textContent).not.toContain("Nguyễn Văn Biên Tập");
    expect(container.textContent).not.toContain("Ban biên tập");
    expect(within(header).getByText("Ngày đăng: 18/10/2026").tagName).toBe("TIME");
    expect(header).toHaveTextContent("Ngày đăng: 18/10/2026");
    expect(header).toHaveTextContent("phút đọc");
    const share = within(hero).getByRole("group", { name: "Chia sẻ bài viết" });
    expect(within(share).getByRole("link", { name: "Chia sẻ lên Facebook" }).getAttribute("href")).toContain(encodeURIComponent("https://tami.example/tin-tuc/thi-truong-can-ho"));
    expect(within(share).getByRole("button", { name: "Sao chép liên kết" })).toBeInTheDocument();
    expect(within(share).getByRole("link", { name: "Chia sẻ lên Facebook" }).className).toContain("border-on-dark");
  });

  it("không ảnh bìa → hero vẫn render (nền tối, chỉ còn logo tác giả, không ảnh bìa)", async () => {
    findPublicNewsBySlug.mockResolvedValue({ ...doc, cover: null });
    const { container } = await render();
    const hero = screen.getByRole("heading", { level: 1 }).closest("[data-news-hero]") as HTMLElement;
    expect(hero.querySelector("img:not([src*='brand'])")).toBeNull();
    expect(hero.className).toContain("bg-dark");
    expect(container.querySelector("figure")).toBeNull();
  });

  it("thân bài: mục lục gập (< lg) → nội dung news-prose → khung liên hệ → 'Thẻ:'; beacon gửi id bài", async () => {
    const { container } = await render();
    const toc = container.querySelector("details") as HTMLElement;
    expect(toc.className).toContain("lg:hidden");
    const body = container.querySelector("[data-richtext]") as HTMLElement;
    expect(body.className).toContain("news-prose");
    expect(following(toc, body)).toBe(true);
    const note = screen.getByRole("note");
    expect(following(body, note)).toBe(true);
    const tags = screen.getByRole("list", { name: "Từ khoá" });
    expect(following(note, tags)).toBe(true);
    expect(tags.parentElement).toHaveTextContent("Thẻ:");
    // Chip bỏ '#', vẫn là link ?tag=.
    expect(within(tags).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Hà Nội", `/tin-tuc?${new URLSearchParams({ tag: "Hà Nội" }).toString()}`],
      ["Căn hộ", `/tin-tuc?${new URLSearchParams({ tag: "Căn hộ" }).toString()}`],
    ]);
    expect(container.querySelectorAll("[data-beacon]")).toHaveLength(1);
    expect(container.querySelector("[data-beacon]")).toHaveAttribute("data-beacon", "n1");
  });

  it("cột trái = DetailAsideFit div (không aside thừa) mang --detail-aside-top, con đầu dính; ≥ lg cột 1, sau nội dung trong DOM; mục lục + thẻ tư vấn → /lien-he, không form", async () => {
    const { container } = await render();
    const grid = bodyGrid(container);
    expect(grid.className).not.toContain("items-start");
    const fit = container.querySelector('[class*="--detail-aside-top"]') as HTMLElement;
    expect(fit.tagName).toBe("DIV");
    expect(fit.className).toContain("--detail-aside-top:calc(var(--sticky-top)+1.5rem)");
    expect(fit.className).toContain("lg:col-start-1");
    expect(grid.contains(fit)).toBe(true);
    expect(container.querySelector("aside:not([data-consult-banner])")).toBeNull();
    const sticky = fit.firstElementChild as HTMLElement;
    expect(sticky.className).toContain("lg:sticky");
    expect(sticky.className).toContain("--detail-aside-top");
    expect(following(container.querySelector("[data-richtext]") as HTMLElement, fit)).toBe(true);
    const toc = within(fit).getByRole("navigation", { name: "Mục lục" });
    expect(toc.className).toContain("lg:block");
    expect(within(toc).getAllByRole("link").map((link) => link.textContent)).toEqual(["01Giá thuê giữ ổn định", "Phân khúc dịch vụ"]);
    const consult = within(fit).getByRole("region", { name: "Cần chọn dự án phù hợp với ngân sách?" });
    expect(consult).toHaveTextContent("Tư vấn miễn phí");
    expect(within(consult).getByRole("link", { name: /Nhận tư vấn/ })).toHaveAttribute("href", "/lien-he");
    expect(fit.querySelector("form, input")).toBeNull();
    expect(screen.queryByRole("region", { name: "Bài viết mới" })).toBeNull();
  });

  it("'Bài viết liên quan' NẰM NGOÀI lưới thân bài (cột trái thôi dính trước khối này): 3 thẻ related h3 + 'Xem tất cả tin tức' → /tin-tuc, rồi banner; JSON-LD giữ", async () => {
    const { container } = await render();
    const related = screen.getByRole("heading", { level: 2, name: "Bài viết liên quan" });
    const section = related.closest("section") as HTMLElement;
    expect(bodyGrid(container).contains(section)).toBe(false);
    expect(following(bodyGrid(container), section)).toBe(true);
    expect(section.className).toContain("bg-surface");
    expect(within(section).getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(section.querySelectorAll("li > article")).toHaveLength(3);
    expect(within(section).getByRole("link", { name: "Xem tất cả tin tức" })).toHaveAttribute("href", "/tin-tuc");
    const banner = container.querySelector("[data-consult-banner]") as HTMLElement;
    expect(following(section, banner)).toBe(true);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((script) => script.textContent).join("");
    expect(ld).toContain('"Article"');
    expect(ld).toContain('"BreadcrumbList"');
    expect(ld).toContain("cover-1600.webp");
  });

  it("không heading → không mục lục (thẻ tư vấn vẫn có); 0 bài liên quan → không khối liên quan; 1-2 bài → hiện số có", async () => {
    findPublicNewsBySlug.mockResolvedValue({ ...doc, content: { root: { type: "root", children: [] } } });
    findRelatedNews.mockResolvedValue([]);
    const { container, unmount } = await render();
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Mục lục" })).toBeNull();
    expect(screen.getByRole("region", { name: "Cần chọn dự án phù hợp với ngân sách?" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bài viết liên quan" })).toBeNull();
    unmount();
    findRelatedNews.mockResolvedValue([other("r1"), other("r2")]);
    await render();
    expect(within(screen.getByRole("heading", { level: 2, name: "Bài viết liên quan" }).closest("section") as HTMLElement).getAllByRole("heading", { level: 3 })).toHaveLength(2);
  });

  it("khung liên hệ cuối bài: chữ admin (văn bản thuần, 'TAMI REAL ESTATE' thành link /lien-he#lead-form); HTML trong chữ không được render", async () => {
    loadNewsContactNote.mockResolvedValue("Gọi TAMI REAL ESTATE ngay, hoặc TAMI REAL ESTATE qua email. <img src=x onerror=alert(1)>");
    const { container } = await render();
    expect(loadNewsContactNote).toHaveBeenCalledWith("vi");
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("Gọi TAMI REAL ESTATE ngay, hoặc TAMI REAL ESTATE qua email. <img src=x onerror=alert(1)>");
    expect(note.querySelector("img")).toBeNull();
    const links = within(note).getAllByRole("link", { name: "TAMI REAL ESTATE" });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/lien-he#lead-form");
    expect(container.querySelectorAll('[role="note"]')).toHaveLength(1);
  });

  it("khung liên hệ rỗng → câu mặc định (vi + en), 'TAMI REAL ESTATE' là link tới trang liên hệ theo ngôn ngữ", async () => {
    const { unmount } = await render();
    let note = screen.getByRole("note");
    expect(note).toHaveTextContent("quý khách vui lòng liên hệ TAMI REAL ESTATE qua hotline");
    expect(within(note).getByRole("link", { name: "TAMI REAL ESTATE" })).toHaveAttribute("href", "/lien-he#lead-form");
    unmount();
    await render("en");
    expect(loadNewsContactNote).toHaveBeenLastCalledWith("en");
    note = screen.getByRole("note");
    expect(note).toHaveTextContent("please contact TAMI REAL ESTATE via our hotline");
    expect(within(note).getByRole("link", { name: "TAMI REAL ESTATE" })).toHaveAttribute("href", "/en/contact#lead-form");
  });

  it("/en: nhãn tiếng Anh, ẩn dòng 'Thẻ:' (tags chưa localized); bài không có → 404", async () => {
    const { container } = await render("en");
    expect(screen.getByRole("region", { name: "Need a project that fits your budget?" })).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 1 }).closest("header") as HTMLElement;
    expect(header).toHaveTextContent("By TAMI REAL ESTATE");
    expect(header).toHaveTextContent("Published: 10/18/2026");
    expect(screen.queryByRole("list", { name: "Tags" })).toBeNull();
    expect(container.textContent).not.toContain("Tags:");
    expect(container.querySelector('a[href*="tag="]')).toBeNull();
    findPublicNewsBySlug.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
