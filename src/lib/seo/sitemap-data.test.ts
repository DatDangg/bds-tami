import { describe, expect, it, vi } from "vitest";

import type { Payload } from "payload";

import { countSectionChunks, docUrls, isSitemapSection, loadSectionUrls, parseSitemapFile, SITEMAP_SECTIONS } from "./sitemap-data";

const SITE = "https://tami.example";
const base = { slug: { vi: "du-an-a", en: "project-a" }, updatedAt: "2026-10-02T03:04:05.000Z" };

describe("docUrls", () => {
  it("hasEnglish = true: URL vi + en với lastmod = updatedAt", () => {
    const urls = docUrls({ ...base, hasEnglish: true }, "/du-an/[slug]", "slug", SITE);
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/du-an/du-an-a`, `${SITE}/en/projects/project-a`]);
    expect(urls[0]?.lastmod).toBe(base.updatedAt);
    expect(urls[0]?.alternates.map((alt) => alt.hreflang)).toEqual(["vi", "en", "x-default"]);
  });

  it("EN chưa dịch (hasEnglish false hoặc thiếu slug en): chỉ URL vi, không alternates", () => {
    for (const doc of [{ ...base, hasEnglish: false }, { ...base, hasEnglish: true, slug: { vi: "du-an-a" } }]) {
      const urls = docUrls(doc, "/du-an/[slug]", "slug", SITE);
      expect(urls).toHaveLength(1);
      expect(urls[0]?.alternates).toEqual([]);
    }
  });

  it("seo.noindex xét theo từng ngôn ngữ", () => {
    const enOnly = docUrls({ ...base, hasEnglish: true, seo: { vi: { noindex: true } } }, "/du-an/[slug]", "slug", SITE);
    expect(enOnly.map((url) => url.loc)).toEqual([`${SITE}/en/projects/project-a`]);
    const none = docUrls({ ...base, hasEnglish: true, seo: { vi: { noindex: true }, en: { noindex: true } } }, "/du-an/[slug]", "slug", SITE);
    expect(none).toEqual([]);
  });

  it("slug có ký tự đặc biệt được encode; danh mục dùng tham số category", () => {
    const urls = docUrls({ slug: { vi: "nhà/đẹp" }, hasEnglish: false }, "/tin-tuc/danh-muc/[category]", "category", SITE);
    expect(urls[0]?.loc).toBe(`${SITE}/tin-tuc/danh-muc/nh%C3%A0%2F%C4%91%E1%BA%B9p`);
  });
});

describe("nhóm categories-rentals (trang danh mục Cho thuê S05)", () => {
  const now = new Date("2026-10-18T00:00:00.000Z");
  const docs = [
    { slug: { vi: "can-ho", en: "apartment" }, hasEnglish: true, updatedAt: "2026-10-01T00:00:00.000Z" },
    { slug: { vi: "nha-pho", en: "townhouse" }, hasEnglish: false },
    { slug: { vi: "an", en: "hidden" }, hasEnglish: true, seo: { vi: { noindex: true }, en: { noindex: true } } },
  ];
  const find = vi.fn<(args: unknown) => Promise<{ docs: typeof docs }>>(async () => ({ docs }));
  const count = vi.fn<(args: unknown) => Promise<{ totalDocs: number }>>(async () => ({ totalDocs: 3 }));
  const payload = { find, count } as unknown as Payload;

  it("là nhóm hợp lệ; truy vấn scope rental, chỉ bản ghi công khai chưa xoá mềm, đọc như khách", async () => {
    expect(isSitemapSection("categories-rentals")).toBe(true);
    expect(parseSitemapFile("categories-rentals-1.xml")).toEqual({ section: "categories-rentals", chunk: 1 });
    await loadSectionUrls(payload, "categories-rentals", 1, SITE, now);
    const args = find.mock.calls[0]![0] as { collection: string; where: unknown; overrideAccess: boolean; trash: boolean };
    expect(args).toMatchObject({ collection: "categories", overrideAccess: false, trash: false });
    expect(JSON.stringify(args.where)).toContain('"scope":{"equals":"rental"}');
    expect(JSON.stringify(args.where)).toContain("deletedAt");
  });

  it("URL: vi luôn có, en chỉ khi hasEnglish, loại danh mục seo.noindex", async () => {
    const urls = await loadSectionUrls(payload, "categories-rentals", 1, SITE, now);
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/cho-thue/danh-muc/can-ho`, `${SITE}/en/for-rent/category/apartment`, `${SITE}/cho-thue/danh-muc/nha-pho`]);
  });

  it("đếm số file theo cùng điều kiện", async () => {
    expect(await countSectionChunks(payload, "categories-rentals", now)).toBe(1);
    expect(JSON.stringify((count.mock.calls[0]![0] as { where: unknown }).where)).toContain('"scope":{"equals":"rental"}');
  });
});

describe("nhóm categories-projects (trang danh mục Dự án S05, BL-090)", () => {
  const now = new Date("2026-10-28T00:00:00.000Z");
  const docs = [
    { slug: { vi: "can-ho-chung-cu", en: "apartments" }, hasEnglish: true, updatedAt: "2026-10-01T00:00:00.000Z" },
    { slug: { vi: "khu-do-thi", en: "urban-areas" }, hasEnglish: false },
  ];
  const find = vi.fn<(args: unknown) => Promise<{ docs: typeof docs }>>(async () => ({ docs }));
  const count = vi.fn<(args: unknown) => Promise<{ totalDocs: number }>>(async () => ({ totalDocs: 2 }));
  const payload = { find, count } as unknown as Payload;

  it("là nhóm hợp lệ (có trong sitemap index); truy vấn scope project", async () => {
    expect(isSitemapSection("categories-projects")).toBe(true);
    expect(SITEMAP_SECTIONS).toContain("categories-projects");
    expect(parseSitemapFile("categories-projects-1.xml")).toEqual({ section: "categories-projects", chunk: 1 });
    await loadSectionUrls(payload, "categories-projects", 1, SITE, now);
    const args = find.mock.calls[0]![0] as { collection: string; where: unknown };
    expect(args.collection).toBe("categories");
    expect(JSON.stringify(args.where)).toContain('"scope":{"equals":"project"}');
  });

  it("URL: vi luôn có, en chỉ khi hasEnglish", async () => {
    const urls = await loadSectionUrls(payload, "categories-projects", 1, SITE, now);
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/du-an/danh-muc/can-ho-chung-cu`, `${SITE}/en/projects/category/apartments`, `${SITE}/du-an/danh-muc/khu-do-thi`]);
    expect(await countSectionChunks(payload, "categories-projects", now)).toBe(1);
  });
});

describe("parseSitemapFile / isSitemapSection", () => {
  it("nhận nhóm-số.xml, loại định dạng sai và chunk 0", () => {
    expect(parseSitemapFile("property-posts-12.xml")).toEqual({ section: "property-posts", chunk: 12 });
    for (const bad of ["news-0.xml", "news.xml", "news-1.xml.gz", "../x-1.xml", "News-1.xml"]) expect(parseSitemapFile(bad)).toBeNull();
  });

  it("allowlist nhóm: không có nhóm nội bộ (staff, leads...)", () => {
    expect(isSitemapSection("rentals")).toBe(true);
    for (const name of ["staff", "leads", "media", "admin"]) expect(isSitemapSection(name)).toBe(false);
  });
});
