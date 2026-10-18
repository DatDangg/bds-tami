import { describe, expect, it } from "vitest";

import { docUrls, isSitemapSection, parseSitemapFile } from "./sitemap-data";

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
