import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import type { Media, Project, Province } from "@/payload-types";

const findPublicProjectBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Project> | null>>());
const findOtherProjects = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<Partial<Project>[]>>());
const findProjectListings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<{ rentals: unknown[]; posts: unknown[] }>>());
const getSiteSettings = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/projects/project-queries", () => ({ findPublicProjectBySlug, findOtherProjects }));
vi.mock("@/lib/projects/project-listings", () => ({ findProjectListings }));
vi.mock("@/lib/news/news-queries", () => ({ findLocalizedSlugs: async () => ({ vi: "song-sai-gon", en: "saigon-riverside" }) }));
vi.mock("@/lib/content/get-globals", () => ({ getSiteSettings }));
// ConsultBanner là Server Component async (đọc homepage CMS): jsdom không dựng được; chỉ kiểm tra trang truyền đúng props.
const consultBannerProps = vi.hoisted(() => vi.fn());
vi.mock("@/components/layout/ConsultBanner", () => ({
  ConsultBanner: (props: unknown) => {
    consultBannerProps(props);
    return <section data-testid="consult-banner" />;
  },
}));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
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

import ProjectDetailPage, { generateMetadata } from "./page";

const now = "2026-01-01T00:00:00.000Z";
const image = (id: string, alt = `Ảnh ${id}`): Media => ({ ...fakeMedia(id, alt), id, mimeType: "image/webp", updatedAt: now, createdAt: now });
const province: Province = { id: "p1", code: "01", name: "Thành phố Hà Nội", shortName: "Hà Nội", slug: "ha-noi", updatedAt: now, createdAt: now };
const project = (overrides: Partial<Project> = {}): Partial<Project> => ({
  id: "d1",
  title: "Dự án Sông Sài Gòn",
  slug: "song-sai-gon",
  summary: "Căn hộ ven sông",
  salesStatus: "selling",
  hasEnglish: false,
  province,
  address: "Quận 1",
  publishedAt: "2026-02-03T00:00:00.000Z",
  gallery: [image("g1"), image("g2")],
  ...overrides,
});

async function renderProject(locale: "vi" | "en" = "vi", slug = "song-sai-gon") {
  const ui = await ProjectDetailPage({ params: Promise.resolve({ locale, slug }) });
  return renderWithIntl(ui, locale);
}

const jsonLdItems = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent ?? "null") as Record<string, unknown>);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example");
  getSiteSettings.mockResolvedValue({ hotline: "0901 234 567" });
  findOtherProjects.mockResolvedValue([]);
  findProjectListings.mockResolvedValue({ rentals: [], posts: [] });
});
afterEach(() => {
  findProjectListings.mockReset();
  vi.unstubAllEnvs();
  findPublicProjectBySlug.mockReset();
  findOtherProjects.mockReset();
  getSiteSettings.mockReset();
});

describe("trang chi tiết dự án (S03)", () => {
  it("render đủ: một h1 tên dự án, form lead có hotline từ site-settings, dự án khác là thẻ link h3", async () => {
    findPublicProjectBySlug.mockResolvedValue(project());
    findOtherProjects.mockResolvedValue([project({ id: "d2", title: "Dự án B", slug: "du-an-b" })]);
    const { container } = await renderProject();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    expect(container.querySelector("#lead-form")).not.toBeNull();
    expect(screen.getByRole("link", { name: "0901 234 567" })).toHaveAttribute("href", "tel:0901234567");
    const related = screen.getByRole("heading", { level: 2, name: /Dự án tương tự/ }).closest("section") as HTMLElement;
    expect(within(related).getByRole("heading", { level: 3, name: "Dự án B" })).toBeInTheDocument();
    expect(within(related).getByRole("link")).toHaveAttribute("href", "/du-an/du-an-b");
    expect(findOtherProjects).toHaveBeenCalledWith({}, "vi", expect.objectContaining({ id: "d1" }));
    // Banner tư vấn cuối trang: nút chính cuộn tới form tại chỗ, nút phụ gọi hotline.
    expect(screen.getByTestId("consult-banner")).toBeInTheDocument();
    expect(consultBannerProps).toHaveBeenCalledWith({ locale: "vi", actionHref: "#lead-form", secondary: { label: "Gọi hotline: 0901 234 567", href: "tel:0901234567" } });
  });

  it("Tin liên quan: đọc đúng dự án + locale, thẻ cho thuê/tin BĐS hiện trong khối có neo; trống → không có khối", async () => {
    findPublicProjectBySlug.mockResolvedValue(project());
    findProjectListings.mockResolvedValue({
      rentals: [{ id: "r1", title: "Căn 2PN view sông", slug: "can-2pn", status: "published", code: "CT-000001", areaM2: 70, priceMonthlyVnd: 12_000_000, gallery: [] }],
      posts: [{ id: "a1", title: "Ưu đãi tháng 10", slug: "uu-dai", excerpt: "Giảm 5%", gallery: [] }],
    });
    await renderProject();
    expect(findProjectListings).toHaveBeenCalledWith({}, "vi", "d1", expect.any(Date));
    const block = screen.getByRole("heading", { level: 2, name: "Tin liên quan" }).closest("section") as HTMLElement;
    expect(block.id).toBe("related-listings");
    expect(within(block).getByRole("heading", { level: 3, name: "Căn 2PN view sông" }).closest("a")).toHaveAttribute("href", "/cho-thue/can-2pn");
    expect(within(block).getByRole("heading", { level: 3, name: "Ưu đãi tháng 10" }).closest("a")).toHaveAttribute("href", "/tin-bds/uu-dai");
    expect(screen.getByRole("navigation", { name: "Mục lục dự án" })).toHaveTextContent("Tin liên quan");
  });

  it("không có tin liên quan → không khối, không mục con", async () => {
    findPublicProjectBySlug.mockResolvedValue(project());
    await renderProject();
    expect(screen.queryByRole("heading", { name: "Tin liên quan" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Mục lục dự án" })).not.toHaveTextContent("Tin liên quan");
  });

  it("site-settings lỗi (DB tắt) → trang vẫn dựng, chỉ không có hotline", async () => {
    findPublicProjectBySlug.mockResolvedValue(project());
    getSiteSettings.mockRejectedValue(new Error("db down"));
    await renderProject();
    expect(consultBannerProps).toHaveBeenCalledWith({ locale: "vi", actionHref: "#lead-form" });
    expect(screen.getByRole("heading", { level: 1, name: "Dự án Sông Sài Gòn" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "0901 234 567" })).toBeNull();
  });

  it("dự án đã xuất bản nhưng mọi ảnh gallery bị xoá → ảnh lớn nền tối, không ảnh, không vỡ", async () => {
    findPublicProjectBySlug.mockResolvedValue(project({ gallery: [null as never, "id-con"] }));
    const { container } = await renderProject();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(await generateMetadata({ params: Promise.resolve({ locale: "vi", slug: "song-sai-gon" }) })).toMatchObject({ title: expect.stringContaining("Dự án Sông Sài Gòn") });
  });

  it("EN chưa dịch / chưa công khai / slug lạ → notFound (404), metadata rỗng", async () => {
    findPublicProjectBySlug.mockResolvedValue(null);
    await expect(ProjectDetailPage({ params: Promise.resolve({ locale: "en", slug: "chua-dich" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    await expect(ProjectDetailPage({ params: Promise.resolve({ locale: "vi", slug: "khong-co" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(await generateMetadata({ params: Promise.resolve({ locale: "en", slug: "chua-dich" }) })).toEqual({});
    expect(findPublicProjectBySlug).toHaveBeenCalledWith({}, "en", "chua-dich");
  });

  it("locale sai → notFound", async () => {
    await expect(ProjectDetailPage({ params: Promise.resolve({ locale: "fr", slug: "x" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(findPublicProjectBySlug).not.toHaveBeenCalled();
  });

  it("JSON-LD RealEstateListing + BreadcrumbList: inLanguage, URL tuyệt đối, ảnh; tiêu đề có </script> không phá thẻ script", async () => {
    findPublicProjectBySlug.mockResolvedValue(project({ title: "A </script><script>alert(1)</script>" }));
    const { container } = await renderProject();
    const items = jsonLdItems(container);
    const listing = items.find((item) => item["@type"] === "RealEstateListing");
    expect(listing).toMatchObject({
      url: "https://tami.example/du-an/song-sai-gon",
      inLanguage: "vi",
      datePosted: "2026-02-03T00:00:00.000Z",
      contentLocation: { address: "Quận 1, Hà Nội" },
      // G26: Organization (publisher) trong JSON-LD RealEstateListing.
      publisher: { "@type": "Organization", name: "TAMI", url: "https://tami.example" },
    });
    expect(listing?.image).toEqual(["https://tami.example/api/media/file/g1-1600.webp", "https://tami.example/api/media/file/g2-1600.webp"]);
    expect(items.find((item) => item["@type"] === "BreadcrumbList")).toBeDefined();
    // Không có script chèn được: chỉ các thẻ ld+json, không có thẻ script nào khác trong HTML trang.
    expect(container.querySelectorAll("script")).toHaveLength(items.length);
    expect(container.querySelector("script[type='application/ld+json']")?.innerHTML).not.toContain("</script>");
  });

  it("/en: khung trang tiếng Anh, JSON-LD inLanguage en, breadcrumb về /en/projects", async () => {
    findPublicProjectBySlug.mockResolvedValue(project({ title: "Saigon Riverside", slug: "saigon-riverside", hasEnglish: true }));
    const { container } = await renderProject("en", "saigon-riverside");
    expect(screen.getByRole("heading", { level: 2, name: "Get project information" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/en/projects");
    expect(jsonLdItems(container).find((item) => item["@type"] === "RealEstateListing")).toMatchObject({ inLanguage: "en", url: "https://tami.example/en/projects/saigon-riverside" });
    expect(container.textContent).not.toMatch(/Nhận|Tổng quan|Thư viện/);
  });

  it("metadata: canonical theo ngôn ngữ, hreflang en chỉ khi có bản EN, og:image = ảnh đầu thư viện, noindex ngoài production", async () => {
    findPublicProjectBySlug.mockResolvedValueOnce(project({ hasEnglish: false }));
    const noEn = await generateMetadata({ params: Promise.resolve({ locale: "vi", slug: "song-sai-gon" }) });
    expect(noEn.alternates?.canonical).toBe("https://tami.example/du-an/song-sai-gon");
    expect(noEn.alternates?.languages).toBeUndefined();
    expect(noEn.robots).toMatchObject({ index: false });
    expect((noEn.openGraph?.images as { url: string }[])[0]?.url).toBe("https://tami.example/api/media/file/g1.jpg");

    vi.stubEnv("APP_ENV", "production");
    findPublicProjectBySlug.mockResolvedValueOnce(project({ hasEnglish: true }));
    const withEn = await generateMetadata({ params: Promise.resolve({ locale: "vi", slug: "song-sai-gon" }) });
    expect(withEn.robots).toMatchObject({ index: true });
    expect(withEn.alternates?.languages).toMatchObject({ en: "https://tami.example/en/projects/saigon-riverside", vi: "https://tami.example/du-an/song-sai-gon" });
  });
});
