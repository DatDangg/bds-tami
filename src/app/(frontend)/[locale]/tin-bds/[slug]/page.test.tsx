import { screen } from "@testing-library/react";
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
vi.mock("next-intl/server", () => ({ setRequestLocale: () => undefined }));

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
    expect(screen.getByRole("group", { name: "Chia sẻ bài viết" })).toBeInTheDocument();
    // Bài không có giá/khu vực/ưu đãi/liên quan → không dựng khối ưu đãi rỗng.
    expect(screen.queryByRole("heading", { name: "Thông tin ưu đãi" })).toBeNull();
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
