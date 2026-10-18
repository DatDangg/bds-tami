import { beforeEach, describe, expect, it, vi } from "vitest";

const findPublicBySlug = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const findPublicOne = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const findLocalizedSlugs = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<{ vi?: string; en?: string }>>());
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock("../content/public-queries", () => ({ findPublicBySlug, findPublicOne }));
vi.mock("../news/news-queries", () => ({ findLocalizedSlugs }));
vi.mock("../logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { resolveCounterpartPath } from "./resolve-counterpart";

beforeEach(() => {
  findPublicBySlug.mockReset();
  findPublicOne.mockReset();
  findLocalizedSlugs.mockReset();
});

describe("resolveCounterpartPath: bản ghi có bản dịch", () => {
  it("/en/for-rent/<slug-en> → /cho-thue/<slug-vi> (tra theo id, slug mỗi ngôn ngữ khác nhau)", async () => {
    findPublicBySlug.mockResolvedValue({ id: "r1", hasEnglish: true });
    findLocalizedSlugs.mockResolvedValue({ vi: "can-ho-a", en: "apartment-a" });
    await expect(resolveCounterpartPath("/en/for-rent/apartment-a", "vi")).resolves.toBe("/cho-thue/can-ho-a");
    expect(findPublicBySlug).toHaveBeenCalledWith(expect.anything(), "rentals", "en", "apartment-a", expect.anything());
    expect(findLocalizedSlugs).toHaveBeenCalledWith(expect.anything(), "rentals", "r1");
  });

  it("/du-an/<slug-vi> → /en/projects/<slug-en>", async () => {
    findPublicBySlug.mockResolvedValue({ id: "p1", hasEnglish: true });
    findLocalizedSlugs.mockResolvedValue({ vi: "du-an-a", en: "project-a" });
    await expect(resolveCounterpartPath("/du-an/du-an-a", "en")).resolves.toBe("/en/projects/project-a");
  });

  it("danh mục tin tức giữ điều kiện scope của quy tắc", async () => {
    findPublicBySlug.mockResolvedValue({ id: "c1", hasEnglish: true });
    findLocalizedSlugs.mockResolvedValue({ vi: "thi-truong", en: "market" });
    await expect(resolveCounterpartPath("/tin-tuc/danh-muc/thi-truong", "en")).resolves.toBe("/en/news/category/market");
    expect(findPublicBySlug).toHaveBeenCalledWith(expect.anything(), "categories", "vi", "thi-truong", { depth: 0, where: { scope: { equals: "news" } } });
  });
});

describe("resolveCounterpartPath: chưa có bản dịch → danh sách/trang chủ (FR-PUB-18, BR-07)", () => {
  it("hasEnglish tắt dù có slug en → danh sách EN, không trỏ tới trang EN 404", async () => {
    findPublicBySlug.mockResolvedValue({ id: "r1", hasEnglish: false });
    findLocalizedSlugs.mockResolvedValue({ vi: "can-ho-a", en: "apartment-a" });
    await expect(resolveCounterpartPath("/cho-thue/can-ho-a", "en")).resolves.toBe("/en/for-rent");
  });

  it("hasEnglish bật nhưng thiếu slug en → danh sách EN", async () => {
    findPublicBySlug.mockResolvedValue({ id: "n1", hasEnglish: true });
    findLocalizedSlugs.mockResolvedValue({ vi: "bai-a" });
    await expect(resolveCounterpartPath("/tin-tuc/bai-a", "en")).resolves.toBe("/en/news");
  });

  it("thiếu slug vi khi đang xem EN → danh sách VI", async () => {
    findPublicBySlug.mockResolvedValue({ id: "n1", hasEnglish: true });
    findLocalizedSlugs.mockResolvedValue({ en: "post-a" });
    await expect(resolveCounterpartPath("/en/news/post-a", "vi")).resolves.toBe("/tin-tuc");
  });

  it("bản ghi không còn công khai / slug lạ → danh sách; dịch vụ (không có danh sách) → trang chủ", async () => {
    findPublicBySlug.mockResolvedValue(null);
    await expect(resolveCounterpartPath("/tuyen-dung/khong-co", "en")).resolves.toBe("/en/careers");
    await expect(resolveCounterpartPath("/dich-vu/khong-co", "en")).resolves.toBe("/en");
    expect(findLocalizedSlugs).not.toHaveBeenCalled();
  });

  it("route có tham số nhưng chưa có quy tắc tra (khu vực) → danh sách", async () => {
    await expect(resolveCounterpartPath("/cho-thue/khu-vuc/ha-noi", "en")).resolves.toBe("/en/for-rent");
    expect(findPublicBySlug).not.toHaveBeenCalled();
  });
});

describe("resolveCounterpartPath: trang pháp lý (route cố định, tra theo kind)", () => {
  it("có bản EN → /en/privacy-policy; hasEnglish tắt hoặc không có trang → trang chủ EN", async () => {
    findPublicOne.mockResolvedValue({ hasEnglish: true });
    await expect(resolveCounterpartPath("/chinh-sach-bao-mat", "en")).resolves.toBe("/en/privacy-policy");
    expect(findPublicOne).toHaveBeenCalledWith(expect.anything(), "pages", "vi", { kind: { equals: "privacy" } }, expect.anything());
    findPublicOne.mockResolvedValue({ hasEnglish: false });
    await expect(resolveCounterpartPath("/dieu-khoan-su-dung", "en")).resolves.toBe("/en");
    findPublicOne.mockResolvedValue(null);
    await expect(resolveCounterpartPath("/chinh-sach-bao-mat", "en")).resolves.toBe("/en");
  });

  it("đang xem EN → sang VI về trang pháp lý VI nếu trang EN còn công khai", async () => {
    findPublicOne.mockResolvedValue({ hasEnglish: true });
    await expect(resolveCounterpartPath("/en/terms-of-use", "vi")).resolves.toBe("/dieu-khoan-su-dung");
  });
});

describe("resolveCounterpartPath: trang cố định và đầu vào xấu", () => {
  it("trang cố định không đụng DB; đường dẫn lạ → trang chủ đích", async () => {
    await expect(resolveCounterpartPath("/en/contact", "vi")).resolves.toBe("/lien-he");
    await expect(resolveCounterpartPath("/khong-co", "en")).resolves.toBe("/en");
    expect(findPublicBySlug).not.toHaveBeenCalled();
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "/cho-thue/x/../../evil"])("%s không bao giờ thành Location ngoài site", async (input) => {
    const result = await resolveCounterpartPath(input, "en");
    expect(result.startsWith("/") && !result.startsWith("//")).toBe(true);
  });
});
