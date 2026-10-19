import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import type { Category, Media, Project, Province } from "@/payload-types";

const now = "2026-01-01T00:00:00.000Z";
const category = (id: string, name: string, slug: string, overrides: Partial<Category> = {}): Category => ({
  id,
  name,
  slug,
  scope: "project",
  hasEnglish: false,
  updatedAt: now,
  createdAt: now,
  ...overrides,
});
const province = (id: string, name: string, slug: string): Province => ({ id, code: id, name, shortName: name, slug, updatedAt: now, createdAt: now });
const media = (id: string): Media => ({ id, alt: id, url: `/api/media/file/${id}.webp`, width: 1600, updatedAt: now, createdAt: now });

const apartments = category("c1", "Căn hộ", "can-ho", { hasEnglish: true });
const urban = category("c2", "Khu đô thị", "khu-do-thi");
const luxury = category("c3", "Căn hộ cao cấp", "can-ho-cao-cap", { parent: apartments });
const hanoi = province("p1", "Hà Nội", "ha-noi");
const danang = province("p2", "Đà Nẵng", "da-nang");

interface Fixture {
  doc: Project;
  hasEnglish: boolean;
}
const fixture = (id: string, title: string, categoryDoc: Category, provinceDoc: Province, salesStatus: Project["salesStatus"], hasEnglish: boolean): Fixture => ({
  hasEnglish,
  doc: {
    id,
    title,
    slug: `slug-${id}`,
    summary: "s",
    status: "published",
    salesStatus,
    province: provinceDoc,
    category: categoryDoc,
    gallery: [media(`m${id}`)],
    author: "a",
    updatedAt: now,
    createdAt: now,
  } as Project,
});
const fixtures: Fixture[] = [
  fixture("1", "Sông Sài Gòn", apartments, hanoi, "selling", true),
  fixture("2", "Tây Hồ", urban, hanoi, "upcoming", true),
  fixture("3", "Biển Đà Nẵng", apartments, danang, "selling", false),
];

const listPublicProjects = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const loadPageBanner = vi.hoisted(() => vi.fn<(locale: string, key: string) => Promise<{ url: string; width: number } | undefined>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: async () => ({}) }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/content/site-identity", () => ({ loadSiteIdentity: async () => ({ siteName: "TAMI", logo: null }) }));
vi.mock("@/lib/content/load-page-banner", () => ({ loadPageBanner }));
vi.mock("@/lib/projects/project-queries", () => ({
  listProvinces: async () => [hanoi, danang],
  listRootProjectCategories: async (_payload: unknown, locale: string) => ({
    docs: [apartments, urban].filter((item) => locale === "vi" || item.hasEnglish),
  }),
  listChildProjectCategories: async () => ({ docs: [] }),
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
    getTranslations: async ({ locale, namespace }: { locale: "vi" | "en"; namespace: string }) =>
      createTranslator({ locale, messages: messages[locale], namespace: namespace as never }),
  };
});

import { ProjectListPage, buildProjectListMetadata } from "./ProjectListPage";

/** Mô phỏng ngữ nghĩa `listPublicProjects` thật (đã kiểm bằng DB ở tests/integration/projects.test.ts) trên fixture. */
listPublicProjects.mockImplementation(
  async (_payload: unknown, locale: string, query: { page: number; categoryIds?: string[]; provinceId?: string; salesStatus?: string }) => {
    const matched = fixtures
      .filter((item) => locale === "vi" || item.hasEnglish)
      .map((item) => item.doc)
      .filter((doc) => !query.categoryIds || query.categoryIds.includes((doc.category as Category).id))
      .filter((doc) => !query.provinceId || (doc.province as Province).id === query.provinceId)
      .filter((doc) => !query.salesStatus || doc.salesStatus === query.salesStatus);
    return { docs: matched, page: query.page, limit: 12, totalDocs: matched.length, totalPages: Math.max(1, Math.ceil(matched.length / 12)), hasNextPage: false, hasPrevPage: false };
  },
);

async function render(locale: "vi" | "en", searchParams: Record<string, string> = {}) {
  const ui = await ProjectListPage({ locale, searchParams });
  return renderWithIntl(ui, locale);
}
const cardTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const chipNav = () => screen.getByRole("navigation", { name: /Loại hình|Project type/ });

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tami.example"));
afterEach(() => {
  vi.unstubAllEnvs();
  listPublicProjects.mockClear();
  notFound.mockClear();
});

describe("S02 /du-an: render", () => {
  it("không lọc: mọi dự án, một h1, thẻ là h2, đếm kết quả aria-live, breadcrumb Dự án", async () => {
    await render("vi");
    expect(screen.getByRole("heading", { level: 1, name: "Dự án" })).toBeInTheDocument();
    expect(cardTitles()).toEqual(["Sông Sài Gòn", "Tây Hồ", "Biển Đà Nẵng"]);
    expect(screen.getByRole("status")).toHaveTextContent("3 dự án");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(listPublicProjects).toHaveBeenCalledWith({}, "vi", { page: 1 });
  });

  it("lọc theo tỉnh: truy vấn đúng id tỉnh, chỉ dự án của tỉnh; select giữ giá trị; có nút xoá bộ lọc về /du-an", async () => {
    await render("vi", { province: "da-nang" });
    expect(listPublicProjects).toHaveBeenCalledWith({}, "vi", { page: 1, provinceId: "p2" });
    expect(cardTitles()).toEqual(["Biển Đà Nẵng"]);
    expect(document.querySelector("input[name=province]")).toHaveValue("da-nang");
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/du-an");
  });

  it("lọc theo trạng thái mở bán và kết hợp tỉnh + trạng thái", async () => {
    await render("vi", { status: "upcoming" });
    expect(cardTitles()).toEqual(["Tây Hồ"]);
    expect(document.querySelector("input[name=status]")).toHaveValue("upcoming");
  });

  it("?category= hợp lệ lọc theo danh mục (giữ bằng input ẩn); slug lạ bị bỏ qua", async () => {
    const { container, unmount } = await render("vi", { category: "khu-do-thi", province: "ha-noi" });
    expect(listPublicProjects).toHaveBeenCalledWith({}, "vi", { page: 1, categoryIds: ["c2"], provinceId: "p1" });
    expect(cardTitles()).toEqual(["Tây Hồ"]);
    expect(container.querySelector("input[type=hidden][name=category]")).toHaveAttribute("value", "khu-do-thi");
    unmount();
    await render("vi", { category: "khong-co", status: "sai" });
    expect(cardTitles()).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Xoá bộ lọc" })).toBeNull();
  });

  it("chip Loại hình là link ?category= giữ bộ lọc tỉnh/trạng thái, bỏ trang; 'Tất cả' là chip hiện tại", async () => {
    await render("vi", { province: "ha-noi", status: "selling", page: "1" });
    const links = within(chipNav()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Tất cả", "/du-an?province=ha-noi&status=selling"],
      ["Căn hộ", "/du-an?category=can-ho&province=ha-noi&status=selling"],
      ["Khu đô thị", "/du-an?category=khu-do-thi&province=ha-noi&status=selling"],
    ]);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Tất cả"]);
  });

  it("?category= hợp lệ: chip của danh mục là chip hiện tại, phân trang giữ category, nút xoá về /du-an", async () => {
    await render("vi", { category: "can-ho", status: "selling" });
    const current = within(chipNav()).getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual(["Căn hộ"]);
    expect(cardTitles()).toEqual(["Sông Sài Gòn", "Biển Đà Nẵng"]);
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("form", { name: "Bộ lọc dự án" })).toHaveAttribute("action", "/du-an");
  });

  it("danh mục cấp 2: chip cấp 1 của danh mục cha là chip hiện tại, lọc chỉ theo danh mục con", async () => {
    await render("vi", { category: "can-ho-cao-cap" });
    expect(listPublicProjects).toHaveBeenCalledWith({}, "vi", { page: 1, categoryIds: ["c3"] });
    const current = within(chipNav()).getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual(["Căn hộ"]);
  });

  it("/en: chỉ dự án đã có bản EN, chip chỉ danh mục có EN, nhãn tiếng Anh, link /en/projects", async () => {
    await render("en");
    expect(listPublicProjects).toHaveBeenCalledWith({}, "en", { page: 1 });
    expect(cardTitles()).toEqual(["Sông Sài Gòn", "Tây Hồ"]);
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 projects");
    expect(within(chipNav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/en/projects", "/en/projects?category=can-ho"]);
    expect(screen.getByRole("link", { name: /Sông Sài Gòn/ })).toHaveAttribute("href", "/en/projects/slug-1");
  });

  it("không có kết quả khi lọc: 'Chưa có dự án phù hợp.', bộ lọc vẫn hiện, nút Xoá bộ lọc + Nhận tư vấn, ẩn lưới", async () => {
    await render("vi", { province: "da-nang", status: "upcoming" });
    expect(screen.getByRole("status")).toHaveTextContent("Chưa có dự án phù hợp.");
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/du-an");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
    expect(screen.getByRole("form", { name: "Bộ lọc dự án" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Danh sách dự án" })).toBeNull();
  });

  it("trang vượt số trang → notFound; ?page=abc về trang 1", async () => {
    await expect(render("vi", { page: "5" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    await render("vi", { page: "abc" });
    expect(listPublicProjects).toHaveBeenLastCalledWith({}, "vi", { page: 1 });
  });
});

describe("generateMetadata", () => {
  beforeEach(() => vi.stubEnv("APP_ENV", "production"));

  it("/du-an không lọc: indexable, canonical là chính nó, hreflang vi/en; trang 2 canonical kèm ?page=2", async () => {
    const meta = await buildProjectListMetadata({ locale: "vi", searchParams: {} });
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/du-an");
    expect(meta.alternates?.languages).toMatchObject({ vi: "https://tami.example/du-an", en: "https://tami.example/en/projects" });
    const page2 = await buildProjectListMetadata({ locale: "vi", searchParams: { page: "2" } });
    expect(page2.alternates?.canonical).toBe("https://tami.example/du-an?page=2");
  });

  it("có bộ lọc: noindex, follow và canonical về trang sạch (không tham số, không page)", async () => {
    const meta = await buildProjectListMetadata({ locale: "vi", searchParams: { province: "ha-noi", page: "2" } });
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe("https://tami.example/du-an");
    // `?province=` rỗng do form gửi 'Tất cả' không phải bộ lọc.
    expect((await buildProjectListMetadata({ locale: "vi", searchParams: { province: "", status: "" } })).robots).toEqual({ index: true, follow: true });
  });

  it("?category= (hợp lệ hay lạ): noindex, follow và canonical về /du-an sạch; EN cùng quy tắc", async () => {
    for (const category of ["can-ho", "khong-co"]) {
      const meta = await buildProjectListMetadata({ locale: "vi", searchParams: { category } });
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.alternates?.canonical).toBe("https://tami.example/du-an");
    }
    const en = await buildProjectListMetadata({ locale: "en", searchParams: { category: "can-ho" } });
    expect(en.alternates?.canonical).toBe("https://tami.example/en/projects");
  });
});

describe("ảnh banner trang danh sách (FR-ADM-20)", () => {
  afterEach(() => loadPageBanner.mockReset());

  it("có ảnh → biến thể Ảnh (scrim riêng), loader gọi đúng key \"projects\"", async () => {
    loadPageBanner.mockResolvedValue({ url: "/api/media/file/banner.jpg", width: 1600 });
    const { container } = await render("vi");
    expect(loadPageBanner).toHaveBeenCalledWith("vi", "projects");
    expect(container.querySelector(".bg-banner-scrim")).not.toBeNull();
    expect(container.querySelector("section.bg-dark-deep img")).not.toBeNull();
  });

  it("không có ảnh (hoặc đọc lỗi) → banner chữ như trước", async () => {
    loadPageBanner.mockResolvedValue(undefined);
    const { container } = await render("vi");
    expect(container.querySelector(".bg-banner-scrim")).toBeNull();
    expect(container.querySelector("section.bg-bg-alt")).not.toBeNull();
  });
});
