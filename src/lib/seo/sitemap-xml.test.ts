import { describe, expect, it } from "vitest";

import { buildLocalizedUrls, DOCS_PER_SITEMAP, renderSitemapIndex, renderUrlset, SITEMAP_URL_LIMIT } from "./sitemap-xml";

const SITE = "https://tami.example";

describe("buildLocalizedUrls", () => {
  it("có cả vi và en: mỗi URL mang alternates vi, en, x-default (= vi) và lastmod", () => {
    const urls = buildLocalizedUrls({ vi: "/du-an/a", en: "/en/projects/a" }, SITE, "2026-10-01T00:00:00.000Z");
    expect(urls.map((url) => url.loc)).toEqual([`${SITE}/du-an/a`, `${SITE}/en/projects/a`]);
    for (const url of urls) {
      expect(url.lastmod).toBe("2026-10-01T00:00:00.000Z");
      expect(url.alternates).toEqual([
        { hreflang: "vi", href: `${SITE}/du-an/a` },
        { hreflang: "en", href: `${SITE}/en/projects/a` },
        { hreflang: "x-default", href: `${SITE}/du-an/a` },
      ]);
    }
  });

  it("chỉ có vi: một URL, không alternates", () => {
    expect(buildLocalizedUrls({ vi: "/du-an/a" }, SITE)).toEqual([{ loc: `${SITE}/du-an/a`, alternates: [] }]);
  });

  it("không có ngôn ngữ nào: rỗng", () => {
    expect(buildLocalizedUrls({}, SITE)).toEqual([]);
  });
});

describe("renderUrlset / renderSitemapIndex", () => {
  it("xuất xhtml:link, lastmod và escape ký tự đặc biệt", () => {
    const xml = renderUrlset(buildLocalizedUrls({ vi: "/a?x=1&y=2", en: "/en/a" }, SITE, "2026-10-01T00:00:00.000Z"));
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain("<loc>https://tami.example/a?x=1&amp;y=2</loc>");
    expect(xml).toContain("<lastmod>2026-10-01T00:00:00.000Z</lastmod>");
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://tami.example/a?x=1&amp;y=2"/>');
  });

  it("từ chối file vượt 50.000 URL", () => {
    const urls = Array.from({ length: SITEMAP_URL_LIMIT + 1 }, (_, index) => ({ loc: `${SITE}/${index}`, alternates: [] }));
    expect(() => renderUrlset(urls)).toThrow(/50000/);
  });

  it("một file chứa tối đa DOCS_PER_SITEMAP bản ghi x 2 ngôn ngữ vẫn dưới giới hạn", () => {
    expect(DOCS_PER_SITEMAP * 2).toBeLessThanOrEqual(SITEMAP_URL_LIMIT);
  });

  it("sitemap index liệt kê file con", () => {
    expect(renderSitemapIndex([`${SITE}/sitemaps/news-1.xml`])).toContain("<sitemap><loc>https://tami.example/sitemaps/news-1.xml</loc></sitemap>");
  });
});
