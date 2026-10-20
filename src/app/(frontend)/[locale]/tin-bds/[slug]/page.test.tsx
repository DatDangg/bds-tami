import { screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { RelatedTargets } from "@/lib/posts/post-queries";
import type { Category, Media, PropertyPost } from "@/payload-types";

const findPublicPostBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<PropertyPost> | null>>());
const findRelatedPosts = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<PropertyPost>[]>>());
const findRelatedTargets = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<RelatedTargets>>());
const getSiteSettings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/posts/post-queries", () => ({ findPublicPostBySlug, findRelatedPosts, findRelatedTargets }));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "uu-dai-mua-thu", en: "autumn-offer" }) }));
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
// ConsultBanner là Server Component async (đọc homepage CMS): jsdom không dựng được; chỉ kiểm tra trang truyền đúng props.
const consultBannerProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/layout/ConsultBanner", () => ({
  ConsultBanner: (props: unknown) => {
    consultBannerProps(props);
    return <section data-testid="consult-banner" />;
  },
}));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const { default: vi } = await import("@/i18n/messages/vi.json");
  const { default: en } = await import("@/i18n/messages/en.json");
  const messages = { vi, en };
  return {
    setRequestLocale: () => undefined,
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import PostDetailPage, { generateMetadata } from "./page";

const iso = "2026-01-01T00:00:00.000Z";
const image = (id: string): Media => ({ ...fakeMedia(id), id, mimeType: "image/webp", updatedAt: iso, createdAt: iso }) as unknown as Media;
const category = { id: "c1", name: "Voucher", slug: "voucher", scope: "property_post", hasEnglish: true, updatedAt: iso, createdAt: iso } as unknown as Category;
const richText = (text: string): PropertyPost["content"] =>
  ({ root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [{ type: "paragraph", version: 1, children: [{ type: "text", version: 1, text }] }] } }) as PropertyPost["content"];

const post = (overrides: Partial<PropertyPost> = {}): Partial<PropertyPost> => ({
  id: "p1",
  title: "Ưu đãi mùa thu",
  slug: "uu-dai-mua-thu",
  excerpt: "Giảm giá sâu cho khách mua sớm",
  status: "published",
  hasEnglish: true,
  category,
  cover: image("cover"),
  content: richText("Nội dung chi tiết của ưu đãi."),
  publishedAt: "2026-10-01T03:00:00.000Z",
  updatedAt: "2026-10-05T03:00:00.000Z",
  ...overrides,
});

async function renderPost(locale: "vi" | "en" = "vi") {
  const ui = (await PostDetailPage({ params: Promise.resolve({ locale, slug: "uu-dai-mua-thu" }) })) as ReactElement;
  return renderWithIntl(ui, locale);
}
const jsonLdItems = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>);

beforeEach(() => {
  vi.setSystemTime(new Date("2026-10-18T03:00:00.000Z"));
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  getSiteSettings.mockResolvedValue({ hotline: "0901 234 567" });
  findRelatedPosts.mockResolvedValue([]);
  findRelatedTargets.mockResolvedValue({ project: null, rental: null });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  for (const mock of [findPublicPostBySlug, findRelatedPosts, findRelatedTargets, getSiteSettings]) mock.mockReset();
});

describe("trang chi tiết Đăng tin BĐS (S09)", () => {
  it("render đủ: một h1, ngày, ảnh bìa, nội dung, vùng form lead + hotline, chia sẻ", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    await renderPost();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ưu đãi mùa thu");
    expect(screen.getByText("Nội dung chi tiết của ưu đãi.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /0901 234 567/ })).toBeInTheDocument();
    // Bài không có giá/khu vực/ưu đãi/liên quan → không dựng khối ưu đãi rỗng.
    expect(screen.queryByRole("heading", { name: "Thông tin ưu đãi" })).toBeNull();
  });

  it("khung chi tiết mới: ảnh lớn 1 ảnh (không bộ đếm), khối tiêu đề chứa h1 + chia sẻ, thanh mục con, thẻ liên hệ (aside) có form lead", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    const { container } = await renderPost();
    expect(container.querySelector("[data-detail-page]")).not.toBeNull();
    expect(container.querySelector("[data-share-variant='rail']")).toBeNull();
    const nav = screen.getByRole("navigation", { name: "Mục lục tin đăng" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan", "Nội dung"]);
    const aside = screen.getByRole("complementary");
    expect(within(aside).getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
    expect(within(aside).getByRole("link", { name: "Gọi hotline 0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    // Ảnh bìa là ảnh lớn kiểu hero, 1 ảnh: không bộ đếm / carousel; breadcrumb kính nằm trên ảnh.
    const hero = container.querySelector("[data-detail-gallery]") as HTMLElement;
    expect(hero).not.toBeNull();
    expect(hero).not.toHaveAttribute("aria-roledescription");
    expect(hero.textContent).not.toMatch(/01 \/ 01/);
    expect(hero).toContainElement(screen.getByRole("navigation", { name: "Đường dẫn trang (Breadcrumb)" }));
    // h1 + chia sẻ trong khối tiêu đề (dưới ảnh); Tổng quan là thẻ riêng có ngày đăng và danh mục.
    const h1 = screen.getByRole("heading", { level: 1 });
    const titleCard = h1.closest("div[class*='rounded-[28px]']") as HTMLElement;
    expect(titleCard).not.toBeNull();
    expect(titleCard).toHaveTextContent("Voucher");
    expect(within(titleCard).getByRole("button", { name: "Chia sẻ" })).toBeInTheDocument();
    const overview = container.querySelector("#overview") as HTMLElement;
    expect(overview).not.toContainElement(h1);
    expect(overview).toHaveTextContent("Giảm giá sâu cho khách mua sớm");
    expect(overview.querySelector("time")).not.toBeNull();
    expect(container.querySelector("[data-section-style='cards']")).toContainElement(overview);
    expect(container.querySelector("article > footer")).toBeNull();
  });

  it("thanh mục con thêm Ưu đãi / Hình ảnh khi có dữ liệu, thứ tự cố định; ảnh bìa nằm trên thanh mục con", async () => {
    findPublicPostBySlug.mockResolvedValue(post({ offer: { endAt: "2026-10-30T12:00:00.000Z" }, gallery: [image("g1")] as PropertyPost["gallery"] }));
    const { container } = await renderPost();
    const nav = screen.getByRole("navigation", { name: "Mục lục tin đăng" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Tổng quan", "Ưu đãi", "Nội dung", "Hình ảnh"]);
    expect(container.querySelector("#offer")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Hình ảnh" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("ưu đãi còn hạn: khối ưu đãi TRƯỚC nội dung, có mã voucher và nút sao chép", async () => {
    findPublicPostBySlug.mockResolvedValue(post({ offer: { endAt: "2026-10-30T12:00:00.000Z", voucherCode: "TAMI500" }, priceVnd: 5_500_000 }));
    await renderPost();
    const box = screen.getByRole("region", { name: "Thông tin ưu đãi" });
    expect(box).toHaveTextContent("TAMI500");
    expect(box).toHaveTextContent("5.500.000 ₫");
    expect(screen.getByRole("button", { name: "Sao chép" })).toBeInTheDocument();
    const content = screen.getByText("Nội dung chi tiết của ưu đãi.");
    expect(box.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("ưu đãi hết hạn: trang vẫn mở (200) với badge 'Đã kết thúc', ẩn mã voucher và nút sao chép", async () => {
    findPublicPostBySlug.mockResolvedValue(post({ offer: { endAt: "2026-10-17T12:00:00.000Z", voucherCode: "TAMI500" } }));
    const { container } = await renderPost();
    expect(screen.getAllByText("Đã kết thúc").length).toBeGreaterThan(0);
    expect(screen.getByText("Ưu đãi đã kết thúc")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sao chép" })).toBeNull();
    expect(container.innerHTML).not.toContain("TAMI500");
    // Form vẫn nhận khách ở bài hết hạn, tiêu đề không đổi.
    expect(screen.getByRole("heading", { level: 2, name: "Nhận tư vấn" })).toBeInTheDocument();
  });

  it("JSON-LD Article (kèm BreadcrumbList): URL canonical, tiêu đề, ảnh, ngày, publisher", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    const { container } = await renderPost();
    const article = jsonLdItems(container).find((item) => item["@type"] === "Article");
    expect(article).toMatchObject({
      headline: "Ưu đãi mùa thu",
      datePublished: "2026-10-01T03:00:00.000Z",
      mainEntityOfPage: { "@id": "https://tami.example/tin-bds/uu-dai-mua-thu" },
      publisher: { "@type": "Organization", name: "TAMI" },
      inLanguage: "vi",
    });
    expect(article?.image).toEqual(["https://tami.example/api/media/file/cover-1600.webp"]);
    expect(jsonLdItems(container).some((item) => item["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("bài liên quan: heading h3 trong khối 'Tin liên quan'", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    findRelatedPosts.mockResolvedValue([post({ id: "p2", title: "Tin khác", slug: "tin-khac" })]);
    await renderPost();
    expect(screen.getByRole("heading", { level: 2, name: "Tin liên quan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Tin khác" })).toBeInTheDocument();
  });

  it("banner tư vấn cuối trang: nút chính cuộn tới #lead-form, nút phụ gọi hotline; sau Tin liên quan", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    findRelatedPosts.mockResolvedValue([post({ id: "p2", title: "Tin khác", slug: "tin-khac" })]);
    await renderPost();
    expect(consultBannerProps).toHaveBeenCalledWith(expect.objectContaining({ locale: "vi", actionHref: "#lead-form", secondary: { label: "Gọi hotline 0901 234 567", href: "tel:0901234567" } }));
    const related = screen.getByRole("heading", { level: 2, name: "Tin liên quan" });
    expect(related.compareDocumentPosition(screen.getByTestId("consult-banner")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("ưu đãi: badge trạng thái, giá và khu vực hiện ở khối tiêu đề", async () => {
    findPublicPostBySlug.mockResolvedValue(post({ offer: { endAt: "2026-10-20T12:00:00.000Z" }, priceVnd: 5_500_000 }));
    await renderPost();
    const titleCard = screen.getByRole("heading", { level: 1 }).closest("div[class*='rounded-[28px]']") as HTMLElement;
    expect(titleCard).toHaveTextContent("5.500.000 ₫");
    expect(titleCard).toHaveTextContent(/Còn \d+ ngày/);
  });

  it("không có bài (không tồn tại / chưa công khai / thiếu bản EN) → notFound", async () => {
    findPublicPostBySlug.mockResolvedValue(null);
    await expect(renderPost()).rejects.toThrow();
    await expect(renderPost("en")).rejects.toThrow();
  });
});

describe("generateMetadata", () => {
  const meta = (locale: "vi" | "en" = "vi") => generateMetadata({ params: Promise.resolve({ locale, slug: "uu-dai-mua-thu" }) });

  it("canonical + hreflang cả hai ngôn ngữ khi có bản EN; mô tả = excerpt", async () => {
    findPublicPostBySlug.mockResolvedValue(post());
    const metadata = await meta();
    expect(metadata.description).toBe("Giảm giá sâu cho khách mua sớm");
    expect(metadata.alternates?.canonical).toBe("https://tami.example/tin-bds/uu-dai-mua-thu");
    expect(metadata.alternates?.languages).toMatchObject({ vi: "https://tami.example/tin-bds/uu-dai-mua-thu", en: "https://tami.example/en/property-news/autumn-offer" });
  });

  it("bài chưa có bản EN: không hreflang en; không có bài → metadata rỗng", async () => {
    findPublicPostBySlug.mockResolvedValue(post({ hasEnglish: false }));
    expect((await meta()).alternates?.languages?.en).toBeUndefined();
    findPublicPostBySlug.mockResolvedValue(null);
    expect(await meta()).toEqual({});
  });
});
