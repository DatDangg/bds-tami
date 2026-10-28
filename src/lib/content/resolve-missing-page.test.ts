import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findPublicBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const findPublicOne = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("./public-queries", () => ({ findPublicBySlug, findPublicOne }));
vi.mock("../logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import {
  clearMissingPageCache,
  EXISTS_CACHE_TTL_MS,
  matchDynamicPage,
  MISSING_CACHE_TTL_MS,
  MISSING_PAGE_RULES,
  MISSING_LOOKUP_TIMEOUT_MS,
  resolveMissingPage,
} from "./resolve-missing-page";

beforeEach(() => {
  vi.useFakeTimers();
  clearMissingPageCache();
  findPublicBySlug.mockReset();
  findPublicOne.mockReset();
});
afterEach(() => vi.useRealTimers());

describe("matchDynamicPage", () => {
  it("khớp URL công khai vi/en của tin tức và danh mục tin tức, lấy slug + ngôn ngữ", () => {
    expect(matchDynamicPage("/tin-tuc/bai-moi")).toMatchObject({ locale: "vi", slug: "bai-moi", rule: { collection: "news" } });
    expect(matchDynamicPage("/en/news/new-post")).toMatchObject({ locale: "en", slug: "new-post", rule: { collection: "news" } });
    expect(matchDynamicPage("/tin-tuc/danh-muc/thi-truong")).toMatchObject({ locale: "vi", slug: "thi-truong", rule: { collection: "categories" } });
    expect(matchDynamicPage("/en/news/category/market")).toMatchObject({ locale: "en", slug: "market", rule: { collection: "categories" } });
  });

  it("bỏ dấu / cuối và giải mã slug; mã hoá hỏng → slug rỗng (coi là không có)", () => {
    expect(matchDynamicPage("/tin-tuc/bai-moi/")?.slug).toBe("bai-moi");
    expect(matchDynamicPage("/tin-tuc/a%20b")?.slug).toBe("a b");
    expect(matchDynamicPage("/tin-tuc/%E0%A4%A")?.slug).toBe("");
  });

  it("không khớp: trang chủ, danh sách, đường dẫn tiếng Anh ở nhánh vi, nhiều đoạn, trang khác", () => {
    for (const path of ["/", "/tin-tuc", "/en/news", "/news/x", "/en/tin-tuc/x", "/tin-tuc/a/b", "/du-an", "/en/projects", "/du-an/a/b", "/vi/tin-tuc/x"]) {
      expect(matchDynamicPage(path), path).toBeNull();
    }
  });

  it("khớp dịch vụ vi/en và URL cố định của trang pháp lý (không slug)", () => {
    expect(matchDynamicPage("/dich-vu/moi-gioi")).toMatchObject({ locale: "vi", slug: "moi-gioi", rule: { collection: "services" } });
    expect(matchDynamicPage("/en/services/brokerage")).toMatchObject({ locale: "en", slug: "brokerage", rule: { collection: "services" } });
    expect(matchDynamicPage("/chinh-sach-bao-mat")).toMatchObject({ locale: "vi", slug: "", rule: { collection: "pages", where: { kind: { equals: "privacy" } } } });
    expect(matchDynamicPage("/en/terms-of-use/")).toMatchObject({ locale: "en", slug: "", rule: { collection: "pages", where: { kind: { equals: "terms" } } } });
    for (const path of ["/dich-vu", "/dich-vu/a/b", "/en/chinh-sach-bao-mat", "/privacy-policy", "/chinh-sach-bao-mat/x", "/lien-he", "/en/contact"]) {
      expect(matchDynamicPage(path), path).toBeNull();
    }
  });

  it("`/tin-tuc/danh-muc` (không có trang) được coi là slug tin tức không tồn tại → 404 đầy đủ", () => {
    expect(matchDynamicPage("/tin-tuc/danh-muc")).toMatchObject({ slug: "danh-muc", rule: { collection: "news" } });
  });
});

describe("resolveMissingPage", () => {
  it("trang tồn tại → null; không tồn tại → ngôn ngữ của URL (để proxy rewrite 404 SSR)", async () => {
    findPublicBySlug.mockResolvedValueOnce({ id: "1" }).mockResolvedValueOnce(null);
    expect(await resolveMissingPage("/tin-tuc/co")).toBeNull();
    expect(await resolveMissingPage("/en/news/khong")).toBe("en");
  });

  it("truyền đúng collection, locale, slug và điều kiện scope của danh mục", async () => {
    findPublicBySlug.mockResolvedValue(null);
    await resolveMissingPage("/en/news/category/market");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "categories", "en", "market", { depth: 0, where: { scope: { equals: "news" } } });
  });

  it("dự án: khớp vi/en và tra theo slug của ngôn ngữ URL (EN chưa có bản dịch → 404 EN)", async () => {
    expect(matchDynamicPage("/du-an/can-ho-a")).toMatchObject({ locale: "vi", slug: "can-ho-a", rule: { collection: "projects" } });
    expect(matchDynamicPage("/en/projects/apartment-a")).toMatchObject({ locale: "en", slug: "apartment-a", rule: { collection: "projects" } });
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/projects/chua-dich")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "projects", "en", "chua-dich", { depth: 0 });
  });

  it("cho thuê (G27): khớp vi/en, tra rentals theo slug của ngôn ngữ URL; danh sách và trang danh mục/khu vực không bị khớp", async () => {
    expect(matchDynamicPage("/cho-thue/can-ho-a")).toMatchObject({ locale: "vi", slug: "can-ho-a", rule: { collection: "rentals" } });
    expect(matchDynamicPage("/en/for-rent/apartment-a")).toMatchObject({ locale: "en", slug: "apartment-a", rule: { collection: "rentals" } });
    expect(matchDynamicPage("/cho-thue")).toBeNull();
    expect(matchDynamicPage("/en/for-rent")).toBeNull();
    expect(matchDynamicPage("/en/for-rent/area/ha-noi")).toBeNull();
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/cho-thue/khong-co")).toBe("vi");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "rentals", "vi", "khong-co", { depth: 0 });
  });

  it("danh mục Cho thuê (S05): khớp vi/en, tra categories scope rental theo slug của ngôn ngữ URL → slug lạ / xoá mềm / chưa có EN là 404 đầy đủ", async () => {
    expect(matchDynamicPage("/cho-thue/danh-muc/can-ho")).toMatchObject({ locale: "vi", slug: "can-ho", rule: { collection: "categories" } });
    expect(matchDynamicPage("/en/for-rent/category/apartment")).toMatchObject({ locale: "en", slug: "apartment", rule: { collection: "categories" } });
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/for-rent/category/khong-co")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "categories", "en", "khong-co", { depth: 0, where: { scope: { equals: "rental" } } });
    findPublicBySlug.mockResolvedValue({ id: "c1" });
    expect(await resolveMissingPage("/cho-thue/danh-muc/can-ho")).toBeNull();
  });

  it("danh mục Dự án (S05, BL-090): khớp vi/en, tra categories scope project; `/du-an/danh-muc` (1 đoạn) vẫn là slug dự án", async () => {
    expect(matchDynamicPage("/du-an/danh-muc/khu-do-thi")).toMatchObject({ locale: "vi", slug: "khu-do-thi", rule: { collection: "categories" } });
    expect(matchDynamicPage("/en/projects/category/urban-areas")).toMatchObject({ locale: "en", slug: "urban-areas", rule: { collection: "categories" } });
    expect(matchDynamicPage("/du-an/danh-muc")).toMatchObject({ slug: "danh-muc", rule: { collection: "projects" } });
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/projects/category/khong-co")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "categories", "en", "khong-co", { depth: 0, where: { scope: { equals: "project" } } });
    findPublicBySlug.mockResolvedValue({ id: "c1" });
    expect(await resolveMissingPage("/du-an/danh-muc/khu-do-thi")).toBeNull();
  });

  it("Đăng tin BĐS (G27): khớp chi tiết + danh mục vi/en, tra property-posts / categories (scope property_post); danh sách /tin-bds không bị khớp", async () => {
    expect(matchDynamicPage("/tin-bds/uu-dai-a")).toMatchObject({ locale: "vi", slug: "uu-dai-a", rule: { collection: "property-posts" } });
    expect(matchDynamicPage("/en/property-news/offer-a")).toMatchObject({ locale: "en", slug: "offer-a", rule: { collection: "property-posts" } });
    expect(matchDynamicPage("/tin-bds/danh-muc/voucher")).toMatchObject({ locale: "vi", slug: "voucher", rule: { collection: "categories" } });
    expect(matchDynamicPage("/en/property-news/category/voucher")).toMatchObject({ locale: "en", slug: "voucher", rule: { collection: "categories" } });
    expect(matchDynamicPage("/tin-bds")).toBeNull();
    expect(matchDynamicPage("/en/property-news")).toBeNull();
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/property-news/khong-co")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "property-posts", "en", "khong-co", { depth: 0 });
    expect(await resolveMissingPage("/tin-bds/danh-muc/khong-co")).toBe("vi");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "categories", "vi", "khong-co", { depth: 0, where: { scope: { equals: "property_post" } } });
  });

  it("tuyển dụng: khớp vi/en, tra job-postings theo slug của ngôn ngữ URL; danh sách /tuyen-dung không bị khớp", async () => {
    expect(matchDynamicPage("/tuyen-dung/sales")).toMatchObject({ locale: "vi", slug: "sales", rule: { collection: "job-postings" } });
    expect(matchDynamicPage("/en/careers/sales-manager")).toMatchObject({ locale: "en", slug: "sales-manager", rule: { collection: "job-postings" } });
    expect(matchDynamicPage("/tuyen-dung")).toBeNull();
    expect(matchDynamicPage("/en/careers")).toBeNull();
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/careers/khong-co")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "job-postings", "en", "khong-co", { depth: 0 });
  });

  it("trang pháp lý: tra theo `kind` bằng findPublicOne; EN chưa duyệt (không có bản công khai) → 404 EN", async () => {
    findPublicOne.mockResolvedValueOnce({ id: "1" }).mockResolvedValueOnce(null);
    expect(await resolveMissingPage("/chinh-sach-bao-mat")).toBeNull();
    expect(await resolveMissingPage("/en/privacy-policy")).toBe("en");
    expect(findPublicOne).toHaveBeenNthCalledWith(2, {}, "pages", "en", { kind: { equals: "privacy" } }, { depth: 0 });
    expect(findPublicBySlug).not.toHaveBeenCalled();
  });

  it("dịch vụ: tra theo slug của ngôn ngữ URL", async () => {
    findPublicBySlug.mockResolvedValue(null);
    expect(await resolveMissingPage("/en/services/khong-co")).toBe("en");
    expect(findPublicBySlug).toHaveBeenCalledWith({}, "services", "en", "khong-co", { depth: 0 });
  });

  it("URL không phải trang động: không đụng DB", async () => {
    expect(await resolveMissingPage("/tin-tuc")).toBeNull();
    expect(await resolveMissingPage("/du-an")).toBeNull();
    expect(findPublicBySlug).not.toHaveBeenCalled();
  });

  it("slug sai mã hoá → coi là không có, không đụng DB", async () => {
    expect(await resolveMissingPage("/tin-tuc/%E0%A4%A")).toBe("vi");
    expect(findPublicBySlug).not.toHaveBeenCalled();
  });

  it("cache: có 60s, thiếu 10s (bài mới xuất bản không bị chặn lâu); hết TTL tra lại", async () => {
    findPublicBySlug.mockResolvedValue({ id: "1" });
    await resolveMissingPage("/tin-tuc/co");
    await resolveMissingPage("/tin-tuc/co");
    expect(findPublicBySlug).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(EXISTS_CACHE_TTL_MS + 1);
    await resolveMissingPage("/tin-tuc/co");
    expect(findPublicBySlug).toHaveBeenCalledTimes(2);

    findPublicBySlug.mockReset().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "2" });
    expect(await resolveMissingPage("/tin-tuc/moi")).toBe("vi");
    expect(await resolveMissingPage("/tin-tuc/moi")).toBe("vi");
    expect(findPublicBySlug).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(MISSING_CACHE_TTL_MS + 1);
    expect(await resolveMissingPage("/tin-tuc/moi")).toBeNull();
  });

  it("quá hạn hoặc lỗi DB → null (page tự xử lý) và không cache", async () => {
    findPublicBySlug.mockReturnValueOnce(new Promise(() => undefined)).mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(null);
    const pending = resolveMissingPage("/tin-tuc/x");
    await vi.advanceTimersByTimeAsync(MISSING_LOOKUP_TIMEOUT_MS + 1);
    expect(await pending).toBeNull();
    expect(await resolveMissingPage("/tin-tuc/x")).toBeNull();
    expect(await resolveMissingPage("/tin-tuc/x")).toBe("vi");
  });
});

/**
 * Review spec-validation layer 6 (G27): trang động MỚI mà quên thêm quy tắc sẽ quay lại 404 rỗng (Next 16 không SSR `notFound()` của page).
 * Duyệt mọi `page.tsx` dưới `app/(frontend)/[locale]` có đoạn động (`[slug]`, `[category]`...) và đòi khoá `pathnames` tương ứng có trong `MISSING_PAGE_RULES`.
 */
describe("MISSING_PAGE_RULES phủ mọi trang động", () => {
  const root = join(process.cwd(), "src", "app", "(frontend)", "[locale]");
  const dynamicPageKeys = (dir: string, prefix = ""): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) return dynamicPageKeys(join(dir, entry.name), `${prefix}/${entry.name}`);
      return entry.name === "page.tsx" && /[[a-z]+]/.test(prefix) ? [prefix] : [];
    });

  it("mỗi route động có quy tắc (thêm vào MISSING_PAGE_RULES khi làm trang mới)", () => {
    const keys = dynamicPageKeys(root);
    expect(keys.length).toBeGreaterThan(0);
    const covered = new Set<string>(MISSING_PAGE_RULES.map((rule) => rule.key));
    expect(keys.filter((key) => !covered.has(key))).toEqual([]);
  });
});
