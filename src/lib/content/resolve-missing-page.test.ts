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
